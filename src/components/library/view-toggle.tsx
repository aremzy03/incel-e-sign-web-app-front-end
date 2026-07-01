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
        'inline-flex rounded-lg border border-border bg-surface-container-low p-0.5',
        className,
      )}
      role="group"
      aria-label="View mode"
    >
      <button
        type="button"
        onClick={() => onChange('table')}
        className={cn(
          'rounded-md p-2 transition-colors',
          view === 'table'
            ? 'bg-surface text-secondary shadow-sm'
            : 'text-muted hover:text-on-surface',
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
          'rounded-md p-2 transition-colors',
          view === 'grid'
            ? 'bg-surface-container-lowest text-on-surface shadow-sm'
            : 'text-muted hover:text-on-surface',
        )}
        aria-label="Grid view"
        aria-pressed={view === 'grid'}
      >
        <MaterialIcon name="grid_view" size={20} />
      </button>
    </div>
  )
}
