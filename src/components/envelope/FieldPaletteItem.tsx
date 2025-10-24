'use client'

import React from 'react'
import { useDraggable } from '@dnd-kit/core'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { FieldPaletteItem as FieldPaletteItemType } from '@/types/envelope'

interface FieldPaletteItemProps {
  item: FieldPaletteItemType
  disabled?: boolean
}

export function FieldPaletteItem({ item, disabled = false }: FieldPaletteItemProps) {
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

  const style = isDragging ? undefined : (transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined)

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'cursor-grab active:cursor-grabbing transition-all duration-200',
        isDragging && 'opacity-0',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      {...listeners}
      {...attributes}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{item.icon}</div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {item.label}
            </h4>
            <p className="text-xs text-gray-500 truncate">
              {item.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
