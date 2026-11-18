import type { AddTextOp, Document } from '@/lib/api/documents'
import type { FieldPositions, RecipientInput } from '@/types/envelope'

const KEY = 'envelope-wizard-text-edit-resume'

export interface WizardTextEditResume {
  mode: 'create' | 'edit'
  envelopeId: string | null
  returnPath: string
  uploadedDocuments: Document[]
  recipients: RecipientInput[]
  fieldPositions: FieldPositions
  nextFieldId: number
  nextRecipientId: number
  envelopeName: string
  description: string
  pdfPasswordProtectionEnabled: boolean
  currentStep: 1 | 2
  allowRecipientText?: boolean
}

export function saveWizardTextEditResume(snapshot: WizardTextEditResume) {
  sessionStorage.setItem(KEY, JSON.stringify(snapshot))
}

export function readWizardTextEditResume(): WizardTextEditResume | null {
  const raw = sessionStorage.getItem(KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as WizardTextEditResume
  } catch {
    return null
  }
}

export function clearWizardTextEditResume() {
  sessionStorage.removeItem(KEY)
}

export function patchWizardResumeDocument(
  documentId: string,
  patch: Partial<Pick<Document, 'file_url' | 'file_size' | 'updated_at'>>,
) {
  const resume = readWizardTextEditResume()
  if (!resume) return
  resume.uploadedDocuments = resume.uploadedDocuments.map((doc) =>
    doc.id === documentId ? { ...doc, ...patch } : doc,
  )
  saveWizardTextEditResume(resume)
}
