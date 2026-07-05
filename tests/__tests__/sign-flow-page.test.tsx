import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import SignFlowPage from '@/components/signing/sign-flow-page'

const mockRefetchEnvelope = jest.fn()
const mockRefetchDocuments = jest.fn()
const mockUseSigningEnvelope = jest.fn()

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'env-1' }),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}))

jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      accessToken: 'token',
      user: { id: 'user-1', email: 'test@example.com', full_name: 'Test User' },
    },
    status: 'authenticated',
  }),
}))

jest.mock('@/hooks/useAuthReady', () => ({
  useAuthReady: () => ({ isReady: true }),
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

jest.mock('@/hooks/signing', () => ({
  useSigningCoordinates: () => ({}),
  useSigningEnvelope: (...args: unknown[]) => mockUseSigningEnvelope(...args),
  useSignActions: () => ({
    saveFields: jest.fn(),
    saveCurrentField: jest.fn(),
    decline: jest.fn(),
  }),
  useSigningFieldValues: () => ({
    fieldValues: {},
    setFieldValue: jest.fn(),
    clearFieldValue: jest.fn(),
  }),
  useSigningProgress: () => ({
    canComplete: false,
    remainingCount: 0,
    fieldChecklist: [],
    markAllSignaturesComplete: jest.fn(),
    markSignatureConfirmed: jest.fn(),
    isSignatureComplete: jest.fn(() => false),
  }),
  useSigningSubmit: () => ({
    submitSign: jest.fn(),
    state: 'idle',
    overlayState: 'hidden',
    errorMessage: null,
    retry: jest.fn(),
    dismiss: jest.fn(),
  }),
  useUserSignatures: () => ({
    signatures: [],
    refetch: jest.fn(),
    isLoading: false,
  }),
  resolveSignatureId: () => undefined,
  resolveSignatureImage: () => undefined,
}))

jest.mock('@/components/pdf/usePdfPasswordDialog', () => ({
  usePdfPasswordDialog: () => ({}),
}))

jest.mock('@/components/pdf/PdfLoadingIndicator', () => ({
  PdfLoadingIndicator: ({ label }: { label: string }) => <div>{label}</div>,
}))

jest.mock('@/components/signing/signing-shell', () => ({
  SigningShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

jest.mock('@/lib/api/signatures', () => ({
  uploadUserSignature: jest.fn(),
}))

function renderPage() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={client}>
      <SignFlowPage isDashboard />
    </QueryClientProvider>,
  )
}

describe('SignFlowPage error states', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows a not-found state when the envelope cannot be loaded', () => {
    mockUseSigningEnvelope.mockReturnValue({
      envelope: undefined,
      loadingEnv: false,
      envelopeErrorState: { isNotFound: true, message: 'Envelope not found' },
      refetchEnvelope: mockRefetchEnvelope,
      envelopeDocuments: [],
      loadingDocs: false,
      docsError: null,
      documentsErrorState: null,
      refetchDocuments: mockRefetchDocuments,
      waitingForDocumentsAuth: false,
      pdfFileByDocumentId: {},
      pdfLoadedByDocId: {},
      setPdfLoadedByDocId: jest.fn(),
      markPreviewFallback: jest.fn(),
    })

    renderPage()

    expect(screen.getByText('Envelope not found')).toBeInTheDocument()
    expect(
      screen.getByText(/This signing request may have expired, been removed, or you may not have access to it/i),
    ).toBeInTheDocument()
  })

  it('shows a retryable error when signing documents fail to load', async () => {
    const user = userEvent.setup()
    mockUseSigningEnvelope.mockReturnValue({
      envelope: {
        id: 'env-1',
        name: 'Test Envelope',
        status: 'pending',
        signing_order: [],
        signatures: [],
      },
      loadingEnv: false,
      envelopeErrorState: null,
      refetchEnvelope: mockRefetchEnvelope,
      envelopeDocuments: [],
      loadingDocs: false,
      docsError: 'Failed to load documents for signing',
      documentsErrorState: { message: 'Failed to load documents for signing' },
      refetchDocuments: mockRefetchDocuments,
      waitingForDocumentsAuth: false,
      pdfFileByDocumentId: {},
      pdfLoadedByDocId: {},
      setPdfLoadedByDocId: jest.fn(),
      markPreviewFallback: jest.fn(),
    })

    renderPage()

    expect(screen.getByText('Unable to load signing documents')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /retry/i }))
    expect(mockRefetchDocuments).toHaveBeenCalled()
  })

  it('shows an explicit empty state when an envelope has no documents', () => {
    mockUseSigningEnvelope.mockReturnValue({
      envelope: {
        id: 'env-1',
        name: 'Test Envelope',
        status: 'pending',
        signing_order: [],
        signatures: [],
      },
      loadingEnv: false,
      envelopeErrorState: null,
      refetchEnvelope: mockRefetchEnvelope,
      envelopeDocuments: [],
      loadingDocs: false,
      docsError: null,
      documentsErrorState: null,
      refetchDocuments: mockRefetchDocuments,
      waitingForDocumentsAuth: false,
      pdfFileByDocumentId: {},
      pdfLoadedByDocId: {},
      setPdfLoadedByDocId: jest.fn(),
      markPreviewFallback: jest.fn(),
    })

    renderPage()

    expect(screen.getByText('No documents available to sign')).toBeInTheDocument()
    expect(
      screen.getByText(/This envelope does not currently contain any signable documents/i),
    ).toBeInTheDocument()
  })
})
