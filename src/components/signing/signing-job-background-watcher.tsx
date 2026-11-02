'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { MaterialIcon } from '@/components/ui/material-icon'
import { Button } from '@/components/ui/button'
import { useSigningJobPoller } from '@/hooks/signing/useSigningJobPoller'
import {
  clearSigningJob,
  listStoredSigningJobs,
  SIGNING_JOB_UPDATED_EVENT,
  type StoredSigningJob,
} from '@/lib/signing/signing-job-storage'

interface SigningJobItemPollerProps {
  job: StoredSigningJob
  onSucceeded: (envelopeId: string) => void
  onRemove: (envelopeId: string) => void
}

function SigningJobItemPoller({ job, onSucceeded, onRemove }: SigningJobItemPollerProps) {
  const [completed, setCompleted] = useState(false)

  const poller = useSigningJobPoller({
    jobId: job.jobId,
    envelopeId: job.envelopeId,
    token: job.token,
    enabled: !completed,
    background: true,
    onSucceeded: () => {
      setCompleted(true)
      onSucceeded(job.envelopeId)
      window.setTimeout(() => {
        onRemove(job.envelopeId)
      }, 2500)
    },
    onFailed: () => {
      // Keep item visible in the floating widget so user can retry or dismiss
    },
  })

  const label = job.envelopeName || `Envelope ${job.envelopeId.slice(0, 8)}`
  const isFailed = poller.phase === 'failed'

  return (
    <div
      className="flex flex-col gap-2 rounded-lg border border-outline-variant/60 bg-surface-container-low/60 px-3 py-2.5 text-xs transition-all duration-200"
      data-testid={`signing-job-toast-item-${job.envelopeId}`}
    >
      <div className="flex items-center gap-2.5">
        {completed ? (
          <MaterialIcon
            name="check_circle"
            fill
            size={16}
            className="shrink-0 text-status-completed animate-in zoom-in-75 fade-in duration-200"
          />
        ) : isFailed ? (
          <MaterialIcon name="error" size={16} className="shrink-0 text-error" />
        ) : (
          <span
            className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-primary border-t-transparent"
            aria-hidden="true"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-label-sm text-label-sm font-medium text-on-surface">
            {label}
          </p>
          <p className="truncate font-caption-xs text-caption-xs text-muted">
            {completed
              ? 'Signature embedded'
              : isFailed
                ? poller.errorMessage || 'Signing failed'
                : 'Embedding signature in background…'}
          </p>
        </div>
      </div>

      {isFailed ? (
        <div className="flex items-center justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => {
              clearSigningJob(job.envelopeId)
              onRemove(job.envelopeId)
            }}
          >
            Dismiss
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-7 px-2.5 text-xs"
            onClick={() => void poller.retry()}
          >
            Retry
          </Button>
        </div>
      ) : null}
    </div>
  )
}

/**
 * Polls all active signing jobs from session storage concurrently and renders
 * a compact, non-blocking floating toast widget showing job progress.
 */
export function SigningJobBackgroundWatcher() {
  const [activeJobs, setActiveJobs] = useState<StoredSigningJob[]>([])
  const completedIdsRef = useRef<Set<string>>(new Set())

  const refreshActiveJobs = useCallback(() => {
    const jobs = listStoredSigningJobs()
    setActiveJobs((prev) => {
      const byEnvelope = new Map<string, StoredSigningJob>()
      for (const j of jobs) {
        byEnvelope.set(j.envelopeId, j)
      }
      // Keep recently-completed items visible until their 2.5s auto-dismiss timer fires
      for (const existing of prev) {
        if (!byEnvelope.has(existing.envelopeId) && completedIdsRef.current.has(existing.envelopeId)) {
          byEnvelope.set(existing.envelopeId, existing)
        }
      }
      return Array.from(byEnvelope.values())
    })
  }, [])

  const handleJobSucceeded = useCallback((envelopeId: string) => {
    completedIdsRef.current.add(envelopeId)
  }, [])

  const handleRemoveJob = useCallback((envelopeId: string) => {
    completedIdsRef.current.delete(envelopeId)
    clearSigningJob(envelopeId)
    setActiveJobs((prev) => prev.filter((j) => j.envelopeId !== envelopeId))
  }, [])

  useEffect(() => {
    refreshActiveJobs()
    window.addEventListener(SIGNING_JOB_UPDATED_EVENT, refreshActiveJobs)
    return () => window.removeEventListener(SIGNING_JOB_UPDATED_EVENT, refreshActiveJobs)
  }, [refreshActiveJobs])

  if (activeJobs.length === 0) return null

  return (
    <div
      className="fixed top-4 right-4 z-[90] w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-outline-variant bg-surface-container-lowest p-3 shadow-xl"
      role="status"
      aria-live="polite"
      aria-label="Active signing jobs"
      data-testid="signing-jobs-floating-widget"
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="font-label-xs text-label-xs font-semibold uppercase tracking-wider text-muted">
          Signing Jobs ({activeJobs.length})
        </span>
      </div>
      <div className="flex max-h-60 flex-col gap-2 overflow-y-auto">
        {activeJobs.map((job) => (
          <SigningJobItemPoller
            key={`${job.envelopeId}:${job.jobId}`}
            job={job}
            onSucceeded={handleJobSucceeded}
            onRemove={handleRemoveJob}
          />
        ))}
      </div>
    </div>
  )
}
