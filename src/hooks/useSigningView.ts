'use client'

import { useCallback, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Envelope } from '@/lib/api/envelopes'
import { getEnvelopeVariant } from '@/app/dashboard/envelopes/envelope-card-utils'
import type { SigningEnvelopeResponse, SigningView, SigningViewStatus, SigningViewStep } from '@/hooks/signing/types'

interface UseSigningViewOptions {
  envelope?: SigningEnvelopeResponse | Envelope | null
  currentUserId?: string
  isDashboard: boolean
  isLoading?: boolean
}

function idsMatch(a?: string, b?: string): boolean {
  if (!a || !b) return false
  return String(a) === String(b)
}

function parseStep(raw: string | null): SigningViewStep | null {
  if (raw === 'landing' || raw === 'review' || raw === 'sign') return raw
  return null
}

function parseStatus(raw: string | null): SigningViewStatus | null {
  if (
    raw === 'waiting' ||
    raw === 'processing' ||
    raw === 'complete' ||
    raw === 'declined' ||
    raw === 'cancelled'
  ) {
    return raw
  }
  return null
}

function getUserSignatureRecord(
  envelope: SigningEnvelopeResponse | Envelope | null | undefined,
  currentUserId?: string,
) {
  if (!envelope || !currentUserId) return undefined
  return envelope.signatures?.find((s) => idsMatch(s.signer, currentUserId))
}

export function deriveSigningView(
  envelope: SigningEnvelopeResponse | Envelope | null | undefined,
  currentUserId: string | undefined,
  isDashboard: boolean,
  urlStep: SigningViewStep | null,
  urlStatus: SigningViewStatus | null,
): SigningView {
  const status = (envelope?.status ?? '').toLowerCase()

  if (status.includes('reject') || status.includes('cancel') || status.includes('void')) {
    return { kind: 'status', status: 'cancelled' }
  }

  if (status.includes('complete')) {
    return { kind: 'status', status: 'complete' }
  }

  const mySignature = getUserSignatureRecord(envelope, currentUserId)
  if (mySignature?.status === 'rejected') {
    return { kind: 'status', status: 'declined' }
  }
  if (mySignature?.status === 'processing') {
    return { kind: 'status', status: 'processing' }
  }
  if (mySignature?.status === 'signed') {
    return { kind: 'status', status: 'complete' }
  }

  const myRecipient = envelope?.recipients?.find((r) => idsMatch(r.id, currentUserId))
  if (myRecipient?.status === 'rejected') {
    return { kind: 'status', status: 'declined' }
  }
  if (myRecipient?.status === 'signed') {
    return { kind: 'status', status: 'complete' }
  }

  const tokenRecipient = (envelope as unknown as {
    recipient?: { is_current_signer?: boolean; has_already_signed?: boolean }
  })?.recipient

  if (tokenRecipient?.has_already_signed) {
    return { kind: 'status', status: 'complete' }
  }

  if (urlStatus === 'processing') {
    return { kind: 'status', status: 'processing' }
  }
  if (urlStatus === 'complete') {
    return { kind: 'status', status: 'complete' }
  }

  const isCurrentSigner =
    idsMatch(envelope?.current_signer?.id, currentUserId) ||
    Boolean(tokenRecipient?.is_current_signer)
  const variant = envelope ? getEnvelopeVariant(envelope as Envelope, currentUserId) : 'pending'

  if (!isCurrentSigner || (variant !== 'your-turn' && !tokenRecipient?.is_current_signer)) {
    return { kind: 'status', status: 'waiting' }
  }

  return { kind: 'step', step: 'sign' }
}

export function useSigningView({
  envelope,
  currentUserId,
  isDashboard,
  isLoading = false,
}: UseSigningViewOptions) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlStep = parseStep(searchParams?.get('step') ?? null)
  const urlStatus = parseStatus(searchParams?.get('status') ?? null)

  const canonicalView = useMemo(
    () => deriveSigningView(envelope, currentUserId, isDashboard, urlStep, urlStatus),
    [envelope, currentUserId, isDashboard, urlStep, urlStatus],
  )

  const buildUrl = useCallback(
    (view: SigningView) => {
      const base = isDashboard
        ? `/dashboard/envelopes/${envelope?.id}/sign`
        : `/envelopes/${envelope?.id}/sign`
      const params = new URLSearchParams()
      const token =
        searchParams?.get('token') ||
        (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('token') : null)
      if (token) {
        params.set('token', token)
      }
      if (view.kind === 'status') {
        params.set('status', view.status)
      } else {
        params.set('step', view.step)
      }
      return `${base}?${params.toString()}`
    },
    [envelope?.id, isDashboard, searchParams],
  )

  const navigateToView = useCallback(
    (view: SigningView) => {
      if (!envelope?.id) return
      router.replace(buildUrl(view))
    },
    [buildUrl, envelope?.id, router],
  )

  useEffect(() => {
    if (isLoading || !envelope?.id) return

    const canonicalUrl = buildUrl(canonicalView)
    const currentStatus = searchParams?.get('status')
    const currentStep = searchParams?.get('step')

    if (canonicalView.kind === 'status') {
      if (currentStatus !== canonicalView.status || currentStep) {
        router.replace(canonicalUrl)
      }
      return
    }

    if (currentStatus) {
      router.replace(canonicalUrl)
      return
    }

    if (currentStep !== canonicalView.step) {
      router.replace(canonicalUrl)
    }
  }, [buildUrl, canonicalView, envelope?.id, isLoading, router, searchParams])

  const goToLanding = () => navigateToView({ kind: 'step', step: 'landing' })
  const goToReview = () => navigateToView({ kind: 'step', step: 'review' })
  const goToSign = () => navigateToView({ kind: 'step', step: 'sign' })
  const goToStatus = (status: SigningViewStatus) => navigateToView({ kind: 'status', status })

  return {
    view: canonicalView,
    navigateToView,
    goToLanding,
    goToReview,
    goToSign,
    goToStatus,
    buildUrl,
  }
}
