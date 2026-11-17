'use client'

import Link from 'next/link'
import type { Envelope } from '@/lib/api/envelopes'
import { MaterialIcon } from '@/components/ui/material-icon'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const statusPill =
  'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 font-label-xs font-semibold'

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-your-turn focus-visible:ring-offset-2'

function formatStatusLabel(status: string): string {
  const words = status.toLowerCase().replace(/[_-]+/g, ' ').trim()
  if (!words) return status
  return words.replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatCreatedDate(value: string): string | null {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function statusBadgeClass(status: string): string {
  const s = status.toLowerCase()
  if (s.includes('complete')) return 'bg-success-light text-success'
  if (s.includes('pending') || s.includes('sent'))
    return 'bg-warning-light text-warning'
  if (s.includes('reject') || s.includes('cancel') || s.includes('declin')) {
    return 'bg-error-light text-error'
  }
  if (s.includes('draft')) return 'bg-surface text-status-draft'
  return 'bg-info-light text-info'
}

const sealButton = cn(
  'inline-flex h-10 items-center gap-2 rounded-xl bg-secondary px-4 font-label-sm text-label-sm text-on-secondary transition-transform hover:-translate-y-0.5 hover:bg-accent-hover active:translate-y-0 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:opacity-50',
  focusRing
)

const authorityButton = cn(
  'inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 font-label-sm text-label-sm text-on-primary transition-transform hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-primary-hover active:translate-y-0 active:scale-100 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:scale-100 disabled:opacity-50',
  focusRing
)

const outlineButton = cn(
  'inline-flex h-10 items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 font-label-sm text-label-sm text-primary transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50',
  focusRing
)

const ghostButton = cn(
  'inline-flex h-10 items-center rounded-xl px-4 font-label-sm text-label-sm text-on-surface-variant transition-colors hover:bg-surface hover:text-on-surface disabled:cursor-not-allowed disabled:opacity-50',
  focusRing
)

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
  const canSend =
    !isSelfSign && isCreator && s.includes('draft') && Boolean(onSend)
  const canEdit =
    !isSelfSign && isCreator && (s.includes('draft') || s.includes('reject'))
  const createdLabel = envelope.created_at
    ? formatCreatedDate(envelope.created_at)
    : null

  return (
    <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div className="min-w-0 md:flex-1">
        <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <h2 className="font-headline-2xl text-headline-2xl text-on-surface min-w-0 text-balance break-words font-bold">
            {envelope.name || 'Untitled envelope'}
          </h2>
          {envelope.status ? (
            <span className={cn(statusPill, statusBadgeClass(envelope.status))}>
              {formatStatusLabel(envelope.status)}
            </span>
          ) : null}
          {isSelfSign ? (
            <span className={cn(statusPill, 'bg-info-light text-info')}>
              Self-signed
            </span>
          ) : null}
        </div>
        {createdLabel ? (
          <p className="font-body-sm text-body-sm text-muted tabular-nums">
            Created: {createdLabel}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {!isSelfSign &&
        isRecipient &&
        (s.includes('draft') || s.includes('pending')) ? (
          <Link
            href={`/dashboard/envelopes/${envelopeId}/sign`}
            prefetch={false}
            className={authorityButton}
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
            aria-busy={rejecting || undefined}
            className={ghostButton}
          >
            Cancel Envelope
          </button>
        ) : null}

        {!isSelfSign && isCreator && s.includes('pending') ? (
          <button
            type="button"
            onClick={() => toast('Resend reminder is not available yet')}
            className={sealButton}
          >
            Resend Reminder
          </button>
        ) : null}

        {canEdit ? (
          <Link
            href={`/dashboard/envelopes/${envelopeId}/edit`}
            prefetch={false}
            className={canSend ? outlineButton : sealButton}
          >
            Edit
          </Link>
        ) : null}

        {canSend && onSend ? (
          <button
            type="button"
            onClick={onSend}
            disabled={sending}
            aria-busy={sending || undefined}
            className={sealButton}
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
            aria-busy={deleting || undefined}
            aria-label="Delete envelope"
            className={cn(
              'text-error hover:bg-error-light inline-flex h-10 w-10 items-center justify-center rounded-xl transition-colors disabled:cursor-not-allowed disabled:opacity-50',
              focusRing
            )}
          >
            <MaterialIcon name="delete" size={18} />
          </button>
        ) : null}
      </div>
    </div>
  )
}
