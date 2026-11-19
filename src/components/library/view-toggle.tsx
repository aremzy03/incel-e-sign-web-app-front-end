'use client'

import { cn } from '@/lib/utils'
import { MaterialIcon } from '@/components/ui/material-icon'

interface ViewToggleProps {
  view: 'table' | 'grid'
  onChange: (view: 'table' | 'grid') => void
  className?: string
}

export function ViewToggle({ view, onChange, className }: ViewToggleProps) {
  return (
    <div
      className={cn(
        'inline-flex rounded-xl border border-border bg-surface p-1',
        className,
      )}
      role="group"
      aria-label="View mode"
    >
      <button
        type="button"
        onClick={() => onChange('table')}
        className={cn(
          'rounded-lg p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-status-your-turn',
          view === 'table'
            ? 'bg-surface-container-lowest text-primary'
            : 'text-muted hover:text-primary',
        )}
        aria-label="Table view"
        aria-pressed={view === 'table'}
      >
        <MaterialIcon name="table_rows" size={20} />
      </button>
      <button
        type="button"
        onClick={() => onChange('grid')}
        className={cn(
          'rounded-lg p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-status-your-turn',
          view === 'grid'
            ? 'bg-surface-container-lowest text-primary'
            : 'text-muted hover:text-primary',
        )}
        aria-label="Grid view"
        aria-pressed={view === 'grid'}
      >
        <MaterialIcon name="grid_view" size={20} />
      </button>
    </div>
  )
}
