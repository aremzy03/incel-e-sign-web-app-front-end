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
  designation: '🏷️',
}

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  signature: 'Signature',
  initials: 'Initials',
  date: 'Date',
  text: 'Text',
  designation: 'Designation',
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

  // Helpers for live preview
  const formatDate = (d: Date, pattern?: string) => {
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const mmm = d.toLocaleString('en', { month: 'short' })
    switch (pattern) {
      case 'MM/DD/YYYY': return `${mm}/${dd}/${yyyy}`
      case 'DD/MM/YYYY': return `${dd}/${mm}/${yyyy}`
      case 'YYYY/MM/DD': return `${yyyy}/${mm}/${dd}`
      case 'DD-MMM-YYYY': return `${dd}-${mmm}-${yyyy}`
      case 'YYYY-MM-DD':
      default: return `${yyyy}-${mm}-${dd}`
    }
  }
  const getInitials = (name?: string) => {
    if (!name) return 'AB'
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  }

  const handleDragStart = useCallback(() => {
    setIsDragging(true)
    onSelect(field.id)
  }, [field.id, onSelect])

  const handleDragStop = useCallback(
    (e: DraggableEvent, data: DraggableData) => {
      setIsDragging(false)
      // Ensure coordinates are always positive
      const newX = Math.max(0, data.x)
      const newY = Math.max(0, data.y)
      
      console.log('Field box drag stop:', { 
        originalX: data.x, 
        originalY: data.y, 
        newX, 
        newY,
        bounds: {
          left: 0,
          top: 0,
          right: maxWidth ? maxWidth - field.width : 2000,
          bottom: maxHeight ? maxHeight - field.height : 2000,
        },
        maxWidth,
        maxHeight,
        field
      })
      
      onPositionChange(field.id, { x: newX, y: newY })
    },
    [field.id, field.width, field.height, onPositionChange, maxWidth, maxHeight]
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
      const newWidth = Math.max(116.8, e.clientX - rect.left)
      const newHeight = Math.max(36.8, e.clientY - rect.top)

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
      position={{ x: field.x, y: field.y }}
      onStart={handleDragStart}
      onStop={handleDragStop}
      disabled={isResizing}
      // Prevent accidental drags when interacting with controls (recipient select, delete, resize handle, inputs)
      cancel='[data-no-drag="true"],button,select,option,input,textarea,[role="listbox"],[role="option"]'
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
        <div className="p-1 overflow-hidden flex-1 h-full w-full relative">
          {/* Header: field type + recipient name */}
          <div className="absolute top-0 left-0 right-0 text-[10px] leading-none px-1 pt-0.5 text-gray-800 flex items-center justify-between">
            <span className="truncate max-w-[70%]">{assignedRecipient ? (assignedRecipient.name || assignedRecipient.email) : 'Unassigned'}</span>
            <span className="uppercase opacity-80">{FIELD_TYPE_LABELS[field.type]}</span>
          </div>

          {/* Live preview content */}
          <div
            className="w-full h-full flex items-center justify-center text-gray-900"
            style={{ fontFamily: field.font_family || 'Helvetica', fontSize: field.font_size || 12 }}
          >
            {(() => {
              if (!field.assignedTo) {
                return <span className="text-[11px] opacity-60">Assign recipient</span>
              }
              if (field.type === 'date') {
                const value = (field.prefill_value && field.prefill_value.trim() !== '')
                  ? field.prefill_value!
                  : formatDate(new Date(), field.date_format || 'YYYY-MM-DD')
                return <span className="px-1 truncate w-full text-center">{value}</span>
              }
              if (field.type === 'initials') {
                const value = (field.prefill_value && field.prefill_value.trim() !== '')
                  ? field.prefill_value!
                  : getInitials(assignedRecipient?.name || assignedRecipient?.email)
                return <span className="px-1 truncate w-full text-center">{value || '—'}</span>
              }
              if (field.type === 'designation') {
                const value = (field.prefill_value && field.prefill_value.trim() !== '')
                  ? field.prefill_value!
                  : 'Head of Operations'
                return <span className="px-2 truncate w-full">{value}</span>
              }
              // text
              const placeholder = field.placeholder || 'Sample text'
              const value = (field.prefill_value && field.prefill_value.trim() !== '') ? field.prefill_value! : ''
              return (
                <input
                  type="text"
                  defaultValue={value}
                  placeholder={placeholder}
                  maxLength={field.max_length || undefined}
                  className="w-full h-[70%] bg-transparent outline-none text-center"
                  style={{ fontFamily: field.font_family || 'Helvetica', fontSize: field.font_size || 12 }}
                  readOnly
                />
              )
            })()}
          </div>
          {/* Required marker */}
          {field.required && (
            <div className="absolute bottom-0.5 right-1 text-[10px] text-red-600">*</div>
          )}
        </div>
        
        {/* Delete button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute -top-2 -right-2 h-5 w-5 p-0 rounded-full bg-red-500 hover:bg-red-600 text-white"
          data-no-drag="true"
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
          data-no-drag="true"
          onMouseDown={handleResizeStart}
          style={{ borderColor: fieldColor }}
        />

        {/* Recipient selection dropdown */}
        {showRecipientSelect && (
          <div data-no-drag="true" className="absolute bottom-full left-0 mb-1 z-30 bg-white border border-gray-300 rounded-md shadow-xl min-w-48">
            <div data-no-drag="true" className="p-2">
              <div className="text-xs font-medium text-gray-700 mb-2">
                Assign to recipient:
              </div>
              <Select onValueChange={handleRecipientSelect}>
                <SelectTrigger data-no-drag="true" className="h-8">
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
