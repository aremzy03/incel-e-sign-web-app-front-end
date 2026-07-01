'use client'

import type { Envelope } from '@/lib/api/envelopes'
import {
  buildEnvelopeSignerStack,
  formatRelativeTime,
  getEnvelopeVariant,
} from '@/app/dashboard/envelopes/envelope-card-utils'
import { MaterialIcon } from '@/components/ui/material-icon'
import { cn } from '@/lib/utils'

interface SigningSignerTimelineProps {
  envelope: Envelope
  currentUserId?: string
  variant?: 'landing' | 'waiting' | 'compact'
  className?: string
}

function idsMatch(a?: string, b?: string): boolean {
  if (!a || !b) return false
  return String(a) === String(b)
}

function getSignatureStatus(envelope: Envelope, signerId?: string): string | undefined {
  if (!signerId) return undefined
  return envelope.signatures?.find((s) => idsMatch(s.signer, signerId))?.status
}

function getSignedAt(envelope: Envelope, signerId?: string): string | undefined {
  if (!signerId) return undefined
  const recipient = envelope.recipients?.find((r) => idsMatch(r.id, signerId))
  if (recipient?.signed_at) return recipient.signed_at
  const signature = envelope.signatures?.find((s) => idsMatch(s.signer, signerId))
  return signature?.signed_at
}

function formatCompletedTimestamp(dateString: string): string {
  const date = new Date(dateString)
  return `Completed on ${date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })}, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
}

function getCurrentSignerActivity(envelope: Envelope, signerId?: string): string | undefined {
  if (!signerId) return undefined
  const signature = envelope.signatures?.find((s) => idsMatch(s.signer, signerId))
  if (signature?.updated_at) {
    return `Envelope opened ${formatRelativeTime(signature.updated_at).toLowerCase()}`
  }
  return 'Currently reviewing document'
}

export function SigningSignerTimeline({
  envelope,
  currentUserId,
  variant = 'landing',
  className,
}: SigningSignerTimelineProps) {
  const cardVariant = getEnvelopeVariant(envelope, currentUserId)
  const stack = buildEnvelopeSignerStack(
    envelope,
    variant === 'waiting' ? 'pending' : cardVariant,
    currentUserId,
  )

  if (variant === 'waiting') {
    return (
      <div className={cn('relative space-y-0', className)}>
        {stack.map((signer, i) => {
          const isLast = i === stack.length - 1
          const isCompleted = signer.status === 'completed'
          const isCurrent = signer.status === 'current'
          const isYou = idsMatch(signer.id, currentUserId)
          const signerNumber = i + 1
          const signedAt = getSignedAt(envelope, signer.id)
          const isProcessing = getSignatureStatus(envelope, signer.id) === 'processing'

          let label = `Signer ${signerNumber}`
          if (isCurrent) label = `Signer ${signerNumber} (Current)`
          if (isYou && !isCurrent) label = `You (Signer ${signerNumber})`

          return (
            <div key={signer.id ?? i} className={cn('relative flex gap-6', !isLast && 'pb-12')}>
              {!isLast ? (
                <div
                  className={cn(
                    'absolute bottom-0 left-[15px] top-8 w-0.5',
                    isCompleted ? 'bg-success/30' : 'bg-outline-variant',
                  )}
                />
              ) : null}

              {isCompleted ? (
                <div className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-success bg-success-light">
                  <MaterialIcon name="check" size={18} className="font-bold text-success" />
                </div>
              ) : isCurrent ? (
                <div className="pulse-teal z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-status-your-turn bg-white">
                  <div className="h-2.5 w-2.5 rounded-full bg-status-your-turn" />
                </div>
              ) : (
                <div className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-outline bg-surface-container-high">
                  <MaterialIcon name="person" size={18} className="text-on-surface-variant" />
                </div>
              )}

              <div className="flex min-w-0 flex-col">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      'font-label-sm text-label-sm',
                      isCompleted && 'text-success',
                      isCurrent && 'text-status-your-turn',
                      !isCompleted && !isCurrent && 'text-on-surface-variant',
                    )}
                  >
                    {label}
                  </span>
                  {isYou && !isCurrent ? (
                    <span className="rounded bg-primary-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-primary-container">
                      Upcoming
                    </span>
                  ) : null}
                </div>

                <span
                  className={cn(
                    'font-headline-lg text-headline-lg text-primary',
                    isCompleted && 'opacity-60',
                    !isCompleted && !isCurrent && isYou && 'text-on-surface-variant',
                  )}
                >
                  {signer.name || `Signer ${signerNumber}`}
                </span>

                {isCompleted ? (
                  <span className="font-caption-xs text-caption-xs text-on-surface-variant">
                    {signedAt ? formatCompletedTimestamp(signedAt) : 'Signed'}
                  </span>
                ) : isCurrent ? (
                  <span className="flex items-center gap-1 font-caption-xs text-caption-xs text-on-surface-variant">
                    <MaterialIcon name={isProcessing ? 'hourglass_top' : 'mail'} size={14} />
                    {isProcessing
                      ? 'Signing in progress…'
                      : getCurrentSignerActivity(envelope, signer.id)}
                  </span>
                ) : (
                  <span className="font-caption-xs text-caption-xs text-muted">
                    {isYou ? 'Awaiting previous signers' : 'Awaiting previous signers'}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={cn('space-y-3', className)}>
        {stack.map((signer, i) => (
          <div key={signer.id ?? i} className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full',
                signer.status === 'completed' && 'bg-success-light text-success',
                signer.status === 'current' && 'bg-accent-light text-status-your-turn',
                signer.status === 'rejected' && 'bg-error-light text-error',
                signer.status === 'pending' && 'border-2 border-outline-variant bg-surface-container',
              )}
            >
              {signer.status === 'completed' ? (
                <MaterialIcon name="check" size={16} />
              ) : signer.status === 'current' ? (
                <div className="pulse-active flex h-full w-full items-center justify-center">
                  <div className="pulse-dot h-2 w-2 rounded-full bg-status-your-turn" />
                </div>
              ) : (
                <span className="text-caption-xs text-muted">{i + 1}</span>
              )}
            </div>
            <div>
              <p
                className={cn(
                  'font-label-sm text-label-sm',
                  signer.status === 'completed' && 'text-success',
                  signer.status === 'current' && 'font-bold text-status-your-turn',
                  signer.status === 'pending' && 'text-on-surface',
                )}
              >
                {signer.name || `Signer ${i + 1}`}
                {signer.id === currentUserId && signer.status === 'current' ? ' (YOU)' : ''}
              </p>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('relative space-y-8 pl-8', className)}>
      <div className="absolute bottom-2 left-3 top-2 w-0.5 bg-outline-variant" />
      {stack.map((signer, i) => {
        const isCurrent = signer.status === 'current'
        const isCompleted = signer.status === 'completed'
        const isYou = signer.id === currentUserId

        return (
          <div key={signer.id ?? i} className="relative flex items-center">
            <div
              className={cn(
                'absolute z-10 flex items-center justify-center rounded-full',
                isCompleted && '-left-[26px] h-5 w-5 bg-status-completed text-white',
                isCurrent && '-left-[30px] h-7 w-7',
                !isCompleted && !isCurrent && '-left-[26px] h-5 w-5 border-2 border-outline-variant bg-surface-container',
              )}
            >
              {isCompleted ? (
                <MaterialIcon name="check" size={14} className="text-white" />
              ) : isCurrent ? (
                <div className="pulse-active flex h-full w-full items-center justify-center">
                  <div className="pulse-dot h-3 w-3 rounded-full bg-status-your-turn" />
                </div>
              ) : null}
            </div>
            {isCurrent ? (
              <div className="w-full rounded-lg border border-status-your-turn/30 bg-accent-light px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-label-sm text-label-sm font-bold text-status-your-turn">
                      {signer.name || `Signer ${i + 1}`}
                      {isYou ? ' (YOU)' : ''}
                    </p>
                    <p className="font-caption-xs text-caption-xs text-status-your-turn">Your turn to sign</p>
                  </div>
                  <span className="rounded-full bg-status-your-turn px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                    Active
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <p
                  className={cn(
                    'font-label-sm text-label-sm',
                    isCompleted ? 'text-status-completed' : 'text-on-surface',
                  )}
                >
                  {signer.name || `Signer ${i + 1}`}
                </p>
                <p className="font-caption-xs text-caption-xs text-muted">
                  {isCompleted ? 'Signed' : isYou ? 'Waiting for your action' : 'Waiting'}
                </p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
