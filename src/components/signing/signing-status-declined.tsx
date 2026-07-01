'use client'

import Link from 'next/link'
import { MaterialIcon } from '@/components/ui/material-icon'
import { Button } from '@/components/ui/button'

interface SigningStatusDeclinedProps {
  declineMessage?: string
  homeHref: string
}

export function SigningStatusDeclined({ declineMessage, homeHref }: SigningStatusDeclinedProps) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-8">
      <main className="w-full max-w-lg animate-in fade-in">
        <div className="mb-8 flex justify-center">
          <div className="flex items-center gap-2">
            <MaterialIcon name="edit_document" size={32} className="text-primary" />
            <span className="font-headline-xl text-headline-xl tracking-tight text-primary">Incel E-Sign</span>
          </div>
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-8 shadow-md">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error-light">
              <MaterialIcon name="cancel" size={32} className="text-error" />
            </div>
            <h1 className="mb-2 font-headline-2xl text-headline-2xl text-on-background">You declined to sign</h1>
            <span className="rounded-full bg-error-light px-4 py-1 font-label-sm text-label-sm uppercase tracking-wide text-status-rejected">
              Declined
            </span>
          </div>
          <p className="mb-8 text-center font-body-base text-body-base text-on-surface-variant">
            The sender has been notified that you have declined to sign this document. No further action is required
            from you at this time.
          </p>
          {declineMessage ? (
            <div className="mb-8 rounded-lg border border-outline-variant bg-surface-container-low p-6">
              <h2 className="mb-3 flex items-center gap-2 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                <MaterialIcon name="comment" size={18} />
                Reason for declining
              </h2>
              <p className="font-body-base text-body-base italic leading-relaxed text-on-surface">
                &ldquo;{declineMessage}&rdquo;
              </p>
            </div>
          ) : null}
          <Button asChild className="w-full gap-2 bg-primary py-6 hover:bg-primary-hover">
            <Link href={homeHref}>
              <MaterialIcon name="home" size={18} />
              Return to Homepage
            </Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
