'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MaterialIcon } from '@/components/ui/material-icon'

interface SigningFrozenEnvelopeAlertProps {
  message: string
  onDismiss?: () => void
  resendHref?: string
}

export function SigningFrozenEnvelopeAlert({
  message,
  onDismiss,
  resendHref = '/dashboard/envelopes/create',
}: SigningFrozenEnvelopeAlertProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface-container-lowest p-6 shadow-lg">
        <div className="mb-4 flex items-center gap-3 text-status-your-turn">
          <MaterialIcon name="lock" size={24} />
          <h2 className="font-headline-sm text-headline-sm">Envelope unavailable</h2>
        </div>
        <p className="mb-6 text-body-sm text-muted">{message}</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          {resendHref ? (
            <Button asChild className="flex-1">
              <Link href={resendHref}>Create new envelope</Link>
            </Button>
          ) : null}
          {onDismiss ? (
            <Button variant="outline" onClick={onDismiss} className="flex-1">
              Close
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
