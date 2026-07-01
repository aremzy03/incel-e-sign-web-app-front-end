import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import EnvelopeSignPage from '@/app/dashboard/envelopes/[id]/sign/page'

jest.mock('next-auth/react', () => ({
  ...jest.requireActual('next-auth/react'),
  useSession: jest.fn(),
}))

const mockSession = {
  user: { id: 'user-1', email: 'test@example.com', full_name: 'Test User' },
  accessToken: 'mock-access-token',
}

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: '123' }),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useSearchParams: jest.fn(() => ({
    get: jest.fn((key: string) => (key === 'step' ? 'sign' : null)),
  })),
}))

jest.mock('@/hooks/useAuthReady', () => ({
  useAuthReady: () => ({ isReady: true }),
  shouldRetryAuthQuery: false,
}))

jest.mock('@/hooks/useProfile', () => ({
  useProfile: () => ({ data: null }),
}))

jest.mock('@/hooks/useSigningView', () => ({
  useSigningView: () => ({
    view: { kind: 'step', step: 'sign' },
    goToSign: jest.fn(),
    goToStatus: jest.fn(),
  }),
}))

jest.mock('@/hooks/signing/useSigningEnvelope', () => ({
  useSigningEnvelope: () => ({
    envelope: {
      id: '123',
      status: 'pending',
      name: 'Test Envelope',
      signing_order: [{ signer_id: 'user-1', order: 1 }],
      fields: [],
    },
    loadingEnv: false,
    envelopeDocuments: [
      {
        id: 'doc-1',
        document: 'doc-1',
        file_name: 'test.pdf',
        signer_document_positions: [],
      },
    ],
    loadingDocs: false,
    docsError: null,
    pdfFileByDocumentId: { 'doc-1': { url: '/doc.pdf' } },
    pdfLoadedByDocId: {},
    setPdfLoadedByDocId: jest.fn(),
  }),
}))

jest.mock('@/hooks/signing/useUserSignatures', () => ({
  useUserSignatures: () => ({
    signatures: [{ id: '1', image_url: '/sig.png', is_default: true }],
    isLoading: false,
  }),
  resolveSignatureId: () => '1',
  resolveSignatureImage: () => '/sig.png',
}))

jest.mock('@/components/signing/sign-flow-page', () => ({
  __esModule: true,
  default: ({ isDashboard }: { isDashboard: boolean }) => (
    <div data-testid="sign-flow">{isDashboard ? 'dashboard-sign' : 'public-sign'}</div>
  ),
}))

describe('Sign Page route', () => {
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
    require('next-auth/react').useSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    })
  })

  it('renders dashboard sign flow', () => {
    render(<EnvelopeSignPage />, { wrapper })
    expect(screen.getByTestId('sign-flow')).toHaveTextContent('dashboard-sign')
  })
})
