'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSigningJobPoller } from './useSigningJobPoller'
import type { useSignActions } from './useSignActions'
import type { SignMutationResult } from './useSignActions'

export type SigningSubmitPhase =
  | 'idle'
  | 'submitting'
  | 'polling'
  | 'timeout'
  | 'failed'
  | 'succeeded'

export type SigningSubmitOverlayPhase = 'polling' | 'timeout' | 'failed'

type SignActionsReturn = ReturnType<typeof useSignActions>

interface UseSigningSubmitOptions {
  envelopeId?: string
  signActions: SignActionsReturn
  onSignComplete: () => void
  onSignQueued?: (result: Extract<SignMutationResult, { kind: 'queued' }>) => void
  token?: string
}

export function useSigningSubmit({
  envelopeId,
  signActions,
  onSignComplete,
  onSignQueued,
  token,
}: UseSigningSubmitOptions) {
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [phase, setPhase] = useState<SigningSubmitPhase>('idle')

  const poller = useSigningJobPoller({
    jobId: activeJobId,
    envelopeId: envelopeId ?? '',
    enabled: !!activeJobId && !!envelopeId,
    background: true,
    token,
    onSucceeded: () => {
      setPhase('succeeded')
      setActiveJobId(null)
      onSignComplete()
    },
    onFailed: () => {
      setPhase('failed')
    },
    onTimeout: () => {
      setPhase('timeout')
    },
  })

  const isSigningInFlight =
    phase === 'submitting' ||
    signActions.signMutation.isPending ||
    signActions.saveValuesMutation.isPending

  const submitSign = useCallback(async (): Promise<SignMutationResult | null> => {
    setPhase('submitting')
    const result = await signActions.approveAndSign()
    if (!result) {
      setPhase('idle')
      return null
    }
    if (result.kind === 'already_signed') {
      setPhase('succeeded')
      onSignComplete()
      return result
    }
    setActiveJobId(result.jobId)
    setPhase('polling')
    onSignQueued?.(result)
    return result
  }, [onSignComplete, onSignQueued, signActions])

  const retry = useCallback(async () => {
    await poller.retry()
    setPhase('polling')
  }, [poller])

  const keepWaiting = useCallback(() => {
    poller.keepWaiting()
    setPhase('polling')
  }, [poller])

  const dismissFailure = useCallback(() => {
    setPhase('idle')
    setActiveJobId(null)
  }, [])

  useEffect(() => {
    if (phase === 'polling' && poller.phase === 'timeout') {
      setPhase('timeout')
    }
    if (phase === 'polling' && poller.phase === 'failed') {
      setPhase('failed')
    }
  }, [phase, poller.phase])

  const overlayPhase: SigningSubmitOverlayPhase =
    phase === 'timeout'
      ? 'timeout'
      : phase === 'failed'
        ? 'failed'
        : 'polling'

  const showOverlay = false

  return {
    phase,
    overlayPhase,
    showOverlay,
    isSigningInFlight,
    submitSign,
    retry,
    keepWaiting,
    dismissFailure,
    errorMessage: poller.errorMessage,
  }
}
