import {
  canAdvanceFromStep,
  getDraftSaveErrors,
  getSendValidationErrors,
} from '@/lib/envelope/envelope-wizard-validation'
import type { FieldPositions, RecipientInput } from '@/types/envelope'

const doc = {
  id: 'doc-1',
  file_name: 'test.pdf',
  file_url: '',
  file_size: 100,
  status: 'draft',
  created_at: '',
  updated_at: '',
}

const recipient: RecipientInput = {
  id: 1,
  name: 'A',
  email: 'a@test.com',
  order: 1,
  color: '#000',
}

describe('envelope-wizard-validation', () => {
  it('requires documents before advancing from step 1', () => {
    expect(canAdvanceFromStep(1, { uploadedDocuments: [], recipients: [], fieldPositions: {} })).toBe(
      'At least one document is required',
    )
    expect(canAdvanceFromStep(1, { uploadedDocuments: [doc], recipients: [], fieldPositions: {} })).toBeNull()
  })

  it('requires recipients before advancing from step 2', () => {
    expect(
      canAdvanceFromStep(2, { uploadedDocuments: [doc], recipients: [], fieldPositions: {} }),
    ).toBe('At least one recipient is required')
    expect(
      canAdvanceFromStep(2, {
        uploadedDocuments: [doc],
        recipients: [recipient],
        fieldPositions: {},
      }),
    ).toBeNull()
  })

  it('validates send requirements', () => {
    const errors = getSendValidationErrors({
      uploadedDocuments: [doc],
      recipients: [recipient],
      fieldPositions: {},
    })
    expect(errors).toHaveLength(0)
  })

  it('validates draft save at step 1', () => {
    expect(getDraftSaveErrors(1, { uploadedDocuments: [], recipients: [], fieldPositions: {} })).toContain(
      'At least one document is required to save a draft',
    )
    expect(
      getDraftSaveErrors(1, { uploadedDocuments: [doc], recipients: [], fieldPositions: {} }),
    ).toHaveLength(0)
  })
})

describe('field assignment validation', () => {
  it('flags unassigned signature fields on send', () => {
    const fieldPositions: FieldPositions = {
      'doc-1': {
        'field-1': {
          id: 'field-1',
          type: 'signature',
          page: 1,
          x: 0,
          y: 0,
          width: 100,
          height: 50,
          assignedTo: null,
          documentId: 'doc-1',
        },
      },
    }
    const errors = getSendValidationErrors({
      uploadedDocuments: [doc],
      recipients: [recipient],
      fieldPositions,
    })
    expect(errors.some((e) => e.includes('signature'))).toBe(true)
  })
})
