'use client'

import Link from 'next/link'
import type { Envelope } from '@/lib/api/envelopes'
import { MaterialIcon } from '@/components/ui/material-icon'
import { Button } from '@/components/ui/button'
import { SigningSignerTimeline } from './signing-signer-timeline'

interface SigningStatusWaitingProps {
  envelope: Envelope
  currentUserId?: string
  onClose: () => void
  backLabel?: string
  title?: string
  description?: string
}

export function SigningStatusWaiting({
  envelope,
  currentUserId,
  onClose,
  backLabel = 'Back to Dashboard',
  title = 'Waiting for others to sign',
  description = "This document requires a specific signing order. You'll receive an email as soon as it's your turn to sign.",
}: SigningStatusWaitingProps) {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-y-auto bg-surface-container-low/30">
      <div className="relative z-10 w-full max-w-2xl px-6 py-8">
        <div className="glass-card flex flex-col items-center rounded-2xl p-8 text-center shadow-xl md:p-12">
          <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-primary-container/10">
            <MaterialIcon name="schedule" size={40} className="font-light text-primary" />
          </div>

          <h1 className="mb-3 font-headline-2xl text-headline-2xl text-primary">
            {title}
          </h1>
          <p className="mb-12 max-w-md font-body-base text-body-base text-on-surface-variant">
            {description}
          </p>

          <div className="mb-12 w-full max-w-sm text-left">
            <SigningSignerTimeline envelope={envelope} currentUserId={currentUserId} variant="waiting" />
          </div>

          <div className="flex w-full flex-col items-center gap-4">
            <Button
              type="button"
              onClick={onClose}
              className="gap-2 rounded-xl bg-primary px-8 py-3 font-label-sm text-label-sm text-on-primary shadow-md hover:bg-primary-hover active:scale-95"
            >
              <MaterialIcon name="arrow_back" size={20} />
              {backLabel}
            </Button>
            <p className="font-caption-xs text-caption-xs text-muted">
              Need help?{' '}
              <Link href="/dashboard/settings" className="text-primary hover:underline">
                Contact Support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
