'use client'

import React, { useState, useRef, useCallback } from 'react'
import Draggable, { DraggableEvent, DraggableData } from 'react-draggable'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MaterialIcon } from '@/components/ui/material-icon'
import { FIELD_EDITOR_THEMES, FIELD_TYPE_LABELS } from '@/components/envelope/field-editor-themes'
import { FieldPosition, RecipientInput } from '@/types/envelope'

interface FieldBoxProps {
  field: FieldPosition
  recipients: RecipientInput[]
  isActive: boolean
  onPositionChange: (fieldId: string, position: Partial<FieldPosition>) => void
  onSelect: (fieldId: string) => void
  onDelete: (fieldId: string) => void
  maxWidth?: number
  maxHeight?: number
  variant?: 'default' | 'editor'
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
  variant = 'default',
}: FieldBoxProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [showRecipientSelect, setShowRecipientSelect] = useState(false)
  const nodeRef = useRef<HTMLDivElement>(null)

  const assignedRecipient = recipients.find((r) => r.id.toString() === field.assignedTo)
  const recipientName = assignedRecipient
    ? assignedRecipient.name || assignedRecipient.email
    : 'Unassigned'

  const theme = FIELD_EDITOR_THEMES[field.type]
  const fieldColor = assignedRecipient?.color || '#6B7280'

  const formatDate = (d: Date, pattern?: string) => {
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const mmm = d.toLocaleString('en', { month: 'short' })
    switch (pattern) {
      case 'MM/DD/YYYY':
        return `${mm}/${dd}/${yyyy}`
      case 'DD/MM/YYYY':
        return `${dd}/${mm}/${yyyy}`
      case 'YYYY/MM/DD':
        return `${yyyy}/${mm}/${dd}`
      case 'DD-MMM-YYYY':
        return `${dd}-${mmm}-${yyyy}`
      case 'YYYY-MM-DD':
      default:
        return `${yyyy}-${mm}-${dd}`
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
    (_e: DraggableEvent, data: DraggableData) => {
      setIsDragging(false)
      const newX = Math.max(0, data.x)
      const newY = Math.max(0, data.y)
      onPositionChange(field.id, { x: newX, y: newY })
    },
    [field.id, onPositionChange],
  )

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setIsResizing(true)
      onSelect(field.id)
    },
    [field.id, onSelect],
  )

  const handleResize = useCallback(
    (e: React.MouseEvent) => {
      if (!isResizing || !nodeRef.current) return
      e.preventDefault()
      e.stopPropagation()
      const rect = nodeRef.current.getBoundingClientRect()
      const newWidth = Math.max(116.8, e.clientX - rect.left)
      const newHeight = Math.max(36.8, e.clientY - rect.top)
      onPositionChange(field.id, { width: newWidth, height: newHeight })
    },
    [isResizing, field.id, onPositionChange],
  )

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false)
  }, [])

  const handleRecipientSelect = (recipientId: string) => {
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

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResize as unknown as EventListener)
      document.addEventListener('mouseup', handleResizeEnd)
      return () => {
        document.removeEventListener('mousemove', handleResize as unknown as EventListener)
        document.removeEventListener('mouseup', handleResizeEnd)
      }
    }
  }, [isResizing, handleResize, handleResizeEnd])

  const renderEditorContent = () => {
    const labelRow = (
      <div className="flex min-w-0 flex-col items-center justify-center gap-0.5 px-1">
        <div className="flex items-center justify-center">
          <MaterialIcon name={theme.materialIcon} size={18} className={theme.icon} />
          <span className={cn('ml-1.5 truncate text-label-sm font-medium', theme.label)}>
            {FIELD_TYPE_LABELS[field.type]}
          </span>
        </div>
        {field.assignedTo && (
          <span className={cn('max-w-full truncate text-[10px] font-semibold', theme.label)}>
            {recipientName}
          </span>
        )}
      </div>
    )

    if (!field.assignedTo) {
      return labelRow
    }

    if (field.type === 'signature') {
      return labelRow
    }

    if (field.type === 'date') {
      if (field.prefill_value && field.prefill_value.trim() !== '') {
        return (
          <span className={cn('truncate px-1 text-label-sm', theme.label)}>
            {field.prefill_value}
          </span>
        )
      }
      return labelRow
    }

    if (field.type === 'initials') {
      const value =
        field.prefill_value && field.prefill_value.trim() !== ''
          ? field.prefill_value
          : getInitials(assignedRecipient?.name || assignedRecipient?.email)
      return (
        <span className={cn('truncate px-1 text-label-sm font-medium', theme.label)}>{value}</span>
      )
    }

    if (field.type === 'designation' || field.type === 'text') {
      const value =
        field.prefill_value && field.prefill_value.trim() !== ''
          ? field.prefill_value
          : field.placeholder || FIELD_TYPE_LABELS[field.type]
      return <span className={cn('truncate px-2 text-label-sm', theme.label)}>{value}</span>
    }

    return labelRow
  }

  const renderDefaultContent = () => {
    if (!field.assignedTo) {
      return <span className="text-[11px] opacity-60">Assign recipient</span>
    }
    if (field.type === 'date') {
      const value =
        field.prefill_value && field.prefill_value.trim() !== ''
          ? field.prefill_value
          : formatDate(new Date(), field.date_format || 'YYYY-MM-DD')
      return <span className="w-full truncate px-1 text-center">{value}</span>
    }
    if (field.type === 'initials') {
      const value =
        field.prefill_value && field.prefill_value.trim() !== ''
          ? field.prefill_value
          : getInitials(assignedRecipient?.name || assignedRecipient?.email)
      return <span className="w-full truncate px-1 text-center">{value || '—'}</span>
    }
    if (field.type === 'designation') {
      const value =
        field.prefill_value && field.prefill_value.trim() !== ''
          ? field.prefill_value
          : 'Head of Operations'
      return <span className="w-full truncate px-2">{value}</span>
    }
    if (field.type === 'signature') {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-0.5 pt-3">
          <span className="text-base leading-none">✍️</span>
          <span className="max-w-full truncate px-1 text-[10px] opacity-80">
            {assignedRecipient?.name || assignedRecipient?.email || 'Signature'}
          </span>
        </div>
      )
    }
    const placeholder = field.placeholder || 'Sample text'
    const value = field.prefill_value && field.prefill_value.trim() !== '' ? field.prefill_value : ''
    return (
      <input
        type="text"
        defaultValue={value}
        placeholder={placeholder}
        maxLength={field.max_length || undefined}
        className="h-[70%] w-full bg-transparent text-center outline-none"
        style={{ fontFamily: field.font_family || 'Helvetica', fontSize: field.font_size || 12 }}
        readOnly
      />
    )
  }

  const isEditor = variant === 'editor'
  const unassigned = !field.assignedTo

  return (
    <Draggable
      nodeRef={nodeRef}
      position={{ x: field.x, y: field.y }}
      onStart={handleDragStart}
      onStop={handleDragStop}
      disabled={isResizing}
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
        data-field-id={field.id}
        className={cn(
          'group absolute flex cursor-move select-none items-center justify-center text-xs font-medium transition-all pointer-events-auto',
          isEditor ? 'rounded' : 'rounded-md',
          isEditor
            ? cn(
                'border-2 border-dashed',
                theme.container,
                theme.border,
                isActive && 'outline outline-2 outline-offset-2 outline-secondary/60',
                isDragging && 'cursor-grabbing shadow-lg',
              )
            : cn(
                'rounded-md border-2',
                'hover:shadow-md hover:z-50',
                isActive ? 'z-50' : 'z-40',
                isDragging && 'cursor-grabbing shadow-lg scale-105 z-50',
                unassigned && 'border-dashed bg-yellow-100 opacity-75 animate-pulse',
              ),
        )}
        style={
          isEditor
            ? { width: field.width, height: field.height }
            : {
                width: field.width,
                height: field.height,
                borderColor: unassigned ? '#F59E0B' : fieldColor,
                backgroundColor: unassigned ? '#FEF3C7' : `${fieldColor}20`,
                color: unassigned ? '#92400E' : fieldColor,
              }
        }
        onClick={handleClick}
      >
        {isEditor && (
          <div
            className={cn(
              'absolute -left-1 -top-3 max-w-[calc(100%+8px)] truncate rounded-full px-2 py-0.5 text-[10px] font-bold text-white',
              unassigned ? 'bg-warning' : theme.tag,
            )}
            title={recipientName}
          >
            {recipientName}
          </div>
        )}

        <div
          className={cn(
            'relative flex h-full w-full items-center justify-center overflow-hidden',
            isEditor ? 'px-2' : 'flex-1 p-1',
          )}
          style={
            !isEditor
              ? { fontFamily: field.font_family || 'Helvetica', fontSize: field.font_size || 12 }
              : undefined
          }
        >
          {!isEditor && (
            <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-1 pt-0.5 text-[10px] leading-none text-body">
              <span className="max-w-[70%] truncate">
                {assignedRecipient ? assignedRecipient.name || assignedRecipient.email : 'Unassigned'}
              </span>
              <span className="uppercase opacity-80">{FIELD_TYPE_LABELS[field.type]}</span>
            </div>
          )}

          <div
            className={cn(
              'flex items-center justify-center',
              isEditor ? 'h-full w-full' : 'h-full w-full text-on-surface',
            )}
            style={
              !isEditor
                ? { fontFamily: field.font_family || 'Helvetica', fontSize: field.font_size || 12 }
                : undefined
            }
          >
            {isEditor ? renderEditorContent() : renderDefaultContent()}
          </div>

          {field.required && (
            <div className="absolute bottom-0.5 right-1 text-[10px] text-error">*</div>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'absolute -right-2 -top-2 h-5 w-5 rounded-full bg-error p-0 text-white hover:bg-error/90',
            isEditor && 'opacity-0 transition-opacity group-hover:opacity-100',
          )}
          data-no-drag="true"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(field.id)
          }}
        >
          <X className="h-3 w-3" />
        </Button>

        <div
          className={cn(
            'absolute bottom-0 right-0 h-3 w-3 cursor-se-resize border-b-2 border-r-2 border-current opacity-40 hover:opacity-100',
            isEditor && 'opacity-0 group-hover:opacity-60',
          )}
          data-no-drag="true"
          onMouseDown={handleResizeStart}
          style={{ borderColor: isEditor ? undefined : fieldColor }}
        />

        {showRecipientSelect && (
          <div
            data-no-drag="true"
            className="absolute bottom-full left-0 z-30 mb-1 min-w-48 rounded-md border border-outline-variant bg-white shadow-xl"
          >
            <div data-no-drag="true" className="p-2">
              <div className="mb-2 text-xs font-medium text-body">Assign to recipient:</div>
              <Select onValueChange={handleRecipientSelect}>
                <SelectTrigger data-no-drag="true" className="h-8">
                  <SelectValue placeholder="Select recipient" />
                </SelectTrigger>
                <SelectContent>
                  {recipients.map((recipient) => (
                    <SelectItem key={recipient.id} value={recipient.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: recipient.color }}
                        />
                        <span>
                          {recipient.name} ({recipient.email})
                        </span>
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
