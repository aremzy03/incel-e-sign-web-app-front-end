import { cn } from '@/lib/utils'

export interface EnvelopeSignerStackUser {
  id: string
  name?: string
  status?: 'completed' | 'current' | 'pending' | 'rejected'
}

interface EnvelopeSignerStackProps {
  users: EnvelopeSignerStackUser[]
  max?: number
  className?: string
}

function getInitials(name?: string): string {
  if (!name?.trim()) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
}

const statusStyles: Record<
  NonNullable<EnvelopeSignerStackUser['status']>,
  { bg: string; text: string; pulse?: boolean }
> = {
  completed: {
    bg: 'bg-success-light',
    text: 'text-status-completed',
  },
  current: {
    bg: 'bg-accent-light',
    text: 'text-secondary',
    pulse: true,
  },
  pending: {
    bg: 'bg-surface-container',
    text: 'text-muted',
  },
  rejected: {
    bg: 'bg-error-light',
    text: 'text-status-rejected',
  },
}

export function EnvelopeSignerStack({
  users,
  max = 5,
  className,
}: EnvelopeSignerStackProps) {
  const visible = users.slice(0, max)
  const overflow = users.length - max

  return (
    <div className={cn('flex items-center', className)}>
      {visible.map((user, i) => {
        const style = statusStyles[user.status ?? 'pending']
        return (
          <div
            key={user.id}
            className={cn(
              'relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface-container-lowest text-[10px] font-semibold',
              style.bg,
              style.text,
              i > 0 && '-ml-2',
            )}
            style={{ zIndex: visible.length - i }}
            title={user.name}
          >
            {style.pulse && <span className="pulse-ring absolute inset-0 rounded-full" />}
            <span className="leading-none">{getInitials(user.name)}</span>
          </div>
        )
      })}
      {overflow > 0 && (
        <div
          className="-ml-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface-container-lowest bg-surface-container-high text-[10px] font-medium text-muted"
          style={{ zIndex: 0 }}
        >
          +{overflow}
        </div>
      )}
    </div>
  )
}
