import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSigningSubmit } from '@/hooks/signing/useSigningSubmit'
import type { useSignActions } from '@/hooks/signing/useSignActions'

jest.mock('@/hooks/signing/useSigningJobPoller', () => ({
  useSigningJobPoller: jest.fn(({ onSucceeded }: { onSucceeded?: () => void }) => ({
    phase: 'polling',
    isPolling: true,
    errorMessage: null,
    keepWaiting: jest.fn(),
    retry: jest.fn(),
    _triggerSuccess: onSucceeded,
  })),
}))

const { useSigningJobPoller } = jest.requireMock('@/hooks/signing/useSigningJobPoller')

function createSignActions(
  approveResult: Awaited<ReturnType<ReturnType<typeof useSignActions>['approveAndSign']>>,
): ReturnType<typeof useSignActions> {
  return {
    approveAndSign: jest.fn().mockResolvedValue(approveResult),
    signMutation: { isPending: false },
    saveValuesMutation: { isPending: false },
    declineMutation: { isPending: false, mutate: jest.fn() },
    declineMessage: '',
    setDeclineMessage: jest.fn(),
    validateRequiredFields: () => [],
    frozenEnvelopeMessage: null,
    clearFrozenEnvelopeMessage: jest.fn(),
  } as unknown as ReturnType<typeof useSignActions>
}

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('useSigningSubmit', () => {
  it('enters polling phase for queued sign jobs', async () => {
    const onSignComplete = jest.fn()
    const signActions = createSignActions({
      kind: 'queued',
      jobId: 'job-1',
      envelopeId: 'env-1',
    })

    const { result } = renderHook(
      () =>
        useSigningSubmit({
          envelopeId: 'env-1',
          signActions,
          onSignComplete,
        }),
      { wrapper },
    )

    await act(async () => {
      await result.current.submitSign()
    })

    expect(result.current.phase).toBe('polling')
    expect(result.current.showOverlay).toBe(true)
    expect(onSignComplete).not.toHaveBeenCalled()
  })

  it('completes immediately for already_signed responses', async () => {
    const onSignComplete = jest.fn()
    const signActions = createSignActions({ kind: 'already_signed' })

    const { result } = renderHook(
      () =>
        useSigningSubmit({
          envelopeId: 'env-1',
          signActions,
          onSignComplete,
        }),
      { wrapper },
    )

    await act(async () => {
      await result.current.submitSign()
    })

    expect(result.current.phase).toBe('succeeded')
    expect(onSignComplete).toHaveBeenCalled()
  })

  it('calls onSignComplete when poller succeeds', async () => {
    const onSignComplete = jest.fn()
    let capturedOnSucceeded: (() => void) | undefined

    useSigningJobPoller.mockImplementation(({ onSucceeded }: { onSucceeded?: () => void }) => {
      capturedOnSucceeded = onSucceeded
      return {
        phase: 'polling',
        isPolling: true,
        errorMessage: null,
        keepWaiting: jest.fn(),
        retry: jest.fn(),
      }
    })

    const signActions = createSignActions({
      kind: 'queued',
      jobId: 'job-1',
      envelopeId: 'env-1',
    })

    renderHook(
      () =>
        useSigningSubmit({
          envelopeId: 'env-1',
          signActions,
          onSignComplete,
        }),
      { wrapper },
    )

    await act(async () => {
      await signActions.approveAndSign()
    })

    await act(async () => {
      capturedOnSucceeded?.()
    })

    await waitFor(() => {
      expect(onSignComplete).toHaveBeenCalled()
    })
  })
})
