import type { Document } from '@/lib/api/documents'
import type { CreateEnvelopeRequest } from '@/lib/api/envelopes'
import type { FieldPosition, FieldPositions, RecipientInput } from '@/types/envelope'
import { viewportPositionToBackend } from '@/lib/utils/field-geometry'
import type { ValidateRecipientsFn } from './envelope-wizard-types'

export interface BuildPayloadInput {
  uploadedDocuments: Document[]
  recipients: RecipientInput[]
  fieldPositions: FieldPositions
  envelopeName: string
  description: string
  pdfPasswordProtectionEnabled: boolean
}

export type BuildPayloadMode = 'draft' | 'send'

export interface BuildPayloadOptions {
  mode: BuildPayloadMode
  validateRecipients: ValidateRecipientsFn
}

export type BuildPayloadResult =
  | { ok: true; payload: CreateEnvelopeRequest & { fields?: BackendField[] } }
  | { ok: false; error: string }

type BackendField = {
  document_id: string
  page: number
  x: number
  y: number
  width: number
  height: number
  type: 'initials' | 'date' | 'text' | 'designation'
  assigned_signer: string
  required: boolean
  prefill_value?: string | null
  font_family?: string
  font_size?: number
  date_format?: string
  placeholder?: string
  max_length?: number
}

export async function buildEnvelopePayload(
  input: BuildPayloadInput,
  options: BuildPayloadOptions,
): Promise<BuildPayloadResult> {
  const {
    uploadedDocuments,
    recipients,
    fieldPositions,
    envelopeName,
    description,
    pdfPasswordProtectionEnabled,
  } = input
  const { mode, validateRecipients } = options

  if (uploadedDocuments.length === 0) {
    return { ok: false, error: 'At least one document is required' }
  }

  let valid: Array<{ email: string; user: { id: string } }> = []

  if (recipients.length > 0) {
    const emails = recipients.map((r) => r.email)
    const result = await validateRecipients(emails)

    if (result.invalid.length > 0) {
      return {
        ok: false,
        error: `These emails are not registered: ${result.invalid.join(', ')}`,
      }
    }
    valid = result.valid
  } else if (mode === 'send') {
    return { ok: false, error: 'At least one recipient is required' }
  }

  const signing_order =
    recipients.length > 0
      ? recipients.map((r) => {
          const found = valid.find((v) => v.email.toLowerCase() === r.email.toLowerCase())
          return {
            signer_id: found!.user.id,
            order: r.order,
          }
        })
      : []

  const convertFieldGeometry = (_docId: string, field: FieldPosition) =>
    viewportPositionToBackend({
      page: field.page,
      x: field.x,
      y: field.y,
      width: field.width,
      height: field.height,
    })

  const documents_with_positions = Object.entries(fieldPositions).map(([docId, docFields]) => {
    const signer_document_positions = Object.values(docFields)
      .filter((field) => field.type === 'signature' && field.assignedTo)
      .map((field) => {
        const recipient = recipients.find((r) => r.id.toString() === field.assignedTo)
        const validRecipient = valid.find(
          (v) => v.email.toLowerCase() === recipient?.email.toLowerCase(),
        )

        return {
          signer_id: validRecipient!.user.id,
          position: convertFieldGeometry(docId, field),
        }
      })

    return {
      document_id: docId,
      signer_document_positions,
    }
  })

  const recipientEmailToUserId: Record<string, string> = {}
  valid.forEach((v) => {
    recipientEmailToUserId[v.email.toLowerCase()] = v.user.id
  })

  const localRecipientIdToUserId: Record<string, string> = {}
  recipients.forEach((r) => {
    const userId = recipientEmailToUserId[r.email.toLowerCase()]
    if (userId) localRecipientIdToUserId[r.id.toString()] = userId
  })

  const fields: BackendField[] = []
  Object.entries(fieldPositions).forEach(([docId, docFields]) => {
    Object.values(docFields).forEach((field) => {
      if (field.type === 'signature') return
      const assignedUserId = field.assignedTo
        ? localRecipientIdToUserId[field.assignedTo]
        : undefined
      if (!assignedUserId) return

      const geom = convertFieldGeometry(docId, field)
      const base = {
        document_id: docId,
        page: Math.max(1, field.page),
        x: Math.max(0, geom.x),
        y: Math.max(0, geom.y),
        width: Math.max(20, geom.width),
        height: Math.max(20, geom.height),
        assigned_signer: assignedUserId,
        required: !!field.required,
        font_family: field.font_family,
      }

      if (field.type === 'initials') {
        fields.push({
          ...base,
          type: 'initials',
          prefill_value: field.prefill_value ?? null,
          font_size: field.font_size,
        })
      } else if (field.type === 'date') {
        fields.push({
          ...base,
          type: 'date',
          prefill_value: field.prefill_value ?? null,
          date_format: field.date_format,
          font_size: field.font_size,
        })
      } else if (field.type === 'text') {
        fields.push({
          ...base,
          type: 'text',
          prefill_value: field.prefill_value ?? null,
          placeholder: field.placeholder,
          max_length: field.max_length,
          font_size: field.font_size,
        })
      } else if (field.type === 'designation') {
        fields.push({
          ...base,
          type: 'designation',
          prefill_value: field.prefill_value ?? null,
          max_length: field.max_length,
          font_size: field.font_size,
        })
      }
    })
  })

  const trimmedDescription = description.trim()

  const payload = {
    document_ids: uploadedDocuments.map((d) => d.id),
    ...(signing_order.length > 0 ? { signing_order } : {}),
    documents_with_positions,
    ...(fields.length > 0 ? { fields } : {}),
    ...(envelopeName ? { name: envelopeName } : {}),
    ...(trimmedDescription ? { description: trimmedDescription } : {}),
    pdf_password_protection_enabled: pdfPasswordProtectionEnabled,
  } as CreateEnvelopeRequest & { fields?: BackendField[] }

  return { ok: true, payload }
}
