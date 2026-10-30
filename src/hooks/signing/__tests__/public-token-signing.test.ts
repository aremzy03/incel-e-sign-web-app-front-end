import { buildSignEnvelopePayload } from '@/lib/api/signatures'

describe('Public Token Signing Helpers', () => {
  it('includes token and field_values in sign envelope payload', () => {
    const payload = buildSignEnvelopePayload({
      signature_image: 'data:image/png;base64,abc123',
      token: 'sample-secure-token-xyz',
      field_values: { field1: 'Signed Value' },
      page: 1,
      x: 50,
      y: 100,
      width: 150,
      height: 50,
    })

    expect(payload.token).toBe('sample-secure-token-xyz')
    expect(payload.field_values).toEqual({ field1: 'Signed Value' })
    expect(payload.signature_image).toBe('data:image/png;base64,abc123')
    expect(payload.page).toBe(1)
  })

  it('omits empty token strings', () => {
    const payload = buildSignEnvelopePayload({
      signature_image: 'data:image/png;base64,abc123',
      token: '   ',
    })

    expect(payload.token).toBeUndefined()
  })

  it('allows token bearer to proceed to sign when recipient.is_current_signer is true', () => {
    const { deriveSigningView } = require('@/hooks/useSigningView')
    const envelope = {
      id: '589e0234-0e27-4cf5-95cd-ee39cd53d014',
      name: 'Untitled Envelope',
      status: 'pending',
      current_signer: { id: 'signer-1-id', name: 'Signer 1' },
      recipient: { user_id: 'signer-1-id', is_current_signer: true },
      signatures: [{ signer: 'signer-1-id', status: 'pending' }],
    }

    // Even if currentUserId in browser is undefined or creator's ID
    const viewUnauth = deriveSigningView(envelope, undefined, false, null, null)
    expect(viewUnauth).toEqual({ kind: 'step', step: 'sign' })

    const viewCreator = deriveSigningView(envelope, 'creator-id-xyz', false, null, null)
    expect(viewCreator).toEqual({ kind: 'step', step: 'sign' })
  })
})

