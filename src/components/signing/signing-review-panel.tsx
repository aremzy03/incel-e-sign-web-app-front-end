'use client'

import type { Envelope } from '@/lib/api/envelopes'
import { MaterialIcon } from '@/components/ui/material-icon'
import { Button } from '@/components/ui/button'
import { SigningSignerTimeline } from './signing-signer-timeline'
import { SigningTrustBadges } from './signing-trust-badges'

interface SigningReviewPanelProps {
  envelope: Envelope
  currentUserId?: string
  signerName?: string
  signerEmail?: string
  onContinue: () => void
  onDecline?: () => void
  onViewDetails?: () => void
}

export function SigningReviewPanel({
  envelope,
  currentUserId,
  signerName,
  signerEmail,
  onContinue,
  onDecline,
  onViewDetails,
}: SigningReviewPanelProps) {
  const creatorName =
    envelope.creator?.full_name || (envelope as { creator_name?: string }).creator_name || 'Sender'

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-32 md:pb-12">
      <div className="mx-auto flex w-full max-w-3xl flex-col px-4 py-8 md:px-8">
        {signerName ? (
          <div className="mb-4 flex justify-end">
            <div className="text-right">
              <span className="font-label-sm text-label-sm text-on-surface">Signer: {signerName}</span>
              {signerEmail ? (
                <p className="font-caption-xs text-caption-xs text-muted">{signerEmail}</p>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm md:p-8">
          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary-fixed text-on-secondary-fixed">
              <MaterialIcon name="description" size={24} />
            </div>
            <div>
              <p className="font-label-sm text-label-sm uppercase tracking-wider text-muted">
                Action required
              </p>
              <h1 className="font-headline-xl text-headline-xl text-primary">
                {creatorName} requested your signature
              </h1>
              <p className="mt-1 font-body-base text-body-base text-on-surface-variant">
                {envelope.name || 'Document'}
              </p>
            </div>
          </div>

          <div className="mb-8 flex items-center gap-3 rounded-lg border border-outline-variant/30 bg-surface-container p-4">
            <MaterialIcon name="lock" fill size={20} className="text-primary" />
            <span className="font-label-sm text-label-sm text-on-surface">Secure and legally binding</span>
            <span className="ml-auto font-caption-xs text-caption-xs text-muted">ID: {envelope.id}</span>
          </div>

          <div className="mb-8">
            <h2 className="mb-4 font-label-sm text-label-sm uppercase tracking-wider text-muted">
              Signing order
            </h2>
            <SigningSignerTimeline envelope={envelope} currentUserId={currentUserId} variant="landing" />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              type="button"
              onClick={onContinue}
              className="h-12 flex-1 gap-2 bg-status-your-turn font-bold text-white hover:bg-accent-hover"
            >
              <MaterialIcon name="edit_document" size={20} />
              Continue to sign
            </Button>
            {onViewDetails ? (
              <Button type="button" variant="outline" onClick={onViewDetails} className="h-12">
                View details
              </Button>
            ) : null}
          </div>

          {onDecline ? (
            <button
              type="button"
              onClick={onDecline}
              className="mt-4 flex w-full items-center justify-center gap-2 py-2 font-label-sm text-label-sm text-error hover:underline"
            >
              <MaterialIcon name="warning" size={18} />
              Decline to sign
            </button>
          ) : null}
        </div>

        <SigningTrustBadges />
      </div>
    </div>
  )
}
