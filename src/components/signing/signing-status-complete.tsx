'use client'

import Link from 'next/link'
import { MaterialIcon } from '@/components/ui/material-icon'
import { Button } from '@/components/ui/button'
import { useConfetti } from '@/hooks/signing/useConfetti'

export type SigningCompletionPhase = 'submitted' | 'envelope_complete'

interface SigningStatusCompleteProps {
  envelopeName?: string
  completionPhase?: SigningCompletionPhase
  dashboardHomeHref: string
  downloadHref?: string
}

export function SigningStatusComplete({
  envelopeName,
  completionPhase = 'submitted',
  dashboardHomeHref,
  downloadHref,
}: SigningStatusCompleteProps) {
  const isEnvelopeComplete = completionPhase === 'envelope_complete'
  const canvasRef = useConfetti(isEnvelopeComplete)

  return (
    <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-12">
      <canvas ref={canvasRef} className="confetti-canvas" aria-hidden />
      <div className="relative z-20 w-full max-w-[600px] text-center">
        <div className="relative mb-8 flex justify-center">
          <div className="success-checkmark-bounce flex h-24 w-24 items-center justify-center rounded-full bg-success-light">
            <MaterialIcon name="check_circle" fill size={48} className="text-status-completed" />
          </div>
        </div>
        <h1 className="mb-3 font-headline-2xl text-headline-2xl text-primary">
          {isEnvelopeComplete ? 'Signing complete!' : 'Signature submitted'}
        </h1>
        <p className="mb-8 font-body-base text-body-base text-on-surface-variant">
          {envelopeName ? `"${envelopeName}"` : 'This document'}{' '}
          {isEnvelopeComplete
            ? 'has been fully executed. All parties have signed.'
            : 'will continue through the remaining signing order.'}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild className="gap-2 bg-secondary hover:bg-accent-hover">
            <Link href={dashboardHomeHref}>
              <MaterialIcon name="home" size={18} />
              Go to Dashboard
            </Link>
          </Button>
          {downloadHref ? (
            <Button asChild variant="outline" className="gap-2">
              <Link href={downloadHref}>
                <MaterialIcon name="download" size={18} />
                Download Document
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
