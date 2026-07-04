import { Loader2 } from 'lucide-react'
import { MaterialIcon } from '@/components/ui/material-icon'
import { cn } from '@/lib/utils'

type AsyncStateVariant = 'loading' | 'error' | 'empty' | 'notFound'

interface AsyncStatePanelProps {
  variant: AsyncStateVariant
  title: string
  description?: string
  icon?: string
  className?: string
  primaryAction?: React.ReactNode
  secondaryAction?: React.ReactNode
  children?: React.ReactNode
}

const variantIconMap: Record<AsyncStateVariant, string> = {
  loading: 'progress_activity',
  error: 'error',
  empty: 'inbox',
  notFound: 'search_off',
}

const variantToneMap: Record<Exclude<AsyncStateVariant, 'loading'>, string> = {
  error: 'bg-error-light text-error',
  empty: 'bg-surface-container-low text-muted',
  notFound: 'bg-warning-light text-warning',
}

export function AsyncStatePanel({
  variant,
  title,
  description,
  icon,
  className,
  primaryAction,
  secondaryAction,
  children,
}: AsyncStatePanelProps) {
  const resolvedIcon = icon ?? variantIconMap[variant]
  const isLoading = variant === 'loading'
  const role = isLoading ? 'status' : 'alert'

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-surface-container-lowest px-6 py-10 text-center shadow-card',
        className,
      )}
      role={role}
      aria-live={isLoading ? 'polite' : 'assertive'}
    >
      <div className="mx-auto flex max-w-md flex-col items-center">
        <div
          className={cn(
            'mb-4 flex h-16 w-16 items-center justify-center rounded-full',
            isLoading ? 'bg-surface-container-low text-primary' : variantToneMap[variant],
          )}
        >
          {isLoading ? (
            <Loader2 className="h-7 w-7 animate-spin" />
          ) : (
            <MaterialIcon name={resolvedIcon} size={30} className="text-inherit" />
          )}
        </div>
        <h2 className="text-headline-lg font-semibold text-on-surface">{title}</h2>
        {description ? (
          <p className="mt-2 max-w-[42rem] text-body-sm leading-6 text-muted">{description}</p>
        ) : null}
        {children ? <div className="mt-4 w-full">{children}</div> : null}
        {(primaryAction || secondaryAction) && (
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {primaryAction}
            {secondaryAction}
          </div>
        )}
      </div>
    </div>
  )
}
