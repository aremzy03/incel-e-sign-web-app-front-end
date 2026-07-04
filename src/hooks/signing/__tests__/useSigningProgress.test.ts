import { renderHook, act } from '@testing-library/react'
import { useSigningProgress } from '@/hooks/signing/useSigningProgress'
import type { EnvelopeDocumentResponse } from '@/lib/api/envelopes'

const envelopeDocuments: EnvelopeDocumentResponse[] = [
  {
    id: 'doc-1',
    document: 'doc-1',
    file_name: 'contract.pdf',
    signer_document_positions: [{ signer_id: 'user-1', position: { page: 1, x: 10, y: 20, width: 100, height: 40 } }],
  } as EnvelopeDocumentResponse,
]

describe('useSigningProgress', () => {
  it('starts with incomplete signature fields', () => {
    const { result } = renderHook(() =>
      useSigningProgress({
        envelopeDocuments,
        envelope: { id: 'env-1', status: 'pending', signing_order: [], fields: [] },
        currentUserId: 'user-1',
        fieldValues: {},
        mySignatureId: 'sig-1',
      }),
    )

    expect(result.current.totalFields).toBe(1)
    expect(result.current.completedFields).toBe(0)
    expect(result.current.canComplete).toBe(false)
  })

  it('enables completion when signature field is confirmed', () => {
    const { result } = renderHook(() =>
      useSigningProgress({
        envelopeDocuments,
        envelope: { id: 'env-1', status: 'pending', signing_order: [], fields: [] },
        currentUserId: 'user-1',
        fieldValues: {},
        mySignatureId: 'sig-1',
      }),
    )

    act(() => {
      result.current.markSignatureConfirmed('doc-1', 'user-1')
    })

    expect(result.current.completedFields).toBe(1)
    expect(result.current.canComplete).toBe(true)
    expect(result.current.fieldChecklist[0]?.completed).toBe(true)
  })

  it('counts text fields toward completion', () => {
    const { result } = renderHook(() =>
      useSigningProgress({
        envelopeDocuments: [],
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
              width: 100,
              height: 30,
              type: 'text',
              assigned_signer: 'user-1',
              required: true,
            },
          ],
        },
        currentUserId: 'user-1',
        fieldValues: { 'field-1': 'Hello' },
        mySignatureId: 'sig-1',
      }),
    )

    expect(result.current.totalFields).toBe(1)
    expect(result.current.completedFields).toBe(1)
    expect(result.current.canComplete).toBe(true)
  })
})
