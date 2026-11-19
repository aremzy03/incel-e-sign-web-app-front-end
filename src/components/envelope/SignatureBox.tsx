'use client'

import React, { useState, useRef, useCallback } from 'react'
import Draggable, { DraggableEvent, DraggableData } from 'react-draggable'
import { cn } from '@/lib/utils'

interface SignatureBoxProps {
  signer: {
    id: string
    name: string
    email: string
  }
  position: {
    x: number
    y: number
    width: number
    height: number
  }
  isActive: boolean
  pageNumber: number
  onPositionChange: (position: { x: number; y: number; width: number; height: number }) => void
  onSelect: () => void
  color: string
  maxWidth?: number
  maxHeight?: number
}

export function SignatureBox({
  signer,
  position,
  isActive,
  pageNumber,
  onPositionChange,
  onSelect,
  color,
  maxWidth,
  maxHeight,
}: SignatureBoxProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const nodeRef = useRef<HTMLDivElement>(null)

  const handleDragStart = useCallback(() => {
    setIsDragging(true)
    onSelect()
  }, [onSelect])

  const handleDragStop = useCallback(
    (e: DraggableEvent, data: DraggableData) => {
      setIsDragging(false)
      // Ensure coordinates are always positive
      const newX = Math.max(0, data.x)
      const newY = Math.max(0, data.y)
      
      console.log('Signature box drag stop:', { 
        originalX: data.x, 
        originalY: data.y, 
        newX, 
        newY,
        bounds: {
          left: 0,
          top: 0,
          right: maxWidth ? maxWidth - position.width : 2000,
          bottom: maxHeight ? maxHeight - position.height : 2000,
        },
        maxWidth,
        maxHeight,
        position
      })
      
      onPositionChange({
        ...position,
        x: newX,
        y: newY,
      })
    },
    [position, onPositionChange]
  )

  const handleResizeStart = useCallback((e: React.PointerEvent) => {
    e.stopPropagation()
      e.preventDefault()
    setIsResizing(true)
    onSelect()
  }, [onSelect])

  const handleResize = useCallback(
    (e: PointerEvent) => {
      if (!isResizing || !nodeRef.current) return

      e.preventDefault()
      e.stopPropagation()

      const rect = nodeRef.current.getBoundingClientRect()
      const parentRect = nodeRef.current.parentElement?.getBoundingClientRect()
      
      if (!parentRect) return

      const newWidth = Math.max(100, e.clientX - rect.left)
      const newHeight = Math.max(40, e.clientY - rect.top)

      console.log('Signature box resize:', { 
        newWidth, 
        newHeight, 
        currentPosition: position 
      })

      onPositionChange({
        ...position,
        width: newWidth,
        height: newHeight,
      })
    },
    [isResizing, position, onPositionChange]
  )

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false)
  }, [])

  // Global pointer listeners so resizing works with mouse, touch and pen
  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('pointermove', handleResize)
      document.addEventListener('pointerup', handleResizeEnd)
      document.addEventListener('pointercancel', handleResizeEnd)
      return () => {
        document.removeEventListener('pointermove', handleResize)
        document.removeEventListener('pointerup', handleResizeEnd)
        document.removeEventListener('pointercancel', handleResizeEnd)
      }
    }
  }, [isResizing, handleResize, handleResizeEnd])

  return (
    <Draggable
      nodeRef={nodeRef}
      position={{ x: position.x, y: position.y }}
      onStart={handleDragStart}
      onStop={handleDragStop}
      disabled={isResizing}
      cancel='[data-no-drag="true"]'
      bounds={{
        left: 0,
        top: 0,
        right: maxWidth ? maxWidth - position.width : 2000,
        bottom: maxHeight ? maxHeight - position.height : 2000,
      }}
    >
      <div
        ref={nodeRef}
        className={cn(
          'absolute cursor-move select-none rounded-md border-2 flex items-center justify-center text-xs font-medium transition-all',
          'hover:shadow-md hover:z-10',
          isActive ? 'z-20' : 'z-10',
          isDragging && 'cursor-grabbing shadow-lg scale-105'
        )}
        style={{
          width: position.width,
          height: position.height,
          borderColor: color,
          backgroundColor: `${color}20`,
          color: color,
        }}
        onClick={(e) => {
          e.stopPropagation() // Prevent triggering page click when clicking signature box
          onSelect()
        }}
      >
        <div className="text-center p-1 overflow-hidden">
          <div className="truncate font-semibold">{signer.name || 'Signer'}</div>
          <div className="text-xs opacity-75 truncate">Page {pageNumber}</div>
        </div>
        
        {/* Resize handle */}
        <div
          className={cn(
            'absolute bottom-0 right-0 w-3 h-3 cursor-se-resize touch-none before:absolute before:-inset-2 opacity-60 hover:opacity-100',
            'border-r-2 border-b-2 border-current'
          )}
          data-no-drag="true"
          onPointerDown={handleResizeStart}
          style={{ borderColor: color }}
        />
      </div>
    </Draggable>
  )
}
