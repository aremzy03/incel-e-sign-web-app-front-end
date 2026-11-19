/**
 * Self-sign sends field and signature positions in PDF points exactly as the editor placed
 * them. A size-based "points or pixels?" guess used to divide boxes 133pt wide or 42pt tall
 * (default initials, date, signature) by 1.2, so the stamps landed above and left of where
 * they were placed.
 */
import apiClient from '@/lib/axios'
import { selfSignEnvelope } from '@/lib/api/signatures'
import { buildSelfSignPayload, type FieldMap } from '@/hooks/useSelfSignFields'

jest.mock('@/lib/axios', () => ({
  __esModule: true,
  default: { post: jest.fn(), get: jest.fn(), defaults: {} },
}))

const field = (type: string, x: number, y: number, width: number, height: number) => ({
  id: `field-${type}`,
  type,
  page: 1,
  x,
  y,
  width,
  height,
  assignedTo: 'self',
  documentId: 'doc-1',
  required: true,
  date_format: 'DD/MM/YYYY',
})

describe('self-sign coordinates', () => {
  it('posts default-size fields at the points they were placed', async () => {
    ;(apiClient.post as jest.Mock).mockResolvedValue({
      status: 202,
      data: { status: 'success', data: { job_id: 'j', status: 'queued', envelope_id: 'e' } },
    })
    const fields = {
      a: field('initials', 239.33, 420.6, 133.33, 30),
      b: field('date', 239.33, 466.6, 133.33, 30),
      c: field('signature', 247.67, 500.7, 140, 44),
    }
    type PayloadInput = Parameters<typeof buildSelfSignPayload>[1]
    const payload = buildSelfSignPayload(fields as unknown as FieldMap, {
      documentId: 'doc-1',
      signatureId: 'sig-1',
      initialsChoice: { style: 'first_last', font: 'great_vibes' } as unknown as PayloadInput['initialsChoice'],
    })

    await selfSignEnvelope(payload).catch(() => undefined)

    const sent = (apiClient.post as jest.Mock).mock.calls[0][1]
    const byType = Object.fromEntries(sent.fields.map((f: { type: string }) => [f.type, f]))
    expect(byType.initials).toMatchObject({ x: 239.33, y: 420.6, width: 133.33, height: 30 })
    expect(byType.date).toMatchObject({ x: 239.33, y: 466.6, width: 133.33, height: 30 })
    const signature = sent.documents_with_positions[0].signer_document_positions[0].position
    expect(signature).toMatchObject({ x: 247.67, y: 500.7, width: 140, height: 44 })
  })
})
