import {
  FrozenEnvelopeError,
  SigningApiError,
  SigningFailedError,
  SigningRequestTimeoutError,
  SigningTimeoutError,
} from '@/lib/api/signing-errors'

const mockFetch = jest.fn()
global.fetch = mockFetch as unknown as typeof fetch

describe('signing-errors', () => {
  it('creates FrozenEnvelopeError with default message', () => {
    const error = new FrozenEnvelopeError()
    expect(error).toBeInstanceOf(FrozenEnvelopeError)
    expect(error.status).toBe(409)
    expect(error.message).toContain('frozen')
  })

  it('creates SigningFailedError with job id', () => {
    const error = new SigningFailedError('embed failed', 'job-1')
    expect(error.jobId).toBe('job-1')
    expect(error.message).toBe('embed failed')
  })

  it('creates SigningTimeoutError with job id', () => {
    const error = new SigningTimeoutError('job-2')
    expect(error.jobId).toBe('job-2')
  })
})

describe('signEnvelope API', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('returns queued job on 202', async () => {
    mockFetch.mockResolvedValue({
      status: 202,
      json: async () => ({
        status: 'success',
        data: { job_id: 'job-1', status: 'queued', envelope_id: 'env-1' },
      }),
    })
    const { signEnvelope } = await import('@/lib/api/signatures')
    const result = await signEnvelope('env-1', { signature_id: 'sig-1' })
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/signatures/env-1/sign',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ signature_id: 'sig-1' }),
      }),
    )
    expect(result).toEqual({
      kind: 'queued',
      data: { job_id: 'job-1', status: 'queued', envelope_id: 'env-1' },
    })
  })

  it('throws FrozenEnvelopeError on 409', async () => {
    mockFetch.mockResolvedValue({
      status: 409,
      json: async () => ({
        status: 'error',
        message: 'Envelope frozen for system upgrade. Ask the creator to resend.',
      }),
    })
    const { signEnvelope } = await import('@/lib/api/signatures')
    await expect(signEnvelope('env-1', { signature_id: 'sig-1' })).rejects.toMatchObject({
      name: 'FrozenEnvelopeError',
      message: 'Envelope frozen for system upgrade. Ask the creator to resend.',
    })
  })

  it('throws SigningApiError on 403', async () => {
    mockFetch.mockResolvedValue({
      status: 403,
      json: async () => ({
        status: 'error',
        message: "It's not your turn to sign yet...",
      }),
    })
    const { signEnvelope } = await import('@/lib/api/signatures')
    await expect(signEnvelope('env-1', { signature_id: 'sig-1' })).rejects.toBeInstanceOf(
      SigningApiError,
    )
  })

  it('throws SigningRequestTimeoutError on abort', async () => {
    const abortError = new DOMException('Aborted', 'AbortError')
    mockFetch.mockRejectedValue(abortError)
    const { signEnvelope } = await import('@/lib/api/signatures')
    await expect(signEnvelope('env-1', { signature_id: 'sig-1' })).rejects.toBeInstanceOf(
      SigningRequestTimeoutError,
    )
  })

  it('returns already_signed on legacy 200', async () => {
    mockFetch.mockResolvedValue({
      status: 200,
      json: async () => ({
        status: 'success',
        data: { id: 'sig-row-1', status: 'signed', signer: 'user-1' },
      }),
    })
    const { signEnvelope } = await import('@/lib/api/signatures')
    const result = await signEnvelope('env-1', { signature_id: 'sig-1' })
    expect(result.kind).toBe('already_signed')
  })
})

describe('buildSignEnvelopePayload', () => {
  it('rejects both signature sources', async () => {
    const { buildSignEnvelopePayload } = await import('@/lib/api/signatures')
    expect(() =>
      buildSignEnvelopePayload({
        signature_id: 'sig-1',
        signature_image: 'data:image/png;base64,abc',
      }),
    ).toThrow(SigningApiError)
  })
})
