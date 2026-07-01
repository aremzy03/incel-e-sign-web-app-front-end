import { cn } from '@/lib/utils'
import { MaterialIcon } from '@/components/ui/material-icon'

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon = 'inbox', title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-low">
        <MaterialIcon name={icon} size={32} className="text-muted" />
      </div>
      <h3 className="text-headline-lg font-semibold text-on-surface">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-body-sm text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
