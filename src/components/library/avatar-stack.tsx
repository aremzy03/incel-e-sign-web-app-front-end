import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export interface AvatarStackUser {
  id: string
  name?: string
  imageUrl?: string | null
  status?: 'completed' | 'current' | 'pending' | 'rejected'
}

interface AvatarStackProps {
  users: AvatarStackUser[]
  max?: number
  size?: 'sm' | 'md'
  className?: string
}

export function AvatarStack({ users, max = 4, size = 'md', className }: AvatarStackProps) {
  const visible = users.slice(0, max)
  const overflow = users.length - max
  const sizeClass = size === 'sm' ? 'h-7 w-7 text-[10px]' : 'h-9 w-9 text-xs'

  return (
    <div className={cn('flex items-center', className)}>
      {visible.map((user, i) => (
        <div
          key={user.id}
          className={cn('relative', i > 0 && '-ml-2')}
          style={{ zIndex: visible.length - i }}
        >
          <Avatar
            className={cn(
              sizeClass,
              'border-2 border-surface-container-lowest',
              user.status === 'current' && 'pulse-ring ring-2 ring-status-your-turn',
              user.status === 'rejected' && 'opacity-60',
            )}
          >
            {user.imageUrl && <AvatarImage src={user.imageUrl} alt={user.name} />}
            <AvatarFallback className="bg-primary text-on-primary">
              {(user.name ?? '?').slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      ))}
      {overflow > 0 && (
        <div
          className={cn(
            '-ml-2 flex items-center justify-center rounded-full border-2 border-surface-container-lowest bg-surface-container-high font-medium text-muted',
            sizeClass,
          )}
        >
          +{overflow}
        </div>
      )}
    </div>
  )
}
