'use client'

import { cn } from '@/lib/utils'

export interface FilterPillOption<T extends string = string> {
  value: T
  label: string
  count?: number
}

interface FilterPillsProps<T extends string = string> {
  options: FilterPillOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
  'aria-label'?: string
}

export function FilterPills<T extends string = string>({
  options,
  value,
  onChange,
  className,
  'aria-label': ariaLabel = 'Filter options',
}: FilterPillsProps<T>) {
  return (
    <div
      className={cn('flex flex-wrap gap-2', className)}
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const isActive = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-label-sm font-medium transition-colors',
              isActive
                ? 'border-secondary bg-secondary text-on-secondary'
                : 'border-border bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low',
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-1.5 text-caption-xs',
                  isActive ? 'bg-on-secondary/20' : 'bg-surface-container text-muted',
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

interface SegmentedControlProps<T extends string = string> {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  className?: string
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn(
        'inline-flex rounded-lg border border-border bg-surface-container-low p-0.5',
        className,
      )}
      role="group"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-md px-4 py-1.5 text-label-sm font-medium transition-colors',
            value === option.value
              ? 'bg-surface-container-lowest font-bold text-secondary shadow-sm'
              : 'text-muted hover:text-on-surface',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
