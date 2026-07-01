import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSigningJobPoller } from '@/hooks/signing/useSigningJobPoller'
import { getSigningJob, retrySigningJob } from '@/lib/api/signatures'

jest.mock('@/lib/api/signatures', () => ({
  getSigningJob: jest.fn(),
  retrySigningJob: jest.fn(),
}))

jest.mock('@/lib/signing/signing-job-storage', () => ({
  saveSigningJob: jest.fn(),
  clearSigningJob: jest.fn(),
}))

const getSigningJobMock = getSigningJob as jest.Mock
const retrySigningJobMock = retrySigningJob as jest.Mock

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('useSigningJobPoller', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    getSigningJobMock.mockReset()
    retrySigningJobMock.mockReset()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('polls until job succeeds', async () => {
    const onSucceeded = jest.fn()
    getSigningJobMock
      .mockResolvedValueOnce({
        id: 'job-1',
        status: 'processing',
        envelope_id: 'env-1',
        signer_id: 'user-1',
        error_message: '',
        attempt_count: 1,
        created_at: '2026-01-01T00:00:00Z',
        completed_at: null,
        envelope_status: 'pending',
        signature: null,
      })
      .mockResolvedValueOnce({
        id: 'job-1',
        status: 'succeeded',
        envelope_id: 'env-1',
        signer_id: 'user-1',
        error_message: '',
        attempt_count: 1,
        created_at: '2026-01-01T00:00:00Z',
        completed_at: '2026-01-01T00:00:05Z',
        envelope_status: 'pending',
        signature: { status: 'signed' },
      })

    const { result } = renderHook(
      () =>
        useSigningJobPoller({
          jobId: 'job-1',
          envelopeId: 'env-1',
          pollIntervalMs: 1000,
          onSucceeded,
        }),
      { wrapper },
    )

    await waitFor(() => {
      expect(getSigningJobMock).toHaveBeenCalled()
    })

    await act(async () => {
      jest.advanceTimersByTime(1000)
    })

    await waitFor(() => {
      expect(result.current.phase).toBe('succeeded')
      expect(onSucceeded).toHaveBeenCalled()
    })
  })

  it('surfaces failed jobs', async () => {
    const onFailed = jest.fn()
    getSigningJobMock.mockResolvedValue({
      id: 'job-1',
      status: 'failed',
      envelope_id: 'env-1',
      signer_id: 'user-1',
      error_message: 'PDF embed failed',
      attempt_count: 1,
      created_at: '2026-01-01T00:00:00Z',
      completed_at: '2026-01-01T00:00:05Z',
      envelope_status: 'pending',
      signature: null,
    })

    const { result } = renderHook(
      () =>
        useSigningJobPoller({
          jobId: 'job-1',
          envelopeId: 'env-1',
          onFailed,
        }),
      { wrapper },
    )

    await waitFor(() => {
      expect(result.current.phase).toBe('failed')
      expect(result.current.errorMessage).toBe('PDF embed failed')
      expect(onFailed).toHaveBeenCalled()
    })
  })

  it('retries failed jobs', async () => {
    retrySigningJobMock.mockResolvedValue({
      job_id: 'job-1',
      status: 'queued',
      envelope_id: 'env-1',
    })
    getSigningJobMock.mockResolvedValue({
      id: 'job-1',
      status: 'queued',
      envelope_id: 'env-1',
      signer_id: 'user-1',
      error_message: '',
      attempt_count: 2,
      created_at: '2026-01-01T00:00:00Z',
      completed_at: null,
      envelope_status: 'pending',
      signature: null,
    })

    const { result } = renderHook(
      () =>
        useSigningJobPoller({
          jobId: 'job-1',
          envelopeId: 'env-1',
        }),
      { wrapper },
    )

    await act(async () => {
      await result.current.retry()
    })

    expect(retrySigningJobMock).toHaveBeenCalledWith('job-1')
    expect(result.current.phase).toBe('polling')
  })
})
