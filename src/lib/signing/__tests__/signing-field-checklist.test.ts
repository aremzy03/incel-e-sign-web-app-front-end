import { buildSigningFieldChecklist } from '@/lib/signing/signing-field-checklist'
import type { EnvelopeDocumentResponse } from '@/lib/api/envelopes'

describe('buildSigningFieldChecklist', () => {
  it('includes target metadata for signature and field items', () => {
    const envelopeDocuments: EnvelopeDocumentResponse[] = [
      {
        id: 'doc-1',
        document: 'doc-1',
        signer_document_positions: [
          { signer_id: 'user-1', position: { page: 2, x: 10, y: 20, width: 100, height: 40 } },
        ],
      } as EnvelopeDocumentResponse,
    ]

    const items = buildSigningFieldChecklist({
      envelopeDocuments,
      envelope: {
        id: 'env-1',
        status: 'pending',
        signing_order: [],
        fields: [
          {
            id: 'field-1',
            page: 1,
            x: 0,
            y: 0,
            width: 80,
            height: 24,
            type: 'text',
            assigned_signer: 'user-1',
          },
        ],
      },
      currentUserId: 'user-1',
      signedFor: {},
      fieldValues: {},
    })

    expect(items).toHaveLength(2)
    expect(items[0]?.target).toEqual({
      kind: 'signature',
      documentId: 'doc-1',
      page: 2,
      signerId: 'user-1',
    })
    expect(items[1]?.target).toEqual({
      kind: 'field',
      documentId: undefined,
      page: 1,
      fieldId: 'field-1',
    })
  })
})
