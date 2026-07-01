import {
  FrozenEnvelopeError,
  SigningFailedError,
  SigningTimeoutError,
} from '@/lib/api/signing-errors'

jest.mock('@/lib/axios', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
  },
}))

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
  it('returns queued job on 202', async () => {
    const apiClient = (await import('@/lib/axios')).default
    ;(apiClient.post as jest.Mock).mockResolvedValue({
      status: 202,
      data: {
        data: { job_id: 'job-1', status: 'queued', envelope_id: 'env-1' },
      },
    })
    const { signEnvelope } = await import('@/lib/api/signatures')
    const result = await signEnvelope('env-1', { signature_id: 'sig-1' })
    expect(result).toEqual({
      kind: 'queued',
      data: { job_id: 'job-1', status: 'queued', envelope_id: 'env-1' },
    })
  })

  it('throws FrozenEnvelopeError on 409', async () => {
    const apiClient = (await import('@/lib/axios')).default
    ;(apiClient.post as jest.Mock).mockResolvedValue({
      status: 409,
      data: { message: 'Envelope frozen for system upgrade. Ask the creator to resend.' },
    })
    const { signEnvelope } = await import('@/lib/api/signatures')
    await expect(signEnvelope('env-1', { signature_id: 'sig-1' })).rejects.toMatchObject({
      name: 'FrozenEnvelopeError',
      message: 'Envelope frozen for system upgrade. Ask the creator to resend.',
    })
  })

  it('returns already_signed on legacy 200', async () => {
    const apiClient = (await import('@/lib/axios')).default
    ;(apiClient.post as jest.Mock).mockResolvedValue({
      status: 200,
      data: {
        data: { id: 'sig-row-1', status: 'signed', signer: 'user-1' },
      },
    })
    const { signEnvelope } = await import('@/lib/api/signatures')
    const result = await signEnvelope('env-1', { signature_id: 'sig-1' })
    expect(result.kind).toBe('already_signed')
  })
})
