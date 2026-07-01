'use client'

import type { Envelope } from '@/lib/api/envelopes'
import {
  buildEnvelopeSignerStack,
} from '@/app/dashboard/envelopes/envelope-card-utils'
import { MaterialIcon } from '@/components/ui/material-icon'
import { cn } from '@/lib/utils'

interface EnvelopeSignerTimelinePanelProps {
  envelope: Envelope
  currentUserId?: string
}

function idsMatch(a?: string, b?: string): boolean {
  if (!a || !b) return false
  return String(a) === String(b)
}

function getSignerEmail(envelope: Envelope, signerId?: string): string | undefined {
  if (!signerId) return undefined
  const sig = envelope.signatures?.find((s) => idsMatch(s.signer, signerId))
  if (sig?.signer_email) return sig.signer_email
  const recipient = envelope.recipients?.find((r) => idsMatch(r.id, signerId))
  return recipient?.email
}

function getSignatureStatus(envelope: Envelope, signerId?: string): string | undefined {
  if (!signerId) return undefined
  return envelope.signatures?.find((s) => idsMatch(s.signer, signerId))?.status
}

function getSignedAt(envelope: Envelope, signerId?: string): string | undefined {
  if (!signerId) return undefined
  const sig = envelope.signatures?.find((s) => idsMatch(s.signer, signerId))
  return sig?.signed_at ?? envelope.recipients?.find((r) => idsMatch(r.id, signerId))?.signed_at
}

function formatSignedTimestamp(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  }) + ', ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function EnvelopeSignerTimelinePanel({ envelope, currentUserId }: EnvelopeSignerTimelinePanelProps) {
  const stack = buildEnvelopeSignerStack(envelope, 'pending', currentUserId)

  return (
    <section className="rounded-xl border border-border/50 bg-surface-container-lowest p-8 shadow-sm">
      <h3 className="mb-8 font-headline-lg text-headline-lg text-primary">Signing Progress</h3>

      <div className="relative ml-4 space-y-12">
        <div className="absolute bottom-2 left-[11px] top-2 z-0 w-0.5 bg-border" />

        {stack.map((signer, i) => {
          const isCompleted = signer.status === 'completed'
          const isCurrent = signer.status === 'current'
          const isRejected = signer.status === 'rejected'
          const isProcessing = getSignatureStatus(envelope, signer.id) === 'processing'
          const email = getSignerEmail(envelope, signer.id)
          const signedAt = getSignedAt(envelope, signer.id)

          return (
            <div key={signer.id ?? i} className="relative z-10 flex gap-6">
              {isCompleted ? (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success text-white ring-4 ring-white">
                  <MaterialIcon name="check" size={16} className="font-bold" />
                </div>
              ) : isCurrent ? (
                <div className="flex h-6 w-6 shrink-0 animate-pulse items-center justify-center rounded-full bg-status-your-turn text-white ring-4 ring-white">
                  <MaterialIcon name="edit" size={16} />
                </div>
              ) : (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-border bg-surface-container-high text-muted ring-4 ring-white">
                  <MaterialIcon name="schedule" size={16} />
                </div>
              )}

              <div
                className={cn(
                  'min-w-0 flex-1 -mt-1',
                  isCurrent && 'rounded-xl border border-secondary-container bg-accent-light/30 p-4',
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-body-base text-body-base font-bold text-on-surface">
                      {signer.name || `Signer ${i + 1}`}
                    </p>
                    {email ? (
                      <p className="font-body-sm text-body-sm text-muted">{email}</p>
                    ) : null}
                  </div>

                  <div className="shrink-0 text-right">
                    {isCompleted ? (
                      <>
                        <span className="flex items-center justify-end gap-1 font-label-sm text-label-sm font-bold text-success">
                          Signed
                        </span>
                        {signedAt ? (
                          <p className="mt-1 font-caption-xs text-caption-xs text-muted">
                            {formatSignedTimestamp(signedAt)}
                          </p>
                        ) : null}
                      </>
                    ) : isCurrent ? (
                      <>
                        <span className="rounded-full bg-status-your-turn px-3 py-1 font-label-xs font-bold text-white shadow-sm">
                          {isProcessing ? 'Signing in progress…' : 'Waiting for Sign'}
                        </span>
                        <p className="mt-2 font-caption-xs font-medium italic text-status-your-turn">
                          {isProcessing ? 'Embedding your signature…' : 'Signing now...'}
                        </p>
                      </>
                    ) : isRejected ? (
                      <span className="font-label-sm text-label-sm text-error">Declined</span>
                    ) : (
                      <span className={cn('font-label-sm text-label-sm text-muted', !isCurrent && 'opacity-60')}>
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
