'use client'

import type { ReactNode } from 'react'
import type { Envelope } from '@/lib/api/envelopes'
import { cn } from '@/lib/utils'

interface ActivityItem {
  id: string
  message: ReactNode
  timestamp: string
  dotClass: string
}

function formatActivityTime(dateString: string): string {
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

interface EnvelopeActivityFeedProps {
  envelope: Envelope
  creatorName: string
}

export function EnvelopeActivityFeed({
  envelope,
  creatorName,
}: EnvelopeActivityFeedProps) {
  const items: ActivityItem[] = []

  if (envelope.created_at) {
    items.push({
      id: 'created',
      message: (
        <>
          Envelope created by{' '}
          <span className="text-on-surface font-medium">{creatorName}</span>
        </>
      ),
      timestamp: formatActivityTime(envelope.created_at),
      dotClass: 'bg-muted',
    })
  }

  if (envelope.sent_at && !envelope.is_self_sign) {
    items.push({
      id: 'sent',
      message: (
        <>
          Envelope sent by{' '}
          <span className="text-on-surface font-medium">{creatorName}</span>
        </>
      ),
      timestamp: formatActivityTime(envelope.sent_at),
      dotClass: 'bg-info',
    })
  }

  const signatures = [...(envelope.signatures ?? [])].sort((a, b) => {
    const aTime = a.signed_at ? new Date(a.signed_at).getTime() : 0
    const bTime = b.signed_at ? new Date(b.signed_at).getTime() : 0
    return aTime - bTime
  })

  for (const sig of signatures) {
    if (sig.status === 'signed' && sig.signed_at) {
      items.push({
        id: `signed-${sig.id}`,
        message: (
          <>
            <span className="text-on-surface font-medium">
              {sig.signer_name || sig.signer_email}
            </span>{' '}
            signed
          </>
        ),
        timestamp: formatActivityTime(sig.signed_at),
        dotClass: 'bg-success',
      })
    }
    if (sig.status === 'rejected') {
      items.push({
        id: `rejected-${sig.id}`,
        message: (
          <>
            <span className="text-on-surface font-medium">
              {sig.signer_name || sig.signer_email}
            </span>{' '}
            declined
          </>
        ),
        timestamp: sig.signed_at ? formatActivityTime(sig.signed_at) : '—',
        dotClass: 'bg-error',
      })
    }
  }

  if (envelope.completed_at) {
    items.push({
      id: 'completed',
      message: (
        <span className="text-on-surface font-medium">Envelope completed</span>
      ),
      timestamp: formatActivityTime(envelope.completed_at),
      dotClass: 'bg-success',
    })
  }

  if (envelope.rejected_at) {
    items.push({
      id: 'rejected',
      message: (
        <span className="text-on-surface font-medium">Envelope cancelled</span>
      ),
      timestamp: formatActivityTime(envelope.rejected_at),
      dotClass: 'bg-error',
    })
  }

  return (
    <section className="border-border bg-surface-container-lowest shadow-card rounded-xl border p-6">
      <h3 className="font-headline-xl text-headline-xl text-on-surface mb-4">
        Activity Feed
      </h3>

      {items.length === 0 ? (
        <p className="font-body-sm text-body-sm text-muted">
          No activity recorded yet.
        </p>
      ) : (
        <ol className="relative m-0 list-none space-y-6 p-0">
          {items.length > 1 ? (
            <span
              className="bg-border absolute bottom-2 left-1 top-2 w-px -translate-x-1/2"
              aria-hidden="true"
            />
          ) : null}
          {items.map((item) => (
            <li key={item.id} className="relative flex gap-4">
              <div
                className={cn(
                  'ring-surface-container-lowest relative z-10 mt-1.5 h-2 w-2 shrink-0 rounded-full ring-4',
                  item.dotClass
                )}
              />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                <p className="font-body-sm text-body-sm text-on-surface min-w-0 break-words">
                  {item.message}
                </p>
                <span className="font-caption-xs text-caption-xs text-muted shrink-0 tabular-nums">
                  {item.timestamp}
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
