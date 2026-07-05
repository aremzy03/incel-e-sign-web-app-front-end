'use client'

import Link from 'next/link'
import type { Envelope } from '@/lib/api/envelopes'
import { MaterialIcon } from '@/components/ui/material-icon'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

function statusBadgeClass(status: string): string {
  const s = status.toLowerCase()
  if (s.includes('complete')) return 'bg-success-light text-success border-success/20'
  if (s.includes('pending')) return 'bg-warning-light text-warning border-warning/20'
  if (s.includes('reject') || s.includes('cancel')) return 'bg-error-light text-status-rejected border-error/20'
  if (s.includes('draft')) return 'bg-surface-container text-muted border-border'
  return 'bg-info-light text-secondary border-secondary/20'
}

interface EnvelopeTrackingHeaderProps {
  envelope: Envelope
  isSelfSign?: boolean
  isCreator?: boolean
  isRecipient?: boolean
  envelopeId: string
  onSend?: () => void
  onReject?: () => void
  onDelete?: () => void
  sending?: boolean
  rejecting?: boolean
  deleting?: boolean
}

export function EnvelopeTrackingHeader({
  envelope,
  isSelfSign,
  isCreator,
  isRecipient,
  envelopeId,
  onSend,
  onReject,
  onDelete,
  sending,
  rejecting,
  deleting,
}: EnvelopeTrackingHeaderProps) {
  const s = (envelope.status ?? '').toLowerCase()

  return (
    <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div>
        <div className="mb-1 flex flex-wrap items-center gap-3">
          <h2 className="font-headline-xl text-headline-xl font-bold text-primary">
            {envelope.name || 'Untitled envelope'}
          </h2>
          <span
            className={cn(
              'rounded-full border px-3 py-0.5 font-label-xs text-label-xs capitalize',
              statusBadgeClass(envelope.status),
            )}
          >
            {envelope.status}
          </span>
          {isSelfSign ? (
            <span className="rounded-full bg-accent-light px-3 py-0.5 font-label-xs text-label-xs text-status-your-turn">
              Self-signed
            </span>
          ) : null}
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Created:{' '}
          {new Date(envelope.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {!isSelfSign && isRecipient && (s.includes('draft') || s.includes('pending')) ? (
          <Link
            href={`/dashboard/envelopes/${envelopeId}/sign`}
            className="inline-flex items-center gap-2 rounded-xl bg-secondary px-6 py-2 font-label-sm text-label-sm text-on-secondary shadow-md transition-all hover:bg-accent-hover active:scale-95"
          >
            <MaterialIcon name="edit_document" size={18} />
            Sign Now
          </Link>
        ) : null}

        {!isSelfSign && isCreator && s.includes('pending') && onReject ? (
          <button
            type="button"
            onClick={onReject}
            disabled={rejecting}
            className="rounded-xl border border-transparent px-4 py-2 font-label-sm text-label-sm text-on-surface-variant transition-colors hover:border-border hover:text-primary disabled:opacity-50"
          >
            Cancel Envelope
          </button>
        ) : null}

        {!isSelfSign && isCreator && s.includes('pending') ? (
          <button
            type="button"
            onClick={() => toast('Resend reminder is not available yet')}
            className="rounded-xl border border-primary px-4 py-2 font-label-sm text-label-sm text-primary transition-all hover:bg-primary-light active:scale-95"
          >
            Resend Reminder
          </button>
        ) : null}

        {!isSelfSign && isCreator && (s.includes('draft') || s.includes('reject')) ? (
          <Link
            href={`/dashboard/envelopes/${envelopeId}/edit`}
            className="inline-flex items-center gap-2 rounded-xl bg-secondary px-6 py-2 font-label-sm text-label-sm text-on-secondary shadow-md transition-all hover:bg-accent-hover active:scale-95"
          >
            Edit
          </Link>
        ) : null}

        {!isSelfSign && isCreator && s.includes('draft') && onSend ? (
          <button
            type="button"
            onClick={onSend}
            disabled={sending}
            className="inline-flex items-center gap-2 rounded-xl bg-secondary px-6 py-2 font-label-sm text-label-sm text-on-secondary shadow-md transition-all hover:bg-accent-hover disabled:opacity-50"
          >
            <MaterialIcon name="send" size={18} />
            {sending ? 'Sending…' : 'Send'}
          </button>
        ) : null}

        {isCreator && onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="rounded-xl px-4 py-2 font-label-sm text-label-sm text-error transition-colors hover:bg-error-light disabled:opacity-50"
            title="Delete envelope"
          >
            <MaterialIcon name="delete" size={18} />
          </button>
        ) : null}
      </div>
    </div>
  )
}
