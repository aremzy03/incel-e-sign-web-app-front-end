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
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  }) + ', ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

interface EnvelopeActivityFeedProps {
  envelope: Envelope
  creatorName: string
}

export function EnvelopeActivityFeed({ envelope, creatorName }: EnvelopeActivityFeedProps) {
  const items: ActivityItem[] = []

  if (envelope.created_at) {
    items.push({
      id: 'created',
      message: (
        <>
          Envelope created by <span className="font-medium text-on-surface">{creatorName}</span>
        </>
      ),
      timestamp: formatActivityTime(envelope.created_at),
      dotClass: 'bg-border',
    })
  }

  if (envelope.sent_at && !envelope.is_self_sign) {
    items.push({
      id: 'sent',
      message: (
        <>
          Envelope sent by <span className="font-medium text-on-surface">{creatorName}</span>
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
            <span className="font-medium text-on-surface">{sig.signer_name || sig.signer_email}</span> signed
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
            <span className="font-medium text-on-surface">{sig.signer_name || sig.signer_email}</span> declined
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
      message: <span className="font-medium text-on-surface">Envelope completed</span>,
      timestamp: formatActivityTime(envelope.completed_at),
      dotClass: 'bg-success',
    })
  }

  if (envelope.rejected_at) {
    items.push({
      id: 'rejected',
      message: <span className="font-medium text-on-surface">Envelope cancelled</span>,
      timestamp: formatActivityTime(envelope.rejected_at),
      dotClass: 'bg-error',
    })
  }

  return (
    <section className="rounded-xl border border-border/50 bg-surface-container-lowest p-6 shadow-sm">
      <h3 className="mb-6 font-headline-lg text-headline-lg text-primary">Activity Feed</h3>

      {items.length === 0 ? (
        <p className="font-body-sm text-body-sm text-muted">No activity recorded yet.</p>
      ) : (
        <div className="space-y-6">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4">
              <div className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', item.dotClass)} />
              <div className="flex flex-1 items-center justify-between gap-4">
                <p className="font-body-sm text-body-sm text-on-surface-variant">{item.message}</p>
                <span className="shrink-0 font-caption-xs text-caption-xs text-muted">{item.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
