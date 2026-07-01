import type { EnvelopeDocumentResponse } from '@/lib/api/envelopes'
import type { SigningEnvelopeField, SigningEnvelopeResponse } from '@/hooks/signing/types'

export interface SigningFieldChecklistItem {
  id: string
  label: string
  completed: boolean
}

const FIELD_TYPE_LABELS: Record<string, string> = {
  date: 'Signing Date',
  initials: 'Initials',
  designation: 'Designation',
  text: 'Text Field',
}

export function buildSigningFieldChecklist({
  envelopeDocuments,
  envelope,
  currentUserId,
  signedFor,
  fieldValues,
}: {
  envelopeDocuments: EnvelopeDocumentResponse[]
  envelope?: SigningEnvelopeResponse | null
  currentUserId?: string
  signedFor: Record<string, boolean>
  fieldValues: Record<string, string>
}): SigningFieldChecklistItem[] {
  const items: SigningFieldChecklistItem[] = []

  for (const doc of envelopeDocuments) {
    const positions = doc.signer_document_positions?.filter((p) => p.signer_id === currentUserId) ?? []
    positions.forEach((pos, idx) => {
      const key = `${doc.id}-${pos.signer_id}`
      items.push({
        id: `sig-${key}-${idx}`,
        label: positions.length > 1 ? `Signature ${idx + 1}` : 'Signature Required',
        completed: Boolean(signedFor[key]),
      })
    })
  }

  const myFields =
    envelope?.fields?.filter((f) => !f.assigned_signer || f.assigned_signer === currentUserId) ?? []

  myFields.forEach((field, idx) => {
    items.push({
      id: field.id ?? `field-${idx}`,
      label: getFieldLabel(field),
      completed: isFieldCompleted(field, fieldValues),
    })
  })

  return items
}

function getFieldLabel(field: SigningEnvelopeField): string {
  if (field.placeholder?.trim()) return field.placeholder.trim()
  return FIELD_TYPE_LABELS[field.type] ?? 'Field'
}

function isFieldCompleted(field: SigningEnvelopeField, fieldValues: Record<string, string>): boolean {
  if (field.type === 'text') {
    const id = field.id ?? ''
    return Boolean(fieldValues[id]?.trim())
  }
  return true
}

export function getActiveFieldId(items: SigningFieldChecklistItem[]): string | undefined {
  return items.find((item) => !item.completed)?.id
}
