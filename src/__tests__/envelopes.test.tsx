import { render, screen } from '@testing-library/react'
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

jest.mock('@/hooks/useEnvelopes', () => ({
  useEnvelopes: (...args: any[]) => useEnvelopes(...args),
  useEnvelope: (...args: any[]) => useEnvelope(...args),
  useCreateEnvelope: (...args: any[]) => useCreateEnvelope(...args),
  useSendEnvelope: (...args: any[]) => useSendEnvelope(...args),
  useRejectEnvelope: (...args: any[]) => useRejectEnvelope(...args),
  useDeleteEnvelope: (...args: any[]) => useDeleteEnvelope(...args),
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
      data: { results: [{ id: 'env-1', name: 'Test Envelope', status: 'draft', recipients: [], documents: [] }] },
      isLoading: false,
      error: null,
    })
    useEnvelope.mockReturnValue({
      data: {
        id: 'env-1',
        subject: 'Test Envelope',
        status: 'draft',
        recipients: [],
        documents: [{ id: 'doc-1', file_name: 'doc.pdf' }],
      },
      isLoading: false,
      error: null,
    })
    useCreateEnvelope.mockReturnValue({ mutateAsync: jest.fn(), isPending: false })
    useSendEnvelope.mockReturnValue({ mutateAsync: jest.fn(), isPending: false })
    useRejectEnvelope.mockReturnValue({ mutateAsync: jest.fn(), isPending: false })
    useDeleteEnvelope.mockReturnValue({ mutateAsync: jest.fn(), isPending: false })
    useDocuments.mockReturnValue({ data: [], isLoading: false, error: null })
    useUploadDocument.mockReturnValue({ mutateAsync: jest.fn(), isPending: false })
  })

  it('renders envelopes list page', () => {
    render(<EnvelopesPage />, { wrapper })
    expect(screen.getByText('Envelopes')).toBeInTheDocument()
    expect(screen.getByText('Test Envelope')).toBeInTheDocument()
  })

  it('renders create envelope page header', () => {
    render(<CreateEnvelopePage />, { wrapper })
    expect(screen.getByText('Prepare envelope')).toBeInTheDocument()
  })

  it('renders envelope detail page header', () => {
    render(<EnvelopeDetailPage />, { wrapper })
    expect(screen.getByText(/Envelope:/)).toBeInTheDocument()
  })
})
