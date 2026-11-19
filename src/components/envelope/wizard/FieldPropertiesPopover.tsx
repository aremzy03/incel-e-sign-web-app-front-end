'use client'

import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MaterialIcon } from '@/components/ui/material-icon'
import { FIELD_TYPE_LABELS } from '@/components/envelope/field-editor-themes'
import { FieldTypeSettings } from '@/components/envelope/FieldTypeSettings'
import { useEnvelopeWizard } from './envelope-wizard-context'

const POPOVER_WIDTH = 288
const POPOVER_GAP = 12
const POPOVER_MAX_HEIGHT = 480

export function FieldPropertiesPopover() {
  const {
    activeField,
    activeFieldId,
    recipients,
    setActiveFieldId,
    handleFieldPositionChange,
  } = useEnvelopeWizard()

  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const updatePosition = useCallback(() => {
    if (!activeFieldId) {
      setPosition(null)
      return
    }

    const fieldEl = document.querySelector(`[data-field-id="${activeFieldId}"]`)
    if (!fieldEl) {
      setPosition(null)
      return
    }

    const rect = fieldEl.getBoundingClientRect()
    let left = rect.right + POPOVER_GAP
    let top = rect.top

    if (left + POPOVER_WIDTH > window.innerWidth - 16) {
      left = rect.left - POPOVER_WIDTH - POPOVER_GAP
    }
    if (left < 16) {
      left = Math.min(rect.left, window.innerWidth - POPOVER_WIDTH - 16)
    }

    const maxTop = window.innerHeight - POPOVER_MAX_HEIGHT - 16
    top = Math.max(16, Math.min(top, maxTop))

    setPosition({ top, left })
  }, [activeFieldId])

  useEffect(() => {
    updatePosition()
    const frame = requestAnimationFrame(updatePosition)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [updatePosition, activeField])

  useEffect(() => {
    if (!activeFieldId) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (target.closest('[data-field-properties-popover]')) return
      if (target.closest('[data-field-id]')) return
      if (target.closest('[data-radix-popper-content-wrapper]')) return
      setActiveFieldId(null)
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [activeFieldId, setActiveFieldId])

  if (!mounted || !activeField || !position) return null

  const assignedRecipient = recipients.find((r) => r.id.toString() === activeField.assignedTo)
  const isSignature = activeField.type === 'signature'

  const popover = (
    <div
      data-field-properties-popover
      className="fixed z-[70] flex w-72 max-h-[min(70vh,480px)] flex-col overflow-hidden rounded-xl border border-border bg-surface-container-lowest shadow-xl"
      style={{ top: position.top, left: position.left }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex shrink-0 items-start justify-between gap-2 border-b border-border p-4 pb-3">
        <div>
          <div className="text-sm font-semibold text-on-surface">Field Properties</div>
          <div className="mt-0.5 text-xs capitalize text-muted">
            {FIELD_TYPE_LABELS[activeField.type]}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => setActiveFieldId(null)}
          aria-label="Close field properties"
        >
          <MaterialIcon name="close" size={16} />
        </Button>
      </div>

      <div className="wizard-custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pt-3">
        <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs">Assigned to</Label>
          <Select
            value={activeField.assignedTo || ''}
            onValueChange={(v) =>
              handleFieldPositionChange(activeField.id, { assignedTo: v || null })
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select recipient" />
            </SelectTrigger>
            <SelectContent>
              {recipients.map((recipient) => (
                <SelectItem key={recipient.id} value={recipient.id.toString()}>
                  {recipient.name || recipient.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {assignedRecipient && (
          <p className="text-xs text-muted">
            Signer: <span className="font-medium text-on-surface">{assignedRecipient.name || assignedRecipient.email}</span>
          </p>
        )}

        {!isSignature && (
          <FieldTypeSettings
            field={activeField}
            onChange={(patch) => handleFieldPositionChange(activeField.id, patch)}
          />
        )}
        </div>
      </div>
    </div>
  )

  return createPortal(popover, document.body)
}
