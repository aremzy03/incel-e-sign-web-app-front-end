import { cn } from '@/lib/utils'

export type StatusVariant =
  | 'draft'
  | 'pending'
  | 'sent'
  | 'completed'
  | 'signed'
  | 'self-signed'
  | 'rejected'
  | 'your-turn'
  | 'invited'
  | 'registered'
  | 'default'

const variantClasses: Record<StatusVariant, string> = {
  draft: 'badge-status-draft',
  pending: 'badge-status-pending',
  sent: 'badge-status-pending',
  completed: 'badge-status-completed',
  signed: 'badge-status-completed',
  'self-signed': 'badge-status-self-sign',
  rejected: 'badge-status-rejected',
  'your-turn': 'badge-status-your-turn',
  invited: 'bg-surface-container-high text-muted',
  registered: 'badge-status-your-turn',
  default: 'bg-surface-container-high text-on-surface-variant',
}

function normalizeVariant(status: string): StatusVariant {
  const s = status.toLowerCase().replace(/[_\s]+/g, '-')
  if (s.includes('your') && s.includes('turn')) return 'your-turn'
  if (s.includes('self-sign') || s.includes('selfsign')) return 'self-signed'
  if (s.includes('draft')) return 'draft'
  if (s.includes('pending') || s.includes('sent') || s.includes('waiting')) return 'pending'
  if (s.includes('complete') || s.includes('signed')) return 'completed'
  if (s.includes('reject') || s.includes('declin')) return 'rejected'
  if (s.includes('invit')) return 'invited'
  if (s.includes('register') || s.includes('incel')) return 'registered'
  return 'default'
}

interface StatusBadgeProps {
  status: string
  label?: string
  showDot?: boolean
  className?: string
}

export function StatusBadge({ status, label, showDot = true, className }: StatusBadgeProps) {
  const variant = normalizeVariant(status)
  const displayLabel = label ?? status.replace(/[_-]/g, ' ')

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-label-xs font-semibold uppercase tracking-wide',
        variantClasses[variant],
        className,
      )}
    >
      {showDot && (
        <span
          className={cn('h-1.5 w-1.5 shrink-0 rounded-full', {
            'bg-status-draft': variant === 'draft',
            'bg-status-pending': variant === 'pending' || variant === 'sent',
            'bg-status-completed': variant === 'completed' || variant === 'signed',
            'bg-status-your-turn':
              variant === 'self-signed' || variant === 'your-turn' || variant === 'registered',
            'bg-muted': variant === 'invited' || variant === 'default',
          })}
        />
      )}
      {displayLabel}
    </span>
  )
}
