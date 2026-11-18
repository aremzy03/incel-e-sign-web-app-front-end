'use client'

import { isSelfSignEnvelope, type Envelope } from '@/lib/api/envelopes'
import {
  buildEnvelopeSignerStack,
  getEnvelopeVariant,
  isEnvelopeSigningInProgress,
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

function getSignerEmail(
  envelope: Envelope,
  signerId?: string
): string | undefined {
  if (!signerId) return undefined
  const sig = envelope.signatures?.find((s) => idsMatch(s.signer, signerId))
  if (sig?.signer_email) return sig.signer_email
  const recipient = envelope.recipients?.find((r) => idsMatch(r.id, signerId))
  return recipient?.email
}

function getSignatureStatus(
  envelope: Envelope,
  signerId?: string
): string | undefined {
  if (!signerId) return undefined
  return envelope.signatures?.find((s) => idsMatch(s.signer, signerId))?.status
}

function getSignedAt(
  envelope: Envelope,
  signerId?: string
): string | undefined {
  if (!signerId) return undefined
  const sig = envelope.signatures?.find((s) => idsMatch(s.signer, signerId))
  return (
    sig?.signed_at ??
    envelope.recipients?.find((r) => idsMatch(r.id, signerId))?.signed_at
  )
}

function formatSignedTimestamp(dateString: string): string {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '—'
  return (
    date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }) +
    ', ' +
    date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  )
}

const statusPill =
  'inline-flex items-center rounded-full px-2.5 py-0.5 font-label-xs font-semibold'

const markClass =
  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-4 ring-surface-container-lowest'

export function EnvelopeSignerTimelinePanel({
  envelope,
  currentUserId,
}: EnvelopeSignerTimelinePanelProps) {
  const variant = getEnvelopeVariant(envelope, currentUserId)
  const stack = buildEnvelopeSignerStack(envelope, variant, currentUserId)
  const settled =
    (envelope.status ?? '').toLowerCase().includes('complete') ||
    isSelfSignEnvelope(envelope)
  const signingNow = isEnvelopeSigningInProgress(envelope, currentUserId)

  return (
    <section className="border-border bg-surface-container-lowest shadow-card rounded-xl border p-6">
      <h3 className="font-headline-xl text-headline-xl text-on-surface mb-4">
        Signing Progress
      </h3>

      {stack.length === 0 ? (
        <p className="font-body-sm text-body-sm text-muted">
          No signers on this envelope yet.
        </p>
      ) : (
        <div className="relative ml-4 space-y-8">
          <div
            className="bg-border absolute bottom-2 left-3 top-2 z-0 w-px -translate-x-1/2"
            aria-hidden="true"
          />

          {stack.map((signer, i) => {
            const isRejected = signer.status === 'rejected'
            const isCompleted =
              signer.status === 'completed' || (settled && !isRejected)
            const isProcessing =
              !isCompleted &&
              !isRejected &&
              (getSignatureStatus(envelope, signer.id) === 'processing' ||
                (idsMatch(signer.id, currentUserId) && signingNow))
            const isCurrent =
              !isCompleted &&
              !isRejected &&
              (signer.status === 'current' || isProcessing)
            const isYourTurn =
              isCurrent && !isProcessing && idsMatch(signer.id, currentUserId)
            const email = getSignerEmail(envelope, signer.id)
            const signedAt = getSignedAt(envelope, signer.id)

            return (
              <div key={signer.id ?? i} className="relative z-10 flex gap-4">
                {isCompleted ? (
                  <div
                    className={cn(markClass, 'bg-success-light text-success-text')}
                  >
                    <MaterialIcon name="check" size={16} />
                  </div>
                ) : isYourTurn ? (
                  <div
                    className={cn(
                      markClass,
                      'bg-accent-light text-your-turn-text'
                    )}
                  >
                    <MaterialIcon name="edit" size={16} />
                  </div>
                ) : isCurrent ? (
                  <div
                    className={cn(markClass, 'bg-warning-light text-warning-text')}
                  >
                    <MaterialIcon name="edit" size={16} />
                  </div>
                ) : isRejected ? (
                  <div className={cn(markClass, 'bg-error-light text-error-text')}>
                    <MaterialIcon name="close" size={16} />
                  </div>
                ) : (
                  <div
                    className={cn(
                      markClass,
                      'border-border bg-surface text-muted border'
                    )}
                  >
                    <MaterialIcon name="schedule" size={16} />
                  </div>
                )}

                <div className="-mt-1 min-w-0 flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="min-w-0">
                      <p className="font-body-base text-body-base text-on-surface break-words font-semibold">
                        {signer.name || `Signer ${i + 1}`}
                      </p>
                      {email ? (
                        <p className="font-body-sm text-body-sm text-muted break-all">
                          {email}
                        </p>
                      ) : null}
                    </div>

                    <div className="shrink-0 sm:text-right">
                      {isCompleted ? (
                        <>
                          <span
                            className={cn(
                              statusPill,
                              'bg-success-light text-success-text'
                            )}
                          >
                            Signed
                          </span>
                          {signedAt ? (
                            <p className="font-caption-xs text-caption-xs text-muted mt-1 tabular-nums">
                              {formatSignedTimestamp(signedAt)}
                            </p>
                          ) : null}
                        </>
                      ) : isCurrent ? (
                        <>
                          <span
                            className={cn(
                              statusPill,
                              isYourTurn
                                ? 'bg-accent-light text-your-turn-text'
                                : 'bg-warning-light text-warning-text'
                            )}
                          >
                            {isProcessing
                              ? 'Signing in progress…'
                              : isYourTurn
                                ? 'Your Turn'
                                : 'Waiting for Sign'}
                          </span>
                          {isProcessing ? (
                            <p className="font-caption-xs text-caption-xs text-muted mt-1">
                              {idsMatch(signer.id, currentUserId)
                                ? 'Embedding your signature…'
                                : 'Embedding signature…'}
                            </p>
                          ) : isYourTurn ? (
                            <p className="font-caption-xs text-caption-xs text-your-turn-text mt-1">
                              Needs your signature
                            </p>
                          ) : null}
                        </>
                      ) : isRejected ? (
                        <span
                          className={cn(
                            statusPill,
                            'bg-error-light text-error-text'
                          )}
                        >
                          Declined
                        </span>
                      ) : (
                        <span
                          className={cn(
                            statusPill,
                            'bg-surface text-status-draft-text'
                          )}
                        >
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
      )}
    </section>
  )
}
