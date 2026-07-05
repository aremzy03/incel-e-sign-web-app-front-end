'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  getSigningJob,
  retrySigningJob,
  type SigningJobDetail,
  type SigningJobStatus,
} from '@/lib/api/signatures'
import { SigningFailedError } from '@/lib/api/signing-errors'
import { clearSigningJob, saveSigningJob } from '@/lib/signing/signing-job-storage'

export type SigningJobPollerPhase =
  | 'idle'
  | 'polling'
  | 'succeeded'
  | 'failed'
  | 'timeout'

const TERMINAL_STATUSES: SigningJobStatus[] = ['succeeded', 'failed']

interface UseSigningJobPollerOptions {
  jobId: string | null
  envelopeId: string
  pollIntervalMs?: number
  maxDurationMs?: number
  enabled?: boolean
  /** When true, never block UI on timeout — keep polling silently in the background. */
  background?: boolean
  onSucceeded?: (job: SigningJobDetail) => void
  onFailed?: (error: SigningFailedError) => void
  onTimeout?: (jobId: string) => void
}

function isTerminal(status: SigningJobStatus): boolean {
  return TERMINAL_STATUSES.includes(status)
}

export function useSigningJobPoller({
  jobId,
  envelopeId,
  pollIntervalMs = 2000,
  maxDurationMs = 120_000,
  enabled = true,
  background = false,
  onSucceeded,
  onFailed,
  onTimeout,
}: UseSigningJobPollerOptions) {
  const queryClient = useQueryClient()
  const [phase, setPhase] = useState<SigningJobPollerPhase>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [resumeToken, setResumeToken] = useState(0)
  const startedAtRef = useRef<number | null>(null)
  const callbacksRef = useRef({ onSucceeded, onFailed, onTimeout })
  callbacksRef.current = { onSucceeded, onFailed, onTimeout }

  const invalidateEnvelopeQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['sign-envelope', envelopeId] })
    queryClient.invalidateQueries({ queryKey: ['envelope', envelopeId] })
    queryClient.invalidateQueries({ queryKey: ['envelopeDocuments', envelopeId] })
    queryClient.invalidateQueries({ queryKey: ['envelopes'] })
  }, [envelopeId, queryClient])

  const handleJobResult = useCallback(
    (job: SigningJobDetail): boolean => {
      if (job.status === 'succeeded') {
        clearSigningJob(envelopeId)
        setPhase('succeeded')
        setErrorMessage(null)
        invalidateEnvelopeQueries()
        callbacksRef.current.onSucceeded?.(job)
        return true
      }

      if (job.status === 'failed') {
        clearSigningJob(envelopeId)
        const message = job.error_message || 'Signing failed. Please try again.'
        setPhase('failed')
        setErrorMessage(message)
        callbacksRef.current.onFailed?.(new SigningFailedError(message, job.id))
        return true
      }

      return false
    },
    [envelopeId, invalidateEnvelopeQueries],
  )

  const keepWaiting = useCallback(() => {
    if (!jobId) return
    startedAtRef.current = Date.now()
    setPhase('polling')
    setErrorMessage(null)
    setResumeToken((token) => token + 1)
  }, [jobId])

  const retry = useCallback(async () => {
    if (!jobId) return
    try {
      await retrySigningJob(jobId)
      saveSigningJob(envelopeId, jobId)
      startedAtRef.current = Date.now()
      setPhase('polling')
      setErrorMessage(null)
      setResumeToken((token) => token + 1)
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        'Failed to retry signing job'
      setPhase('failed')
      setErrorMessage(message)
    }
  }, [envelopeId, jobId])

  useEffect(() => {
    if (!enabled || !jobId || !envelopeId) {
      setPhase('idle')
      return
    }

    saveSigningJob(envelopeId, jobId)
    startedAtRef.current = Date.now()
    setPhase('polling')
    setErrorMessage(null)

    let cancelled = false
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    const scheduleNext = () => {
      timeoutId = setTimeout(runPoll, pollIntervalMs)
    }

    const runPoll = async () => {
      if (cancelled) return

      const elapsed = startedAtRef.current ? Date.now() - startedAtRef.current : 0
      if (elapsed >= maxDurationMs) {
        if (background) {
          startedAtRef.current = Date.now()
          scheduleNext()
          return
        }
        setPhase('timeout')
        callbacksRef.current.onTimeout?.(jobId)
        return
      }

      try {
        const job = await getSigningJob(jobId)
        if (cancelled) return

        if (handleJobResult(job)) {
          return
        }

        if (!isTerminal(job.status)) {
          scheduleNext()
        }
      } catch (err: unknown) {
        if (cancelled) return
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          (err as Error)?.message ||
          'Failed to check signing status'
        setPhase('failed')
        setErrorMessage(message)
        callbacksRef.current.onFailed?.(new SigningFailedError(message, jobId))
      }
    }

    void runPoll()

    return () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [
    enabled,
    jobId,
    envelopeId,
    pollIntervalMs,
    maxDurationMs,
    handleJobResult,
    resumeToken,
  ])

  return {
    phase,
    isPolling: phase === 'polling',
    errorMessage,
    keepWaiting,
    retry,
  }
}
