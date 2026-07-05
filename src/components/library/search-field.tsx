import { cn } from '@/lib/utils'
import { MaterialIcon } from '@/components/ui/material-icon'

interface SearchFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  containerClassName?: string
}

export function SearchField({ className, containerClassName, ...props }: SearchFieldProps) {
  return (
    <div className={cn('relative', containerClassName)}>
      <MaterialIcon
        name="search"
        size={20}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
      />
      <input
        type="search"
        className={cn(
          'w-full rounded-lg border border-border bg-surface-container-lowest py-2.5 pl-10 pr-4 text-body-sm text-on-surface placeholder:text-muted focus:border-status-your-turn focus:outline-none focus:ring-2 focus:ring-status-your-turn/20',
          className,
        )}
        {...props}
      />
    </div>
  )
}
