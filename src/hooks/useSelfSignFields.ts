'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { SelfSignRequest } from '@/lib/api/signatures'
import {
  TEXT_FIELD_RETIRED_MESSAGE,
  defaultFieldSettings,
  isDateFormat,
  stampRequestOptions,
  type InitialsChoice,
} from '@/lib/fields/stamps'
import {
  fieldPositionToBackendPdfPoints,
  WIZARD_SIGNATURE_HEIGHT,
  WIZARD_SIGNATURE_WIDTH,
} from '@/lib/utils/field-geometry'
import type { CreatableFieldType, FieldPosition } from '@/types/envelope'

/** The signer of a self-sign envelope is always "you"; fields are assigned to this id. */
export const SELF_RECIPIENT_ID = 1

/**
 * Fields keyed by id, for one document. Geometry is in PDF points (top-left
 * origin), so zoom and window size never move them; the editor converts to
 * screen px for display.
 */
export type FieldMap = Record<string, FieldPosition>

/** The wizard's field sizes (px at 1.2 px/pt), in points. */
const WIZARD_RENDER_SCALE = 1.2
export function fieldSizePt(type: string) {
  return type === 'signature'
    ? { width: WIZARD_SIGNATURE_WIDTH / WIZARD_RENDER_SCALE, height: WIZARD_SIGNATURE_HEIGHT / WIZARD_RENDER_SCALE }
    : { width: 160 / WIZARD_RENDER_SCALE, height: 36 / WIZARD_RENDER_SCALE }
}

// Initial state before sessionStorage is read; never written back.
const NOT_LOADED: FieldMap = Object.freeze({}) as FieldMap

const storageKey = (documentId: string) => `incel-esign:self-sign-fields:v2:${documentId}`

function readStoredFields(documentId: string): FieldMap {
  try {
    const raw = window.sessionStorage.getItem(storageKey(documentId))
    const parsed = raw ? (JSON.parse(raw) as FieldMap) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function getSelfSignValidationErrors(fields: FieldMap): string[] {
  const all = Object.values(fields)
  const errors: string[] = []
  if (!all.some((f) => f.type === 'signature')) errors.push('Add at least one signature field')
  if (all.some((f) => f.type === 'text')) errors.push(TEXT_FIELD_RETIRED_MESSAGE)
  const incomplete = all.some((field) => {
    if (field.type === 'signature' || field.type === 'initials' || field.type === 'text') return false
    if (!field.font_family || typeof field.font_size !== 'number') return true
    if (field.type === 'date') return !isDateFormat(field.date_format)
    // designation
    return (!!field.required && !(field.prefill_value ?? '').trim()) || field.max_length === undefined
  })
  if (incomplete) errors.push('Fill in the designation, or finish the field settings')
  return errors
}

interface BuildPayloadInput {
  documentId: string
  signatureId?: string | null
  initialsChoice: InitialsChoice
}

export function buildSelfSignPayload(fields: FieldMap, input: BuildPayloadInput): SelfSignRequest {
  const { documentId, signatureId, initialsChoice } = input
  // Already in points: a render scale of 1 only applies the shared page clamping.
  const toPoints = (field: FieldPosition) => fieldPositionToBackendPdfPoints(field, 1)

  const all = Object.values(fields)
  const signaturePositions = all
    .filter((f) => f.type === 'signature')
    .map((field) => {
      const geom = toPoints(field)
      return { position: { page: field.page, x: geom.x, y: geom.y, width: geom.width, height: geom.height } }
    })

  const otherFields: Array<Record<string, unknown>> = []
  for (const field of all) {
    if (field.type === 'signature' || field.type === 'text') continue
    const geom = toPoints(field)
    const base = {
      document_id: documentId,
      page: Math.max(1, field.page),
      x: Math.max(0, geom.x),
      y: Math.max(0, geom.y),
      width: Math.max(20, geom.width),
      height: Math.max(20, geom.height),
      required: !!field.required,
      font_family: field.font_family,
      font_size: field.font_size,
    }
    // Date and initials are filled by the server when you sign.
    if (field.type === 'initials') {
      otherFields.push({ ...base, type: 'initials', required: true })
    } else if (field.type === 'date') {
      otherFields.push({ ...base, type: 'date', required: true, date_format: field.date_format })
    } else {
      const value = field.prefill_value ?? null
      otherFields.push({ ...base, type: 'designation', value, prefill_value: value, max_length: field.max_length })
    }
  }

  return {
    document_ids: [documentId],
    documents_with_positions: [{ document_id: documentId, signer_document_positions: signaturePositions }],
    pdf_password_protection_enabled: false,
    ...(otherFields.length > 0 ? { fields: otherFields } : {}),
    ...(signatureId ? { signature_id: signatureId } : {}),
    ...stampRequestOptions(initialsChoice),
  }
}

/**
 * Signature / initials / date / designation fields placed on one document for
 * self-signing. Kept in sessionStorage so a refresh doesn't lose them.
 */
export function useSelfSignFields(documentId: string) {
  const [fields, setFieldsState] = useState<FieldMap>(NOT_LOADED)
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null)

  useEffect(() => {
    setFieldsState(readStoredFields(documentId))
  }, [documentId])

  useEffect(() => {
    if (fields === NOT_LOADED) return
    try {
      if (Object.keys(fields).length === 0) window.sessionStorage.removeItem(storageKey(documentId))
      else window.sessionStorage.setItem(storageKey(documentId), JSON.stringify(fields))
    } catch {
      // Storage blocked: fields still work for this visit.
    }
  }, [documentId, fields])

  const setFields = useCallback((next: FieldMap | ((current: FieldMap) => FieldMap)) => {
    setFieldsState(next)
  }, [])

  /** Add a field centred on (centerX, centerY), all in PDF points. */
  const addField = useCallback(
    (type: CreatableFieldType, page: number, centerX: number, centerY: number, pageWidthPt: number, pageHeightPt: number) => {
      const id = `field-${crypto.randomUUID()}`
      const { width, height } = fieldSizePt(type)
      const x = Math.max(0, Math.min(centerX - width / 2, pageWidthPt - width))
      const y = Math.max(0, Math.min(centerY - height / 2, pageHeightPt - height))
      const field: FieldPosition = {
        id,
        type,
        page,
        x,
        y,
        width,
        height,
        assignedTo: String(SELF_RECIPIENT_ID),
        documentId,
        ...defaultFieldSettings(type),
      }
      setFieldsState((current) => ({ ...current, [id]: field }))
      setActiveFieldId(id)
      return field
    },
    [documentId],
  )

  const updateField = useCallback((fieldId: string, patch: Partial<FieldPosition>) => {
    setFieldsState((current) =>
      current[fieldId] ? { ...current, [fieldId]: { ...current[fieldId], ...patch } } : current,
    )
  }, [])

  const deleteField = useCallback((fieldId: string) => {
    setFieldsState((current) => {
      if (!current[fieldId]) return current
      const next = { ...current }
      delete next[fieldId]
      return next
    })
    setActiveFieldId((current) => (current === fieldId ? null : current))
  }, [])

  const clearFields = useCallback(() => {
    setFieldsState({})
    setActiveFieldId(null)
  }, [])

  const activeField = activeFieldId ? fields[activeFieldId] ?? null : null
  const validationErrors = useMemo(() => getSelfSignValidationErrors(fields), [fields])
  const hasFields = Object.keys(fields).length > 0
  const hasInitialsFields = Object.values(fields).some((f) => f.type === 'initials')

  return {
    fields,
    setFields,
    addField,
    updateField,
    deleteField,
    clearFields,
    activeFieldId,
    setActiveFieldId,
    activeField,
    validationErrors,
    hasFields,
    hasInitialsFields,
  }
}
