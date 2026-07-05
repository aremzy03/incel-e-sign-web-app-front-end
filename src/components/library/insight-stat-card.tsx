import { cn } from '@/lib/utils'
import { MaterialIcon } from '@/components/ui/material-icon'

interface InsightStatCardProps {
  icon: string
  label: string
  value: string
  subtext?: string
  placeholder?: boolean
  className?: string
}

export function InsightStatCard({
  icon,
  label,
  value,
  subtext,
  placeholder,
  className,
}: InsightStatCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-surface-container-lowest p-5 shadow-card',
        placeholder && 'opacity-80',
        className,
      )}
      title={placeholder ? 'Coming soon' : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-label-xs font-medium uppercase tracking-wide text-muted">{label}</p>
          <p className="text-headline-xl font-bold text-on-surface">{value}</p>
          {subtext && <p className="text-caption-xs text-muted">{subtext}</p>}
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-container-low">
          <MaterialIcon name={icon} size={22} className="text-secondary" />
        </div>
      </div>
    </div>
  )
}
