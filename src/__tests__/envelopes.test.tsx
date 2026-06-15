import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import EnvelopesPage from '@/app/dashboard/envelopes/page'
import CreateEnvelopePage from '@/app/dashboard/envelopes/create/page'
import EnvelopeDetailPage from '@/app/dashboard/envelopes/[id]/page'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(() => ({ id: 'env-1' })),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(() => null),
    has: jest.fn(() => false),
  })),
}))

const useEnvelopes = jest.fn()
const useEnvelope = jest.fn()
const useCreateEnvelope = jest.fn()
const useSendEnvelope = jest.fn()
const useDocuments = jest.fn()
const useRejectEnvelope = jest.fn()
const useUploadDocument = jest.fn()
const useDeleteEnvelope = jest.fn()
const useSelfSignEnvelope = jest.fn()

jest.mock('@/hooks/useEnvelopes', () => ({
  useEnvelopes: (...args: any[]) => useEnvelopes(...args),
  useEnvelope: (...args: any[]) => useEnvelope(...args),
  useCreateEnvelope: (...args: any[]) => useCreateEnvelope(...args),
  useSendEnvelope: (...args: any[]) => useSendEnvelope(...args),
  useRejectEnvelope: (...args: any[]) => useRejectEnvelope(...args),
  useDeleteEnvelope: (...args: any[]) => useDeleteEnvelope(...args),
  useSelfSignEnvelope: (...args: any[]) => useSelfSignEnvelope(...args),
}))

jest.mock('@/hooks/useDocuments', () => ({
  useDocuments: (...args: any[]) => useDocuments(...args),
  useUploadDocument: (...args: any[]) => useUploadDocument(...args),
}))

jest.mock('@/hooks/useUsers', () => ({
  useEnvelopeUserValidation: () => ({
    validateRecipients: async () => ({ valid: [], invalid: [] }),
    isValidating: false,
  }),
  useUserSearch: () => ({ mutate: jest.fn(), isPending: false }),
  useUser: () => ({ data: null, isLoading: false }),
}))

jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { id: 'u1', email: 'a@test.com', name: 'A' } },
    status: 'authenticated',
  }),
}))

jest.mock('@/lib/api/envelopes', () => ({
  getEnvelopeDocuments: jest.fn().mockResolvedValue([]),
}))

describe('Envelopes Pages', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => {
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }

  beforeEach(() => {
    useEnvelopes.mockReturnValue({
      data: {
        count: 1,
        next: null,
        previous: null,
        results: [{
          id: 'env-1',
          name: 'Test Envelope',
          status: 'draft',
          recipients: [],
          documents: [],
          creator: { id: 'u1', email: 'a@test.com', full_name: 'A' },
        }],
      },
      isLoading: false,
      error: null,
      isFetching: false,
    })
    useEnvelope.mockReturnValue({
      data: {
        id: 'env-1',
        name: 'Test Envelope',
        status: 'draft',
        recipients: [],
        documents: [{ id: 'doc-1', file_name: 'doc.pdf' }],
        creator: { id: 'u1', email: 'a@test.com', full_name: 'A' },
        created_at: new Date().toISOString(),
      },
      isLoading: false,
      error: null,
    })
    useCreateEnvelope.mockReturnValue({ mutateAsync: jest.fn(), isPending: false })
    useSendEnvelope.mockReturnValue({ mutateAsync: jest.fn(), isPending: false })
    useRejectEnvelope.mockReturnValue({ mutateAsync: jest.fn(), isPending: false })
    useDeleteEnvelope.mockReturnValue({ mutateAsync: jest.fn(), isPending: false })
    useSelfSignEnvelope.mockReturnValue({ mutateAsync: jest.fn(), isPending: false })
    useDocuments.mockReturnValue({ data: { count: 0, next: null, previous: null, results: [] }, isLoading: false, error: null })
    useUploadDocument.mockReturnValue({ mutateAsync: jest.fn(), isPending: false })
  })

  it('renders envelopes list page', () => {
    render(<EnvelopesPage />, { wrapper })
    expect(screen.getByText('Envelopes')).toBeInTheDocument()
    expect(screen.getByText('Test Envelope')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sign yourself' })).toHaveAttribute(
      'href',
      '/dashboard/envelopes/self-sign'
    )
  })

  it('calls useEnvelopes with isSelfSign=true for Signed by me tab', () => {
    render(<EnvelopesPage />, { wrapper })
    fireEvent.click(screen.getByRole('button', { name: 'Signed by me' }))
    expect(useEnvelopes).toHaveBeenCalledWith(1, 10, undefined, undefined, true)
  })

  it('calls useEnvelopes with isSelfSign=false for Multi-party tab', () => {
    render(<EnvelopesPage />, { wrapper })
    fireEvent.click(screen.getByRole('button', { name: 'Multi-party' }))
    expect(useEnvelopes).toHaveBeenCalledWith(1, 10, undefined, undefined, false)
  })

  it('renders create envelope page header', () => {
    render(<CreateEnvelopePage />, { wrapper })
    expect(screen.getByText('Prepare envelope')).toBeInTheDocument()
  })

  it('renders envelope detail page header', () => {
    render(<EnvelopeDetailPage />, { wrapper })
    expect(screen.getByText(/Envelope:/)).toBeInTheDocument()
  })

  it('hides Send and Edit actions for self-signed envelopes', () => {
    useEnvelope.mockReturnValue({
      data: {
        id: 'env-self',
        name: 'Self Signed Doc',
        status: 'completed',
        is_self_sign: true,
        recipients: [{ id: 'u1', order: 1, status: 'completed' }],
        documents: [{ id: 'doc-1', file_name: 'doc.pdf' }],
        creator: { id: 'u1', email: 'a@test.com', full_name: 'A' },
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      },
      isLoading: false,
      error: null,
    })

    render(<EnvelopeDetailPage />, { wrapper })

    expect(screen.getByText('Self-signed')).toBeInTheDocument()
    expect(screen.queryByLabelText('Send envelope')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Edit envelope')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Sign document')).not.toBeInTheDocument()
  })
})
