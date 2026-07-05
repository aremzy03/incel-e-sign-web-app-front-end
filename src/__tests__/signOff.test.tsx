import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import SignFlowPage from '@/components/signing/sign-flow-page'

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'env-1' }),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useSearchParams: jest.fn(() => ({
    get: jest.fn((key: string) => (key === 'step' ? 'sign' : null)),
  })),
}))

jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: { id: 'user-1', email: 'signer@example.com', full_name: 'Test Signer' },
      accessToken: 'token',
    },
    status: 'authenticated',
  }),
}))

jest.mock('@/hooks/useAuthReady', () => ({
  useAuthReady: () => ({ isReady: true }),
  shouldRetryAuthQuery: false,
}))

jest.mock('@/hooks/useProfile', () => ({
  useProfile: () => ({ data: null }),
}))

jest.mock('@/hooks/useSigningView', () => ({
  useSigningView: jest.fn(() => ({
    view: { kind: 'step', step: 'sign' },
    goToSign: jest.fn(),
    goToReview: jest.fn(),
    goToStatus: jest.fn(),
    navigateToView: jest.fn(),
    buildUrl: jest.fn(),
  })),
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
    envelope: {
      id: 'env-1',
      name: 'Test Contract',
      status: 'pending',
      signing_order: [{ signer_id: 'user-1', order: 1 }],
      fields: [],
    },
    loadingEnv: false,
    envelopeDocuments: [
      {
        id: 'doc-1',
        document: 'doc-1',
        file_name: 'contract.pdf',
        document_file_url: '/doc.pdf',
        signer_document_positions: [],
      },
    ],
    loadingDocs: false,
    docsError: null,
    pdfFileByDocumentId: { 'doc-1': { url: '/doc.pdf' } },
    pdfLoadedByDocId: {},
    setPdfLoadedByDocId: jest.fn(),
  }),
  useUserSignatures: () => ({
    signatures: [{ id: 'sig-1', image_url: '/sig.png', is_default: true }],
    isLoading: false,
    refetch: jest.fn(),
  }),
  useSignActions: () => ({
    approveAndSign: jest.fn(),
    signMutation: { isPending: false },
    saveValuesMutation: { isPending: false },
    declineMutation: { isPending: false, mutate: jest.fn() },
    declineMessage: '',
    setDeclineMessage: jest.fn(),
    validateRequiredFields: () => [],
    frozenEnvelopeMessage: null,
    clearFrozenEnvelopeMessage: jest.fn(),
  }),
  useSigningFieldValues: () => ({
    fieldValues: {},
    setFieldValues: jest.fn(),
    setFieldValue: jest.fn(),
    activeFieldPreview: null,
    setActiveFieldPreview: jest.fn(),
    toggleFieldPreview: jest.fn(),
  }),
  useSigningProgress: () => ({
    signedFor: {},
    totalFields: 1,
    completedFields: 0,
    remainingCount: 1,
    canComplete: false,
    fieldChecklist: [],
    activeFieldId: undefined,
    markSignaturePreviewed: jest.fn(),
    markSignatureConfirmed: jest.fn(),
    markAllSignaturesComplete: jest.fn(),
    isSignatureComplete: () => false,
  }),
  useSigningSubmit: () => ({
    phase: 'idle',
    overlayPhase: 'polling',
    showOverlay: false,
    isSigningInFlight: false,
    submitSign: jest.fn(),
    retry: jest.fn(),
    keepWaiting: jest.fn(),
    dismissFailure: jest.fn(),
    errorMessage: null,
  }),
  resolveSignatureId: () => 'sig-1',
  resolveSignatureImage: () => '/sig.png',
}))

jest.mock('@/components/signing/signing-job-background-watcher', () => ({
  SigningJobBackgroundWatcher: () => null,
}))

jest.mock('@/components/pdf/usePdfPasswordDialog', () => ({
  usePdfPasswordDialog: () => ({
    dialog: null,
    onPassword: jest.fn(),
    cancelled: false,
  }),
}))

jest.mock('@/components/signing/signing-document-viewer', () => ({
  SigningDocumentViewer: () => <div data-testid="signing-document-viewer">PDF Viewer</div>,
}))

describe('Sign flow page (dashboard)', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
  )

  it('renders signing shell with sign document action', async () => {
    render(<SignFlowPage isDashboard />, { wrapper })
    expect(await screen.findByText('Incel E-Sign')).toBeInTheDocument()
    expect(await screen.findByText('Sign document')).toBeInTheDocument()
    expect(screen.getByTestId('signing-document-viewer')).toBeInTheDocument()
  })

  it('renders review panel when view step is review', async () => {
    const { useSigningView } = require('@/hooks/useSigningView')
    useSigningView.mockReturnValue({
      view: { kind: 'step', step: 'review' },
      goToSign: jest.fn(),
      goToReview: jest.fn(),
      goToStatus: jest.fn(),
      navigateToView: jest.fn(),
      buildUrl: jest.fn(),
    })

    render(<SignFlowPage isDashboard />, { wrapper })
    expect(await screen.findByText('Continue to sign')).toBeInTheDocument()
    expect(screen.getByText(/requested your signature/i)).toBeInTheDocument()
  })
})
