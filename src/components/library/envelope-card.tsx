'use client'

import { cn } from '@/lib/utils'
import { MaterialIcon } from '@/components/ui/material-icon'
import { StatusBadge } from './status-badge'
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

const variantStyles: Record<EnvelopeCardVariant, string> = {
  'your-turn':
    'border-l-4 border-l-status-your-turn bg-primary-light hover:shadow-raised',
  draft: 'border border-dashed border-outline-variant bg-surface-container-lowest',
  pending: 'border border-border bg-surface-container-lowest hover:shadow-raised',
  completed: 'border border-border bg-surface-container-lowest opacity-90 hover:shadow-raised',
  rejected: 'border border-error/20 bg-error-light/20 hover:shadow-raised',
  default: 'border border-border bg-surface-container-lowest hover:shadow-raised',
}

function getStatusBadgeLabel(status: string, variant: EnvelopeCardVariant): string {
  if (variant === 'your-turn') return 'Your Turn'
  if (status.toLowerCase().replace(/_/g, '-').includes('self-sign')) return 'Self-Signed'
  return status
}

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
        'rounded-xl p-6 shadow-card transition-shadow',
        variantStyles[variant],
        className,
      )}
    >
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        {/* Left: title, subtitle, metadata */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-3">
            <h3
              className={cn(
                'text-headline-lg font-semibold text-primary',
                variant === 'rejected' && 'text-status-rejected line-through',
                variant === 'draft' && 'text-muted',
              )}
            >
              {name}
            </h3>
            <StatusBadge
              status={getStatusBadgeLabel(status, variant)}
              showDot={variant !== 'your-turn'}
              className={cn(
                variant === 'your-turn' && 'border border-status-your-turn',
              )}
            />
          </div>

          {subtitle && (
            <p
              className={cn(
                'mb-3 text-body-sm',
                variant === 'rejected' ? 'text-status-rejected' : 'text-muted',
              )}
            >
              {subtitle}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-caption-xs text-muted">
            {isCreator ? (
              <span className="font-medium italic text-primary">Created by you</span>
            ) : creatorName ? (
              <span className="flex items-center gap-1">
                <MaterialIcon name="person" size={16} />
                {creatorName}
              </span>
            ) : null}

            {documentCount !== undefined && documentCount > 0 && (
              <span className="rounded bg-surface-variant px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                {documentCount} document{documentCount === 1 ? '' : 's'}
              </span>
            )}

            {signerCount !== undefined && signerCount > 0 && (
              <span className="flex items-center gap-1">
                <MaterialIcon name="groups" size={16} />
                {signerCount} signer{signerCount === 1 ? '' : 's'}
              </span>
            )}

            {variant === 'completed' && (
              <span className="flex items-center gap-1 font-bold text-status-completed">
                <MaterialIcon name="task_alt" size={16} />
                Certified
              </span>
            )}

            {updatedAt && (
              <span className="flex items-center gap-1">
                <MaterialIcon name="schedule" size={16} />
                {updatedAt}
              </span>
            )}
          </div>
        </div>

        {/* Right: signer stack + actions */}
        <div className="flex w-full shrink-0 flex-col items-stretch gap-3 sm:w-auto sm:items-end">
          {(signers.length > 0 || showProgress) && (
            <div className="flex flex-col items-end gap-2">
              {signers.length > 0 && <EnvelopeSignerStack users={signers} />}
              {showProgress && (
                <span className="text-caption-xs font-medium text-muted">
                  {signedCount} / {signerCount} Complete
                </span>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3">
            {variant === 'your-turn' && onSign && (
              <button
                type="button"
                onClick={onSign}
                className="rounded-xl bg-secondary px-8 py-2 text-label-sm font-medium text-on-secondary shadow-md transition-all hover:bg-accent-hover active:scale-95"
              >
                Sign Now
              </button>
            )}

            {variant === 'draft' && onView && (
              <button
                type="button"
                onClick={onView}
                className="rounded-lg bg-primary px-6 py-2 text-label-sm font-medium text-on-primary transition-all hover:bg-primary-hover"
              >
                View/Edit
              </button>
            )}

            {variant === 'completed' && onView && (
              <button
                type="button"
                onClick={onView}
                className="flex items-center gap-1 text-label-sm font-medium text-primary transition-colors hover:text-secondary"
              >
                Details
                <MaterialIcon name="chevron_right" size={16} />
              </button>
            )}

            {variant === 'rejected' && onView && (
              <button
                type="button"
                onClick={onView}
                className="flex items-center gap-1 text-label-sm font-medium text-primary transition-colors hover:text-secondary"
              >
                Details
                <MaterialIcon name="chevron_right" size={16} />
              </button>
            )}

            {variant === 'pending' && onRemind && (
              <button
                type="button"
                onClick={onRemind}
                disabled
                title="Coming soon"
                className="px-4 text-label-sm font-medium text-secondary opacity-50"
              >
                Remind
              </button>
            )}

            {variant === 'pending' && onView && (
              <button
                type="button"
                onClick={onView}
                className="flex items-center gap-1 text-label-sm font-medium text-primary transition-colors hover:text-secondary"
              >
                Details
                <MaterialIcon name="chevron_right" size={16} />
              </button>
            )}

            {variant === 'default' && onView && (
              <button
                type="button"
                onClick={onView}
                className="flex items-center gap-1 text-label-sm font-medium text-primary transition-colors hover:text-secondary"
              >
                Details
                <MaterialIcon name="chevron_right" size={16} />
              </button>
            )}

            {isCreator && onDelete && variant === 'draft' && (
              <button
                type="button"
                onClick={onDelete}
                className="rounded-lg p-2 text-error transition-all hover:bg-error-light"
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
