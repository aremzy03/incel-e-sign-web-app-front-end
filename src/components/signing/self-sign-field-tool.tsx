'use client'

import { useDraggable } from '@dnd-kit/core'
import { MaterialIcon } from '@/components/ui/material-icon'
import { cn } from '@/lib/utils'

interface SelfSignFieldToolProps {
  fieldType: string
  label: string
  description?: string
  icon: string
  disabled?: boolean
  highlighted?: boolean
  onClick?: () => void
}

export function SelfSignFieldTool({
  fieldType,
  label,
  description,
  icon,
  disabled = false,
  highlighted = false,
  onClick,
}: SelfSignFieldToolProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `self-sign-tool-${fieldType}`,
    data: { type: 'field-palette-item', fieldType },
    disabled,
  })

  const style = isDragging
    ? undefined
    : transform
      ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
      : undefined

  return (
    <button
      ref={setNodeRef}
      type="button"
      style={style}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'group flex w-full items-center justify-between rounded-xl border border-border bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-secondary',
        isDragging && 'opacity-0',
        disabled && 'cursor-not-allowed opacity-50',
        highlighted && 'border-secondary',
      )}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
            highlighted
              ? 'bg-secondary/10 text-secondary group-hover:bg-secondary group-hover:text-white'
              : 'bg-surface-container text-on-surface-variant',
          )}
        >
          <MaterialIcon name={icon} size={22} />
        </div>
        <div className="text-left">
          <div className="font-label-sm text-on-surface">{label}</div>
          {description ? <div className="text-[11px] text-muted">{description}</div> : null}
        </div>
      </div>
      <MaterialIcon
        name="add_circle"
        size={22}
        className="text-muted transition-colors group-hover:text-secondary"
      />
    </button>
  )
}
