import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  badge?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, badge, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between', className)}>
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-headline-2xl font-bold text-on-surface">{title}</h1>
          {badge}
        </div>
        {subtitle && <p className="text-body-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
