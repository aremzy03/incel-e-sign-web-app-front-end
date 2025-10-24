'use client'

import React, { useState, useRef, useCallback } from 'react'
import Draggable, { DraggableEvent, DraggableData } from 'react-draggable'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FieldPosition, FieldType, RecipientInput } from '@/types/envelope'

interface FieldBoxProps {
  field: FieldPosition
  recipients: RecipientInput[]
  isActive: boolean
  onPositionChange: (fieldId: string, position: Partial<FieldPosition>) => void
  onSelect: (fieldId: string) => void
  onDelete: (fieldId: string) => void
  maxWidth?: number
  maxHeight?: number
}

const FIELD_TYPE_ICONS: Record<FieldType, string> = {
  signature: '✍️',
  initials: '🖋️',
  date: '📅',
  text: '📝',
  checkbox: '☑️',
}

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  signature: 'Signature',
  initials: 'Initials',
  date: 'Date',
  text: 'Text',
  checkbox: 'Checkbox',
}

export function FieldBox({
  field,
  recipients,
  isActive,
  onPositionChange,
  onSelect,
  onDelete,
  maxWidth,
  maxHeight,
}: FieldBoxProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [showRecipientSelect, setShowRecipientSelect] = useState(false)
  const nodeRef = useRef<HTMLDivElement>(null)

  const assignedRecipient = recipients.find(r => r.id.toString() === field.assignedTo)
  const fieldColor = assignedRecipient?.color || '#6B7280'

  const handleDragStart = useCallback(() => {
    setIsDragging(true)
    onSelect(field.id)
  }, [field.id, onSelect])

  const handleDragStop = useCallback(
    (e: DraggableEvent, data: DraggableData) => {
      // If there was no actual movement, don't update coordinates (prevents 0,0 resets on click)
      const movedX = (data as any).deltaX !== undefined ? (data as any).deltaX : 0
      const movedY = (data as any).deltaY !== undefined ? (data as any).deltaY : 0
      setIsDragging(false)
      if (Math.abs(movedX) < 1 && Math.abs(movedY) < 1) {
        return
      }

      const newX = Math.max(0, data.x)
      const newY = Math.max(0, data.y)
      onPositionChange(field.id, { x: newX, y: newY })
    },
    [field.id, onPositionChange]
  )

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsResizing(true)
    onSelect(field.id)
  }, [field.id, onSelect])

  const handleResize = useCallback(
    (e: React.MouseEvent) => {
      if (!isResizing || !nodeRef.current) return

      e.preventDefault()
      e.stopPropagation()

      const rect = nodeRef.current.getBoundingClientRect()
      const newWidth = Math.max(100, e.clientX - rect.left)
      const newHeight = Math.max(40, e.clientY - rect.top)

      onPositionChange(field.id, {
        width: newWidth,
        height: newHeight,
      })
    },
    [isResizing, field.id, onPositionChange]
  )

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false)
  }, [])

  const handleRecipientSelect = (recipientId: string) => {
    // Only update assignment; page-level merge preserves x/y if not provided
    onPositionChange(field.id, { assignedTo: recipientId })
    setShowRecipientSelect(false)
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect(field.id)
    if (!field.assignedTo) {
      setShowRecipientSelect(true)
    }
  }

  // Add global mouse event listeners for resizing
  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResize as any)
      document.addEventListener('mouseup', handleResizeEnd)
      return () => {
        document.removeEventListener('mousemove', handleResize as any)
        document.removeEventListener('mouseup', handleResizeEnd)
      }
    }
  }, [isResizing, handleResize, handleResizeEnd])

  return (
    <Draggable
      nodeRef={nodeRef}
      defaultPosition={{ x: 0, y: 0 }}
      onStart={handleDragStart}
      onStop={handleDragStop}
      disabled={isResizing}
      bounds={{
        left: 0,
        top: 0,
        right: maxWidth ? maxWidth - field.width : 2000,
        bottom: maxHeight ? maxHeight - field.height : 2000,
      }}
    >
      <div
        ref={nodeRef}
        className={cn(
          'absolute cursor-move select-none rounded-md border-2 flex items-center justify-center text-xs font-medium transition-all pointer-events-auto',
          'hover:shadow-md hover:z-50',
          isActive ? 'z-50' : 'z-40',
          isDragging && 'cursor-grabbing shadow-lg scale-105 z-50',
          !field.assignedTo && 'border-dashed opacity-75 bg-yellow-100 animate-pulse'
        )}
        style={{
          width: field.width,
          height: field.height,
          borderColor: !field.assignedTo ? '#F59E0B' : fieldColor,
          backgroundColor: !field.assignedTo ? '#FEF3C7' : `${fieldColor}20`,
          color: !field.assignedTo ? '#92400E' : fieldColor,
        }}
        onClick={handleClick}
      >
        <div className="text-center p-1 overflow-hidden flex-1">
          <div className="flex items-center justify-center gap-1 mb-1">
            <span className="text-lg">{FIELD_TYPE_ICONS[field.type]}</span>
            <span className="text-xs font-semibold truncate">
              {FIELD_TYPE_LABELS[field.type]}
            </span>
          </div>
          
          {assignedRecipient ? (
            <div className="text-xs opacity-75 truncate">
              {assignedRecipient.name}
            </div>
          ) : (
            <div className="text-xs opacity-50 truncate">
              Click to assign
            </div>
          )}
        </div>
        
        {/* Delete button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute -top-2 -right-2 h-5 w-5 p-0 rounded-full bg-red-500 hover:bg-red-600 text-white"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(field.id)
          }}
        >
          <X className="h-3 w-3" />
        </Button>
        
        {/* Resize handle */}
        <div
          className={cn(
            'absolute bottom-0 right-0 w-3 h-3 cursor-se-resize opacity-60 hover:opacity-100',
            'border-r-2 border-b-2 border-current'
          )}
          onMouseDown={handleResizeStart}
          style={{ borderColor: fieldColor }}
        />

        {/* Recipient selection dropdown */}
        {showRecipientSelect && (
          <div className="absolute top-full left-0 mt-1 z-30 bg-white border rounded-md shadow-lg min-w-48">
            <div className="p-2">
              <div className="text-xs font-medium text-gray-700 mb-2">
                Assign to recipient:
              </div>
              <Select onValueChange={handleRecipientSelect}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select recipient" />
                </SelectTrigger>
                <SelectContent>
                  {recipients.map((recipient) => (
                    <SelectItem key={recipient.id} value={recipient.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: recipient.color }}
                        />
                        <span>{recipient.name} ({recipient.email})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
    </Draggable>
  )
}
