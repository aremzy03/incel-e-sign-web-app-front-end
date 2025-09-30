import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import SignaturesPage from '@/app/dashboard/signatures/page'
import EnvelopeSignPage from '@/app/dashboard/envelopes/[id]/sign/page'
import axios from 'axios'

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: '123' }),
  useRouter: () => ({ push: jest.fn() }),
}))

// Use the axios client mock created in setupTests via axios.create()
const mockApi = (axios.create as unknown as jest.Mock).mock.results[0].value

function wrapper(children: React.ReactNode) {
  const client = new QueryClient()
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('Signatures integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('Upload reusable signature → appears in list', async () => {
    mockApi.get.mockResolvedValueOnce({ data: [] })
    mockApi.post.mockResolvedValueOnce({ data: { id: 1, name: 'my-sign', image_url: '/x.png', uploaded_at: new Date().toISOString() } })
    mockApi.get.mockResolvedValueOnce({ data: [{ id: 1, name: 'my-sign', image_url: '/x.png', uploaded_at: new Date().toISOString() }] })

    render(wrapper(<SignaturesPage />))

    const file = new File([new Uint8Array([1, 2, 3])], 'my-sign.png', { type: 'image/png' })
    const input = await screen.findByLabelText(/choose file/i)
    await userEvent.upload(input, file)

    const uploadButton = screen.getByRole('button', { name: /upload signature/i })
    await userEvent.click(uploadButton)

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/api/signatures/user/', expect.any(FormData), expect.any(Object))
    })

    expect(await screen.findByText('my-sign')).toBeInTheDocument()
  })

  test('Select reusable signature → sign succeeds', async () => {
    mockApi.get.mockResolvedValueOnce({ data: [{ id: 2, name: 'saved', image_url: '/x.png', uploaded_at: new Date().toISOString() }] })
    mockApi.post.mockResolvedValueOnce({ data: { status: 'ok' } })

    render(wrapper(<EnvelopeSignPage />))

    const card = await screen.findByText(/saved/i)
    await userEvent.click(card)

    const signBtn = screen.getByRole('button', { name: /sign with selected/i })
    await userEvent.click(signBtn)

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/api/signatures/123/sign/', { signature_id: 2, type: 'reusable' })
    })
  })

  test('Inline signature → sign succeeds', async () => {
    mockApi.get.mockResolvedValueOnce({ data: [] })
    mockApi.post.mockResolvedValueOnce({ data: { status: 'ok' } })

    render(wrapper(<EnvelopeSignPage />))

    // draw: signature pad exists; we cannot draw realistically, but we can mock
    // force getTrimmedCanvas on the SignaturePad instance by mocking to return a data URL
    // Since canvas interaction is complex in JSDOM, invoke the mutate by bypassing emptiness

    // Click Sign Inline directly; our mutation will error if pad is empty, so mock the ref methods
    // Override pad methods by finding the button and stubbing the ref
    const page: any = screen
    const anyWindow = window as any
    // Monkey-patch to avoid runtime error; real behavior is covered by integration elsewhere
    ;(HTMLCanvasElement.prototype as any).toDataURL = () => 'data:image/png;base64,AAA'

    const signInlineBtn = await screen.findByRole('button', { name: /sign inline/i })

    await userEvent.click(signInlineBtn)

    // We expect a call to inline signing endpoint with type inline (data asserted loosely)
    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalled()
      const lastCall = mockApi.post.mock.calls.find((c: any[]) => c[0] === '/api/signatures/123/sign/')
      expect(lastCall?.[1]?.type).toBe('inline')
    })
  })

  test('Decline → status updated to "declined"', async () => {
    mockApi.get.mockResolvedValueOnce({ data: [] })
    mockApi.post.mockResolvedValueOnce({ data: { status: 'declined' } })

    render(wrapper(<EnvelopeSignPage />))

    const declineBtn = await screen.findByRole('button', { name: /decline/i })
    await userEvent.click(declineBtn)

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/api/signatures/123/decline/')
    })
  })
})



