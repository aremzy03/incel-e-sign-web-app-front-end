'use client'

import { cn } from '@/lib/utils'
import { MaterialIcon } from '@/components/ui/material-icon'
import { EnvelopeSignerStack } from './envelope-signer-stack'
import type { EnvelopeSignerStackUser } from './envelope-signer-stack'

export type EnvelopeCardVariant = 'your-turn' | 'draft' | 'pending' | 'completed' | 'rejected' | 'default'

interface EnvelopeCardProps {
  id: string
  name: string
  status: string
  variant: EnvelopeCardVariant
  subtitle?: string
  creatorName?: string
  isCreator?: boolean
  documentCount?: number
  updatedAt?: string
  signerCount?: number
  signedCount?: number
  signers: EnvelopeSignerStackUser[]
  onSign?: () => void
  onView?: () => void
  onDelete?: () => void
  onRemind?: () => void
  className?: string
}

const statusPillStyles: Record<EnvelopeCardVariant, string> = {
  'your-turn': 'bg-accent-light text-status-your-turn',
  draft: 'bg-surface text-status-draft',
  pending: 'bg-warning-light text-warning',
  completed: 'bg-success-light text-success',
  rejected: 'bg-error-light text-error',
  default: 'bg-surface text-muted',
}

const statusPill =
  'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold normal-case leading-4 tracking-normal'

function formatStatusLabel(status: string, variant: EnvelopeCardVariant): string {
  if (variant === 'your-turn') return 'Your Turn'
  const normalized = status.toLowerCase().replace(/_/g, '-')
  if (normalized.includes('self-sign')) return 'Self-Signed'
  const words = normalized.replace(/-/g, ' ').trim()
  if (!words) return status
  return words.replace(/\b\w/g, (char) => char.toUpperCase())
}

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-your-turn focus-visible:ring-offset-2'

const outlineAction =
  'inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 text-label-sm font-medium text-primary transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50'

const authorityAction =
  'inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-label-sm font-medium text-on-primary transition-transform hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-primary-hover active:translate-y-0 active:scale-100'

export function EnvelopeCard({
  name,
  status,
  variant,
  subtitle,
  creatorName,
  isCreator,
  documentCount,
  updatedAt,
  signerCount,
  signedCount,
  signers,
  onSign,
  onView,
  onDelete,
  onRemind,
  className,
}: EnvelopeCardProps) {
  const showProgress =
    signerCount !== undefined && signerCount > 1 && signedCount !== undefined

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-surface-container-lowest p-6 shadow-card',
        className,
      )}
    >
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <h3
              className="line-clamp-2 min-w-0 flex-1 break-words text-base font-medium leading-6 text-on-surface"
              title={name}
            >
              {name}
            </h3>
            <span className={cn(statusPill, 'mt-0.5', statusPillStyles[variant])}>
              {formatStatusLabel(status, variant)}
            </span>
          </div>

          {subtitle && <p className="mt-1.5 text-body-sm text-muted">{subtitle}</p>}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-caption-xs text-muted">
            {isCreator ? (
              <span className="font-medium text-on-surface">Created by you</span>
            ) : creatorName ? (
              <span className="inline-flex items-center gap-1">
                <MaterialIcon name="person" size={16} />
                {creatorName}
              </span>
            ) : null}

            {documentCount !== undefined && documentCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <MaterialIcon name="description" size={16} />
                {documentCount} document{documentCount === 1 ? '' : 's'}
              </span>
            )}

            {signerCount !== undefined && signerCount > 0 && (
              <span className="inline-flex items-center gap-1 tabular-nums">
                <MaterialIcon name="groups" size={16} />
                {signerCount} signer{signerCount === 1 ? '' : 's'}
              </span>
            )}

            {updatedAt && (
              <span className="inline-flex items-center gap-1">
                <MaterialIcon name="schedule" size={16} />
                {updatedAt}
              </span>
            )}
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-wrap items-center justify-end gap-3 sm:w-auto">
          {(signers.length > 0 || showProgress) && (
            <div className="flex flex-col items-end gap-2">
              {signers.length > 0 && <EnvelopeSignerStack users={signers} />}
              {showProgress && (
                <span className="text-caption-xs text-muted tabular-nums">
                  {signedCount} / {signerCount} Complete
                </span>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2">
            {variant === 'your-turn' && onSign && (
              <button type="button" onClick={onSign} className={cn(authorityAction, focusRing)}>
                Sign Now
              </button>
            )}

            {variant === 'draft' && onView && (
              <button type="button" onClick={onView} className={cn(outlineAction, focusRing)}>
                View/Edit
              </button>
            )}

            {(variant === 'completed' ||
              variant === 'rejected' ||
              variant === 'pending' ||
              variant === 'default') &&
              onView && (
                <button type="button" onClick={onView} className={cn(outlineAction, focusRing)}>
                  Details
                  <MaterialIcon name="chevron_right" size={16} />
                </button>
              )}

            {variant === 'pending' && onRemind && (
              <button
                type="button"
                disabled
                title="Coming soon"
                className={cn(outlineAction, focusRing)}
              >
                Remind
              </button>
            )}

            {isCreator && onDelete && variant === 'draft' && (
              <button
                type="button"
                onClick={onDelete}
                className={cn(
                  'inline-flex h-10 w-10 items-center justify-center rounded-xl text-error transition-colors hover:bg-error-light',
                  focusRing,
                )}
                aria-label="Delete envelope"
              >
                <MaterialIcon name="delete" size={20} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
