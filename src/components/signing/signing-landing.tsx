'use client'

import type { Envelope } from '@/lib/api/envelopes'
import { MaterialIcon } from '@/components/ui/material-icon'
import { Button } from '@/components/ui/button'
import { SigningSignerTimeline } from './signing-signer-timeline'
import { SigningTrustBadges } from './signing-trust-badges'

interface SigningLandingProps {
  envelope: Envelope
  currentUserId?: string
  signerName?: string
  signerEmail?: string
  onReviewSign: () => void
  onDecline: () => void
  onViewDetails?: () => void
}

export function SigningLanding({
  envelope,
  currentUserId,
  signerName,
  signerEmail,
  onReviewSign,
  onDecline,
  onViewDetails,
}: SigningLandingProps) {
  const creatorName =
    envelope.creator?.full_name || (envelope as { creator_name?: string }).creator_name || 'Sender'

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-32 md:pb-12">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center px-4 py-8 md:px-8">
        {signerName ? (
          <div className="mb-6 hidden w-full items-end justify-end md:flex">
            <div className="flex flex-col items-end">
              <span className="font-label-sm text-label-sm text-on-surface">Signer: {signerName}</span>
              {signerEmail ? (
                <span className="font-caption-xs text-caption-xs text-muted">{signerEmail}</span>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="w-full overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-12">
            <div className="relative min-h-[240px] md:col-span-5 md:min-h-full">
              <div className="absolute inset-0 z-0 bg-primary-container" />
              <div className="relative z-10 flex h-full min-h-[240px] flex-col justify-end p-8 text-on-primary">
                <div className="rounded-lg border border-white/10 bg-primary/60 p-4 backdrop-blur-md">
                  <span className="font-label-sm text-label-sm uppercase tracking-widest opacity-80">
                    Action Required
                  </span>
                  <h2 className="mt-1 font-headline-lg text-headline-lg">
                    {creatorName} has requested your signature
                  </h2>
                </div>
              </div>
            </div>

            <div className="flex flex-col p-8 md:col-span-7 md:p-12">
              <div className="mb-8">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-fixed text-on-secondary-fixed">
                    <MaterialIcon name="description" size={24} />
                  </div>
                  <div>
                    <h1 className="font-headline-xl text-headline-xl text-primary">
                      {creatorName} has requested your signature
                    </h1>
                    <p className="mt-1 font-body-base text-body-base text-on-surface-variant">
                      {envelope.name || 'Document'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-outline-variant/30 bg-surface-container p-4">
                  <div className="flex items-center gap-3">
                    <MaterialIcon name="lock" fill size={20} className="text-primary" />
                    <span className="font-label-sm text-label-sm text-on-surface">Secure & Legally Binding</span>
                  </div>
                  <span className="font-caption-xs text-caption-xs text-muted">ID: {envelope.id}</span>
                </div>
              </div>

              <div className="mb-12 space-y-6">
                <h3 className="font-label-sm text-label-sm uppercase tracking-wider text-muted">Signing Order</h3>
                <SigningSignerTimeline envelope={envelope} currentUserId={currentUserId} variant="landing" />
              </div>

              <div className="space-y-4 md:mt-auto">
                <Button
                  type="button"
                  onClick={onReviewSign}
                  className="hidden h-12 w-full gap-2 bg-status-your-turn font-bold text-white shadow-md hover:bg-accent-hover md:flex"
                >
                  <MaterialIcon name="edit_document" size={20} />
                  Review & Sign Document
                </Button>
                <div className="flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={onDecline}
                    className="flex items-center gap-2 py-2 font-label-sm text-label-sm text-error hover:underline"
                  >
                    <MaterialIcon name="warning" size={18} />
                    Decline to Sign
                  </button>
                  {onViewDetails ? (
                    <>
                      <span className="text-outline-variant">|</span>
                      <button
                        type="button"
                        onClick={onViewDetails}
                        className="py-2 font-label-sm text-label-sm text-on-surface-variant hover:underline"
                      >
                        View Details
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        <SigningTrustBadges />
      </div>

      <div className="fixed bottom-0 left-0 z-50 flex w-full flex-col gap-2 border-t border-outline-variant bg-surface-container-lowest p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] md:hidden">
        <Button
          type="button"
          onClick={onReviewSign}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-status-your-turn font-bold text-white shadow-lg"
        >
          <MaterialIcon name="edit_document" size={20} />
          Review & Sign
        </Button>
        {signerName ? (
          <p className="text-center font-caption-xs text-caption-xs text-muted">
            Viewing as <span className="font-bold">{signerName}</span>
          </p>
        ) : null}
      </div>
    </div>
  )
}
