import type { Document } from '@/lib/api/documents'
import type { FieldPositions, RecipientInput } from '@/types/envelope'
import type { WizardStep } from './envelope-wizard-types'

export interface ValidationInput {
  uploadedDocuments: Document[]
  recipients: RecipientInput[]
  fieldPositions: FieldPositions
}

/** Full validation required before sending an envelope. */
export function getSendValidationErrors({
  uploadedDocuments,
  recipients,
  fieldPositions,
}: ValidationInput): string[] {
  const errors: string[] = []

  if (uploadedDocuments.length === 0) {
    errors.push('At least one document is required')
  }

  if (recipients.length === 0) {
    errors.push('At least one recipient is required')
  }

  const unassignedSignatureFields = Object.values(fieldPositions).flatMap((docFields) =>
    Object.values(docFields).filter((field) => field.type === 'signature' && !field.assignedTo),
  )

  if (unassignedSignatureFields.length > 0) {
    errors.push(
      `${unassignedSignatureFields.length} signature field(s) are not assigned to recipients`,
    )
  }

  const incomplete: string[] = []
  Object.values(fieldPositions).forEach((docFields) => {
    Object.values(docFields).forEach((field) => {
      if (field.type === 'signature') return
      if (!field.assignedTo) {
        incomplete.push(field.id)
        return
      }
      const hasRequired = typeof field.required === 'boolean'
      const hasFont = !!field.font_family && typeof field.font_size === 'number'
      if (!hasRequired || !hasFont) {
        incomplete.push(field.id)
        return
      }
      if (field.type === 'date' && !field.date_format) incomplete.push(field.id)
      if (field.type === 'text') {
        if (field.placeholder === undefined || field.max_length === undefined) {
          incomplete.push(field.id)
        }
      }
      if (field.type === 'designation' && field.max_length === undefined) {
        incomplete.push(field.id)
      }
    })
  })

  if (incomplete.length > 0) {
    errors.push('Some non-signature fields are missing settings')
  }

  return errors
}

/** Gate advancing from one wizard step to the next. */
export function canAdvanceFromStep(step: WizardStep, input: ValidationInput): string | null {
  switch (step) {
    case 1:
      return input.uploadedDocuments.length >= 1
        ? null
        : 'At least one document is required'
    case 2:
      return input.recipients.length >= 1 ? null : 'At least one recipient is required'
    case 3:
    case 4:
      return null
    case 5:
      return null
    default:
      return null
  }
}

/** Minimum requirements to save a draft at a given step. */
export function getDraftSaveErrors(
  step: WizardStep,
  { uploadedDocuments, recipients }: ValidationInput,
): string[] {
  const errors: string[] = []

  if (uploadedDocuments.length === 0) {
    errors.push('At least one document is required to save a draft')
    return errors
  }

  // Steps 2+ with recipients require valid recipient emails (checked at payload build)
  if (step >= 2 && recipients.length === 0) {
    errors.push('Add at least one recipient before saving')
  }

  return errors
}
