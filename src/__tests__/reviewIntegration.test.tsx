import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import DocumentReviewPage from '../app/dashboard/documents/[id]/page'
import EnvelopeReviewPage from '../app/dashboard/envelopes/review/[id]/page'
import SignFlowPage from '@/components/signing/sign-flow-page'
import { useParams } from 'next/navigation'

jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
  })),
  useSearchParams: jest.fn(() => ({
    get: jest.fn((key: string) => (key === 'step' ? 'sign' : null)),
  })),
}))

jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { id: '1', email: 'a@b.com', full_name: 'User' }, accessToken: 't' },
    status: 'authenticated',
  }),
}))

jest.mock('@/hooks/useAuthReady', () => ({
  useAuthReady: () => ({ isReady: true }),
  shouldRetryAuthQuery: false,
}))

jest.mock('@/hooks/useProfile', () => ({ useProfile: () => ({ data: null }) }))

jest.mock('@/hooks/useSigningView', () => ({
  useSigningView: () => ({
    view: { kind: 'step', step: 'sign' },
    goToSign: jest.fn(),
    goToStatus: jest.fn(),
  }),
}))

jest.mock('@/hooks/signing', () => ({
  useSigningCoordinates: () => ({
    pageDims: {},
    setPageContainerRef: () => () => {},
    measurePageCanvas: jest.fn(),
    setPageDimensions: jest.fn(),
    setDocumentNumPages: jest.fn(),
  }),
  useSigningEnvelope: () => ({
    envelope: { id: '1', name: 'Doc', status: 'pending', signing_order: [], fields: [] },
    loadingEnv: false,
    envelopeDocuments: [{ id: 'd1', document: 'd1', file_name: 'f.pdf', signer_document_positions: [] }],
    loadingDocs: false,
    docsError: null,
    pdfFileByDocumentId: {},
    pdfLoadedByDocId: {},
    setPdfLoadedByDocId: jest.fn(),
  }),
  useUserSignatures: () => ({ signatures: [], isLoading: false }),
  useSignActions: () => ({
    approveAndSign: jest.fn(),
    signMutation: { isPending: false },
    saveValuesMutation: { isPending: false },
    declineMutation: { isPending: false, mutate: jest.fn() },
    declineMessage: '',
    setDeclineMessage: jest.fn(),
  }),
  useSigningFieldValues: () => ({
    fieldValues: {},
    setFieldValue: jest.fn(),
    activeFieldPreview: null,
    toggleFieldPreview: jest.fn(),
  }),
  resolveSignatureId: () => undefined,
  resolveSignatureImage: () => undefined,
}))

jest.mock('@/components/pdf/usePdfPasswordDialog', () => ({
  usePdfPasswordDialog: () => ({ dialog: null, onPassword: jest.fn(), cancelled: false }),
}))

jest.mock('@/components/signing/signing-document-viewer', () => ({
  SigningDocumentViewer: () => <div>PDF</div>,
}))

describe('Review Integration Tests', () => {
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
    ;(useParams as jest.Mock).mockReturnValue({ id: '1', envelopeId: '1' })
  })

  it('renders document review page from API data', async () => {
    const axios = require('axios')
    const mockApi = (axios.create as jest.Mock).mock.results[0]?.value || (axios.create as jest.Mock)()
    mockApi.get.mockResolvedValueOnce({
      data: {
        id: '1',
        file_name: 'contract.pdf',
        file_size: 1024,
        file_type: 'application/pdf',
        status: 'draft',
        created_at: '2025-09-16T12:00:00Z',
        updated_at: '2025-09-16T12:00:00Z',
      },
    })

    render(<DocumentReviewPage />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('Document: contract.pdf')).toBeInTheDocument()
      expect(screen.getByText('Document Information')).toBeInTheDocument()
    })
  })

  it('renders envelope review page with actions', () => {
    render(<EnvelopeReviewPage />, { wrapper })
    expect(screen.getByText(/Review Envelope:/)).toBeInTheDocument()
    expect(screen.getByText('Send Envelope')).toBeInTheDocument()
  })

  it('renders dashboard sign flow page', async () => {
    render(<SignFlowPage isDashboard />, { wrapper })
    expect(await screen.findByText('Complete Signing')).toBeInTheDocument()
  })
})
