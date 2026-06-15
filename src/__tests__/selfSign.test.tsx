import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import SelfSignPage from '@/app/dashboard/envelopes/self-sign/page'

const mockPush = jest.fn()
const selfSignAsync = jest.fn()
const listUserSignatures = jest.fn()

jest.mock('@/lib/axios', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { id: 'user-1', name: 'Test User', email: 'test@example.com' } },
    status: 'authenticated',
  }),
}))

jest.mock('@/hooks/useEnvelopes', () => ({
  useSelfSignEnvelope: () => ({
    mutateAsync: selfSignAsync,
    isPending: false,
  }),
}))

jest.mock('@/lib/api/signatures', () => {
  const actual = jest.requireActual('@/lib/api/signatures')
  return {
    ...actual,
    listUserSignatures: (...args: unknown[]) => listUserSignatures(...args),
  }
})

jest.mock('next/dynamic', () => () => {
  const Dynamic = () => <div data-testid="pdf-viewer" />
  Dynamic.displayName = 'DynamicPDFViewer'
  return Dynamic
})

describe('SelfSignPage', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>
      {children}
    </QueryClientProvider>
  )

  beforeEach(() => {
    jest.clearAllMocks()
    selfSignAsync.mockResolvedValue({ id: 'env-self-1', status: 'completed' })
    listUserSignatures.mockResolvedValue([
      { id: 'sig-1', name: 'Default', image_url: '/sig.png', is_default: true, uploaded_at: new Date().toISOString() },
    ])
  })

  it('renders header, Sign & complete button, and no recipient UI', async () => {
    render(<SelfSignPage />, { wrapper })
    expect(screen.getByText('Sign a document')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /sign & complete/i }).length).toBeGreaterThan(0)
    expect(screen.queryByText(/add recipient/i)).not.toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText(/Default \(default\)/i)).toBeInTheDocument()
    })
  })

  it('shows validation when no document is uploaded', async () => {
    render(<SelfSignPage />, { wrapper })
    expect(await screen.findByText(/At least one document is required/i)).toBeInTheDocument()
    expect(selfSignAsync).not.toHaveBeenCalled()
  })

  it('shows validation when signature field is missing', async () => {
    render(<SelfSignPage />, { wrapper })
    expect(await screen.findByText(/At least one signature field is required/i)).toBeInTheDocument()
  })
})

describe('selfSignEnvelope API', () => {
  it('posts payload without signing_order', async () => {
    const apiClient = (await import('@/lib/axios')).default
    ;(apiClient.post as jest.Mock).mockResolvedValue({ data: { data: { id: 'env-1', status: 'completed' } } })
    const { selfSignEnvelope } = await import('@/lib/api/signatures')
    const payload = {
      document_ids: ['doc-1'],
      signature_id: 'sig-1',
      pdf_password_protection_enabled: false,
      documents_with_positions: [{
        document_id: 'doc-1',
        signer_document_positions: [{ position: { page: 1, x: 10, y: 20, width: 100, height: 40 } }],
      }],
    }
    const result = await selfSignEnvelope(payload)
    expect(apiClient.post).toHaveBeenCalledWith('/signatures/self-sign/', payload)
    expect(result).toEqual({ id: 'env-1', status: 'completed' })
    expect(JSON.stringify(payload)).not.toContain('signing_order')
  })

  it('returns backend message from 400 responses via thrown error shape', async () => {
    const apiClient = (await import('@/lib/axios')).default
    const error = { response: { status: 400, data: { message: 'Signature placement is required' } } }
    ;(apiClient.post as jest.Mock).mockRejectedValue(error)
    const { selfSignEnvelope } = await import('@/lib/api/signatures')
    await expect(selfSignEnvelope({ document_ids: ['doc-1'], signature_id: 'sig-1' })).rejects.toEqual(error)
  })
})