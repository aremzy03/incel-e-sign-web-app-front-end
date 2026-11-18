import { TEXT_FIELD_RETIRED_MESSAGE, isDateFormat } from '@/lib/fields/stamps'
import type { Document } from '@/lib/api/documents'
import type { FieldPositions, RecipientInput } from '@/types/envelope'
import type { WizardStep } from './envelope-wizard-types'

export interface ValidationInput {
  uploadedDocuments: Document[]
  recipients: RecipientInput[]
  fieldPositions: FieldPositions
  allowRecipientText?: boolean
}

/** Full validation required before sending an envelope. */
export function getSendValidationErrors({
  uploadedDocuments,
  recipients,
  fieldPositions,
  allowRecipientText,
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

  if (allowRecipientText) {
    const assignedSignature = Object.values(fieldPositions).some((docFields) =>
      Object.values(docFields).some((field) => field.type === 'signature' && field.assignedTo),
    )
    if (!assignedSignature) {
      errors.push('Add text for recipients requires a signature field assigned to a recipient')
    }
  }

  const incomplete: string[] = []
  let retiredTextFields = 0
  Object.values(fieldPositions).forEach((docFields) => {
    Object.values(docFields).forEach((field) => {
      if (field.type === 'signature') return
      if (field.type === 'text') {
        retiredTextFields += 1
        return
      }
      if (!field.assignedTo) {
        incomplete.push(field.id)
        return
      }
      // Initials are filled by the server from the signer's choice; nothing to configure.
      if (field.type === 'initials') return
      if (!field.font_family || typeof field.font_size !== 'number') {
        incomplete.push(field.id)
        return
      }
      if (field.type === 'date' && !isDateFormat(field.date_format)) incomplete.push(field.id)
      if (field.type === 'designation') {
        if (typeof field.required !== 'boolean' || field.max_length === undefined) incomplete.push(field.id)
      }
    })
  })

  if (retiredTextFields > 0) {
    errors.push(TEXT_FIELD_RETIRED_MESSAGE)
  }

  if (incomplete.length > 0) {
    errors.push('Some non-signature fields are missing settings')
  }

  return errors
}

/** Gate advancing from one wizard step to the next. */
export function canAdvanceFromStep(step: WizardStep, input: ValidationInput): string | null {
  switch (step) {
    case 1:
      if (input.uploadedDocuments.length < 1) {
        return 'At least one document is required'
      }
      if (input.recipients.length < 1) {
        return 'At least one recipient is required'
      }
      return null
    case 2:
      return null
    default:
      return null
  }
}

/** Minimum requirements to save a draft at a given step. */
export function getDraftSaveErrors(
  _step: WizardStep,
  { uploadedDocuments }: ValidationInput,
): string[] {
  const errors: string[] = []

  if (uploadedDocuments.length === 0) {
    errors.push('At least one document is required to save a draft')
  }

  return errors
}
