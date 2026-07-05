'use client'

import Link from 'next/link'
import { MaterialIcon } from '@/components/ui/material-icon'
import { Button } from '@/components/ui/button'

interface SigningStatusCancelledProps {
  envelopeId?: string
  dashboardHref: string
}

export function SigningStatusCancelled({ envelopeId, dashboardHref }: SigningStatusCancelledProps) {
  return (
    <div className="bento-pattern flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-6">
      <main className="relative w-full max-w-[640px]">
        <section className="relative z-10 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-xl">
          <div className="flex items-center justify-between border-b border-surface-container px-8 pb-4 pt-8">
            <div className="flex items-center gap-2">
              <MaterialIcon name="description" fill size={32} className="text-primary" />
              <span className="font-headline-lg text-headline-lg tracking-tight text-primary">Incel E-Sign</span>
            </div>
            <span className="rounded-full bg-surface-container-high px-3 py-1 font-label-xs text-label-xs uppercase tracking-widest text-on-surface-variant">
              System Alert
            </span>
          </div>
          <div className="p-8 text-center md:p-12">
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full border-4 border-surface-container-high bg-surface-container-low">
              <MaterialIcon name="block" size={40} className="text-muted" />
            </div>
            <div className="mb-8 space-y-4">
              <div className="mb-2 inline-block rounded-full bg-surface-container px-4 py-1.5 font-label-sm text-label-sm text-muted">
                Cancelled
              </div>
              <h1 className="font-headline-2xl text-headline-2xl text-primary">This envelope was cancelled</h1>
              <p className="mx-auto max-w-md font-body-base text-body-base text-on-surface-variant">
                The sender has voided this document and it is no longer available for signature. Any previous progress
                has been archived and access is now restricted.
              </p>
            </div>
            <div className="mt-12 flex flex-col items-center justify-center gap-4 border-t border-surface-container pt-8 sm:flex-row">
              <Button asChild className="w-full bg-primary shadow-md hover:bg-primary-hover sm:w-auto">
                <Link href={dashboardHref}>Go to Dashboard</Link>
              </Button>
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href="/dashboard/settings">Contact Support</Link>
              </Button>
            </div>
            {envelopeId ? (
              <p className="mt-6 font-caption-xs text-caption-xs text-muted">Reference ID: {envelopeId}</p>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  )
}
