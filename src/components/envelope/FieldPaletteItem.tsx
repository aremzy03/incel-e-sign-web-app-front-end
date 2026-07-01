'use client'

import React from 'react'
import { useDraggable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { MaterialIcon } from '@/components/ui/material-icon'
import { FieldPaletteItem as FieldPaletteItemType } from '@/types/envelope'

interface FieldPaletteItemProps {
  item: FieldPaletteItemType
  disabled?: boolean
  className?: string
  compact?: boolean
  materialIcon?: string
  colorClass?: {
    container: string
    icon: string
    label: string
  }
}

export function FieldPaletteItem({
  item,
  disabled = false,
  className,
  compact = false,
  materialIcon,
  colorClass,
}: FieldPaletteItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `field-palette-${item.type}`,
    data: {
      type: 'field-palette-item',
      fieldType: item.type,
    },
    disabled,
  })

  const style = isDragging
    ? undefined
    : transform
      ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
      : undefined

  if (compact && colorClass) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'cursor-grab rounded border p-3 transition-colors active:cursor-grabbing',
          colorClass.container,
          isDragging && 'opacity-0',
          disabled && 'cursor-not-allowed opacity-50',
          className,
        )}
        {...listeners}
        {...attributes}
      >
        <div className="flex items-center gap-3">
          <MaterialIcon name={materialIcon || 'draw'} size={20} className={colorClass.icon} />
          <span className={cn('text-label-sm font-medium', colorClass.label)}>{item.label}</span>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'cursor-grab rounded-lg border border-border bg-surface-container-lowest p-3 transition-all active:cursor-grabbing',
        isDragging && 'opacity-0',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-center gap-3">
        <div className="text-2xl">{item.icon}</div>
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-medium text-on-surface">{item.label}</h4>
          <p className="truncate text-xs text-muted">{item.description}</p>
        </div>
      </div>
    </div>
  )
}
