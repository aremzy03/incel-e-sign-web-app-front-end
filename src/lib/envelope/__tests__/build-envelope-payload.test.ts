import { buildEnvelopePayload } from '@/lib/envelope/build-envelope-payload'
import type { RecipientInput } from '@/types/envelope'

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

const validateRecipients = async (emails: string[]) => ({
  valid: emails.map((email) => ({ email, user: { id: 'user-1' } })),
  invalid: [] as string[],
})

describe('buildEnvelopePayload', () => {
  it('builds draft payload with documents only', async () => {
    const result = await buildEnvelopePayload(
      {
        uploadedDocuments: [doc],
        recipients: [],
        fieldPositions: {},
        envelopeName: '',
        description: '',
        pdfPasswordProtectionEnabled: false,
      },
      { mode: 'draft', validateRecipients },
    )

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.payload.document_ids).toEqual(['doc-1'])
      expect(result.payload.signing_order).toBeUndefined()
    }
  })

  it('builds send payload with signing order', async () => {
    const result = await buildEnvelopePayload(
      {
        uploadedDocuments: [doc],
        recipients: [recipient],
        fieldPositions: {},
        envelopeName: 'Test',
        description: 'Notes',
        pdfPasswordProtectionEnabled: true,
      },
      { mode: 'send', validateRecipients },
    )

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.payload.signing_order).toEqual([{ signer_id: 'user-1', order: 1 }])
      expect(result.payload.name).toBe('Test')
      expect(result.payload.pdf_password_protection_enabled).toBe(true)
    }
  })

  it('converts signature viewport coords to PDF points for documents_with_positions', async () => {
    const result = await buildEnvelopePayload(
      {
        uploadedDocuments: [doc],
        recipients: [recipient],
        fieldPositions: {
          'doc-1': {
            f1: {
              id: 'f1',
              type: 'signature',
              page: 1,
              x: 46.4,
              y: 701.19,
              width: 140,
              height: 44,
              assignedTo: '1',
              documentId: 'doc-1',
            },
          },
        },
        envelopeName: 'Test',
        description: '',
        pdfPasswordProtectionEnabled: false,
      },
      { mode: 'send', validateRecipients },
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return

    const position = result.payload.documents_with_positions?.[0]?.signer_document_positions?.[0]
      ?.position
    expect(position).toBeDefined()
    expect(position!.width).toBeCloseTo(140 / 1.2, 1)
    expect(position!.height).toBeCloseTo(44 / 1.2, 1)
    expect(position!.y).toBeCloseTo(701.19 / 1.2, 1)
    expect(position!.x).toBeCloseTo(46.4 / 1.2, 1)
  })

  it('rejects send without recipients', async () => {
    const result = await buildEnvelopePayload(
      {
        uploadedDocuments: [doc],
        recipients: [],
        fieldPositions: {},
        envelopeName: '',
        description: '',
        pdfPasswordProtectionEnabled: false,
      },
      { mode: 'send', validateRecipients },
    )

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('recipient')
    }
  })
})
