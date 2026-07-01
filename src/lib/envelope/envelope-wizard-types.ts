import type { Document } from '@/lib/api/documents'
import type { FieldPositions, RecipientInput } from '@/types/envelope'

export type WizardStep = 1 | 2 | 3 | 4 | 5

export type WizardMode = 'create' | 'edit'

export const WIZARD_STEP_LABELS = [
  'Documents',
  'Recipients',
  'Place Fields',
  'Settings',
  'Review & Send',
] as const

export const WIZARD_STEP_STORAGE_KEY = 'envelope-wizard-step'

export interface EnvelopeWizardState {
  uploadedDocuments: Document[]
  recipients: RecipientInput[]
  fieldPositions: FieldPositions
  activeFieldId: string | null
  nextFieldId: number
  nextRecipientId: number
  envelopeName: string
  description: string
  pdfPasswordProtectionEnabled: boolean
  draftEnvelopeId: string | null
  currentStep: WizardStep
  mode: WizardMode
}

export interface ValidateRecipientsFn {
  (emails: string[]): Promise<{
    valid: Array<{ email: string; user: { id: string } }>
    invalid: string[]
  }>
}
