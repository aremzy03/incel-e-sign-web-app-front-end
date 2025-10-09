import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
// Use real pages
import EnvelopesPage from '@/app/dashboard/envelopes/page'
import CreateEnvelopePage from '@/app/dashboard/envelopes/create/page'
import EnvelopeDetailPage from '@/app/dashboard/envelopes/[id]/page'
// Mock the hooks used inside pages
const useAuth = jest.fn()
const useDocuments = jest.fn()
const useEnvelopes = jest.fn()
const useCreateEnvelope = jest.fn()
const useSendEnvelope = jest.fn()
const useRejectEnvelope = jest.fn()
const useDeleteEnvelope = jest.fn()

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}))

// Prepare hook mocks that pages will consume
const mockUseEnvelope = jest.fn()

// Mock hooks
jest.mock('@/hooks/useAuth')
jest.mock('@/hooks/useDocuments', () => ({
  useDocuments: (...args: any[]) => (mockUseDocuments as any)(...args),
}))
jest.mock('@/hooks/useEnvelopes', () => ({
  useEnvelopes: (...args: any[]) => (mockUseEnvelopes as any)(...args),
  useEnvelope: (...args: any[]) => (mockUseEnvelope as any)(...args),
  useCreateEnvelope: (...args: any[]) => (mockUseCreateEnvelope as any)(...args),
  useSendEnvelope: (...args: any[]) => (mockUseSendEnvelope as any)(...args),
  useRejectEnvelope: (...args: any[]) => (mockUseRejectEnvelope as any)(...args),
  useDeleteEnvelope: (...args: any[]) => (mockUseDeleteEnvelope as any)(...args),
}))
// Mock recipients validation to map emails to user IDs
jest.mock('@/hooks/useUsers', () => ({
  useEnvelopeUserValidation: () => ({
    validateRecipients: async (emails: string[]) => ({
      valid: emails.map((e, idx) => ({ email: e, user: { id: `user-${idx + 1}` } })),
      invalid: [],
    }),
    isValidating: false,
    error: null,
  }),
}))

// Mock toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
}

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUseDocuments = useDocuments as jest.MockedFunction<typeof useDocuments>
const mockUseEnvelopes = useEnvelopes as jest.MockedFunction<typeof useEnvelopes>
const mockUseCreateEnvelope = useCreateEnvelope as jest.MockedFunction<typeof useCreateEnvelope>
const mockUseSendEnvelope = useSendEnvelope as jest.MockedFunction<typeof useSendEnvelope>
const mockUseRejectEnvelope = useRejectEnvelope as jest.MockedFunction<typeof useRejectEnvelope>
const mockUseDeleteEnvelope = useDeleteEnvelope as jest.MockedFunction<typeof useDeleteEnvelope>

// Test data
const mockUser = {
  user: {
    id: '1',
    email: 'test@example.com',
    full_name: 'Test User',
  },
  session: {
    user: {
      email: 'test@example.com',
    },
  },
}

const mockDocuments = {
  results: [
    {
      id: '1',
      file_name: 'test-document.pdf',
      file_size: 1024,
      status: 'draft',
    },
    {
      id: '2',
      file_name: 'another-document.pdf',
      file_size: 2048,
      status: 'draft',
    },
  ],
  count: 2,
  next: null,
  previous: null,
}

const mockEnvelopes = {
  results: [
    {
      id: '1',
      document: {
        id: '1',
        file_name: 'test-document.pdf',
        file_url: '/documents/1',
        file_size: 1024,
      },
      creator: {
        id: '1',
        email: 'test@example.com',
        full_name: 'Test User',
      },
      recipients: [
        {
          id: '1',
          email: 'signer1@example.com',
          name: 'Signer One',
          order: 1,
          status: 'pending',
        },
        {
          id: '2',
          email: 'signer2@example.com',
          name: 'Signer Two',
          order: 2,
          status: 'pending',
        },
      ],
      status: 'draft',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      document: {
        id: '2',
        file_name: 'another-document.pdf',
        file_url: '/documents/2',
        file_size: 2048,
      },
      creator: {
        id: '1',
        email: 'test@example.com',
        full_name: 'Test User',
      },
      recipients: [
        {
          id: '3',
          email: 'signer3@example.com',
          name: 'Signer Three',
          order: 1,
          status: 'signed',
        },
      ],
      status: 'pending',
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
      sent_at: '2024-01-02T00:00:00Z',
    },
  ],
  count: 2,
  next: null,
  previous: null,
}

const mockEnvelope = mockEnvelopes.results[0]

// Helper function to create a test wrapper
const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
  
  return TestWrapper
}

describe('Envelopes Module', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue(mockRouter)
    mockUseAuth.mockReturnValue(mockUser)
  })

  describe('Envelopes List Page', () => {
    beforeEach(() => {
      mockUseEnvelopes.mockReturnValue({
        data: mockEnvelopes,
        isLoading: false,
        error: null,
      })
      mockUseDeleteEnvelope.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      } as any)
      mockUseRejectEnvelope.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      } as any)
    })

    it('renders envelopes list correctly', () => {
      render(<EnvelopesPage />, { wrapper: createTestWrapper() })

      expect(screen.getByText('Envelopes')).toBeInTheDocument()
      expect(screen.getByText('test-document.pdf')).toBeInTheDocument()
      expect(screen.getByText('another-document.pdf')).toBeInTheDocument()
      expect(screen.getAllByText('Test User').length).toBeGreaterThan(0)
    })

    it('displays envelope status badges', () => {
      render(<EnvelopesPage />, { wrapper: createTestWrapper() })

      expect(screen.getByText('draft')).toBeInTheDocument()
      expect(screen.getByText('pending')).toBeInTheDocument()
    })

    it('shows recipient count', () => {
      render(<EnvelopesPage />, { wrapper: createTestWrapper() })

      expect(screen.getByText('2 recipients')).toBeInTheDocument()
      expect(screen.getByText('1 recipient')).toBeInTheDocument()
    })

    it('handles view envelope action', async () => {
      const user = userEvent.setup()
      render(<EnvelopesPage />, { wrapper: createTestWrapper() })

      const viewButton = screen.getAllByTitle('View envelope')[0]
      await user.click(viewButton)

      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/envelopes/1')
    })

    it('handles delete envelope action', async () => {
      const user = userEvent.setup()
      const mockDeleteMutation = jest.fn()
      mockUseDeleteEnvelope.mockReturnValue({
        mutateAsync: mockDeleteMutation,
        isPending: false,
      } as any)

      // Mock window.confirm
      window.confirm = jest.fn(() => true)

      render(<EnvelopesPage />, { wrapper: createTestWrapper() })

      const deleteButton = screen.getAllByTitle('Delete envelope')[0]
      await user.click(deleteButton)

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this envelope?')
      expect(mockDeleteMutation).toHaveBeenCalledWith('1')
    })

    it('shows reject button for sent envelopes by creator', () => {
      render(<EnvelopesPage />, { wrapper: createTestWrapper() })

      // Should show reject button for sent envelope created by current user
      const rejectButtons = screen.getAllByTitle('Reject envelope')
      expect(rejectButtons).toHaveLength(1) // Only for the sent envelope
    })

    it('handles reject envelope action', async () => {
      const user = userEvent.setup()
      const mockRejectMutation = jest.fn()
      mockUseRejectEnvelope.mockReturnValue({
        mutateAsync: mockRejectMutation,
        isPending: false,
      } as any)

      // Mock window.confirm
      window.confirm = jest.fn(() => true)

      render(<EnvelopesPage />, { wrapper: createTestWrapper() })

      const rejectButton = screen.getByTitle('Reject envelope')
      await user.click(rejectButton)

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to reject this envelope?')
      expect(mockRejectMutation).toHaveBeenCalledWith('2')
    })

    it('shows empty state when no envelopes', () => {
      mockUseEnvelopes.mockReturnValue({
        data: { results: [], count: 0, next: null, previous: null },
        isLoading: false,
        error: null,
      })

      render(<EnvelopesPage />, { wrapper: createTestWrapper() })

      expect(screen.getByText('No envelopes found.')).toBeInTheDocument()
    })

    it.skip('shows loading state', () => {})

    it('shows error state', () => {
      mockUseEnvelopes.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to load envelopes'),
      })

      render(<EnvelopesPage />, { wrapper: createTestWrapper() })

      expect(screen.getByText('Failed to load envelopes. Please try again.')).toBeInTheDocument()
    })
  })

  describe('Create Envelope Page', () => {
    beforeEach(() => {
      mockUseDocuments.mockReturnValue({
        data: mockDocuments.results,
        isLoading: false,
        error: null,
      })
      mockUseCreateEnvelope.mockReturnValue({
        mutateAsync: jest.fn().mockResolvedValue({ id: '3' }),
        isPending: false,
      } as any)
    })

    it('renders create envelope wizard', () => {
      render(<CreateEnvelopePage />, { wrapper: createTestWrapper() })

      expect(screen.getByText('Create Envelope')).toBeInTheDocument()
      expect(screen.getByText('Step 1: Select Document')).toBeInTheDocument()
    })

    it('shows step progress indicator', () => {
      render(<CreateEnvelopePage />, { wrapper: createTestWrapper() })

      expect(screen.getByText('Select Document')).toBeInTheDocument()
      expect(screen.getByText('Add Recipients')).toBeInTheDocument()
      expect(screen.getByText('Review & Create')).toBeInTheDocument()
    })

    it.skip('allows document selection', async () => {
      const user = userEvent.setup()
      render(<CreateEnvelopePage />, { wrapper: createTestWrapper() })

      const documentSelect = screen.getByRole('combobox')
      await user.click(documentSelect)

      expect(screen.getByText('test-document.pdf (draft)')).toBeInTheDocument()
      expect(screen.getByText('another-document.pdf (draft)')).toBeInTheDocument()
    })

    it.skip('shows selected document preview', async () => {
      const user = userEvent.setup()
      render(<CreateEnvelopePage />, { wrapper: createTestWrapper() })

      const documentSelect = screen.getByRole('combobox')
      await user.click(documentSelect)
      await user.click(screen.getByText('test-document.pdf (draft)'))

      expect(screen.getByText('test-document.pdf')).toBeInTheDocument()
    })

    it.skip('navigates to step 2 after document selection', async () => {
      const user = userEvent.setup()
      render(<CreateEnvelopePage />, { wrapper: createTestWrapper() })

      const documentSelect = screen.getByRole('combobox')
      await user.click(documentSelect)
      await user.click(screen.getByText('test-document.pdf (draft)'))

      const nextButton = screen.getByText('Next')
      await user.click(nextButton)

      expect(screen.getByText('Step 2: Add Recipients')).toBeInTheDocument()
    })

    it.skip('allows adding recipients', async () => {
      const user = userEvent.setup()
      render(<CreateEnvelopePage />, { wrapper: createTestWrapper() })

      // Select document first
      const documentSelect = screen.getByRole('combobox')
      await user.click(documentSelect)
      await user.click(screen.getByText('test-document.pdf (draft)'))

      const nextButton = screen.getByText('Next')
      await user.click(nextButton)

      // Add recipient
      await user.type(screen.getByLabelText('Recipient Name'), 'John Doe')
      await user.type(screen.getByLabelText('Recipient Email'), 'john@example.com')
      await user.click(screen.getByText('+ Add Recipient'))

      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
    })

    it.skip('allows reordering recipients', async () => {
      const user = userEvent.setup()
      render(<CreateEnvelopePage />, { wrapper: createTestWrapper() })

      // Select document and go to step 2
      const documentSelect = screen.getByRole('combobox')
      await user.click(documentSelect)
      await user.click(screen.getByText('test-document.pdf (draft)'))
      await user.click(screen.getByText('Next'))

      // Add two recipients
      await user.type(screen.getByLabelText('Recipient Name'), 'John Doe')
      await user.type(screen.getByLabelText('Recipient Email'), 'john@example.com')
      await user.click(screen.getByText('+ Add Recipient'))

      await user.type(screen.getByLabelText('Recipient Name'), 'Jane Smith')
      await user.type(screen.getByLabelText('Recipient Email'), 'jane@example.com')
      await user.click(screen.getByText('+ Add Recipient'))

      // Check initial order
      const recipients = screen.getAllByText(/Order \d+/)
      expect(recipients[0]).toHaveTextContent('Order 1')
      expect(recipients[1]).toHaveTextContent('Order 2')
    })

    it.skip('allows removing recipients', async () => {
      const user = userEvent.setup()
      render(<CreateEnvelopePage />, { wrapper: createTestWrapper() })

      // Select document and go to step 2
      const documentSelect = screen.getByRole('combobox')
      await user.click(documentSelect)
      await user.click(screen.getByText('test-document.pdf (draft)'))
      await user.click(screen.getByText('Next'))

      // Add recipient
      await user.type(screen.getByLabelText('Recipient Name'), 'John Doe')
      await user.type(screen.getByLabelText('Recipient Email'), 'john@example.com')
      await user.click(screen.getByText('+ Add Recipient'))

      expect(screen.getByText('John Doe')).toBeInTheDocument()

      // Remove recipient
      await user.click(screen.getByText('Remove'))
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
    })

    it.skip('navigates to step 3 after adding recipients', async () => {
      const user = userEvent.setup()
      render(<CreateEnvelopePage />, { wrapper: createTestWrapper() })

      // Select document and go to step 2
      const documentSelect = screen.getByRole('combobox')
      await user.click(documentSelect)
      await user.click(screen.getByText('test-document.pdf (draft)'))
      await user.click(screen.getByText('Next'))

      // Add recipient
      await user.type(screen.getByLabelText('Recipient Name'), 'John Doe')
      await user.type(screen.getByLabelText('Recipient Email'), 'john@example.com')
      await user.click(screen.getByText('+ Add Recipient'))

      // Go to step 3
      await user.click(screen.getByText('Next'))

      expect(screen.getByText('Step 3: Review & Create')).toBeInTheDocument()
      expect(screen.getByText('test-document.pdf')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    it.skip('creates envelope successfully', async () => {
      const user = userEvent.setup()
      const mockCreateMutation = jest.fn().mockResolvedValue({ id: '3' })
      mockUseCreateEnvelope.mockReturnValue({
        mutateAsync: mockCreateMutation,
        isPending: false,
      } as any)

      render(<CreateEnvelopePage />, { wrapper: createTestWrapper() })

      // Complete the wizard
      const documentSelect = screen.getByRole('combobox')
      await user.click(documentSelect)
      await user.click(screen.getByText('test-document.pdf (draft)'))
      await user.click(screen.getByText('Next'))

      await user.type(screen.getByLabelText('Recipient Name'), 'John Doe')
      await user.type(screen.getByLabelText('Recipient Email'), 'john@example.com')
      await user.click(screen.getByText('+ Add Recipient'))

      await user.click(screen.getByText('Next'))
      await user.click(screen.getByText('Create Envelope'))

      expect(mockCreateMutation).toHaveBeenCalled()
      const payload = mockCreateMutation.mock.calls[0][0]
      expect(payload.document_id).toBe('1')
      expect(Array.isArray(payload.signing_order)).toBe(true)
      expect(payload.signing_order[0]).toEqual({ signer_id: expect.any(String), order: 1 })
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/envelopes/3')
    })

    it('shows validation errors', async () => {
      const user = userEvent.setup()
      render(<CreateEnvelopePage />, { wrapper: createTestWrapper() })

      // Try to go to step 2 without selecting document
      await user.click(screen.getByText('Next'))

      // Should not proceed
      expect(screen.getByText('Step 1: Select Document')).toBeInTheDocument()
    })

    it('allows going back to previous steps', async () => {
      const user = userEvent.setup()
      render(<CreateEnvelopePage />, { wrapper: createTestWrapper() })

      // Go to step 2
      const documentSelect = screen.getByRole('combobox')
      await user.click(documentSelect)
      await user.click(screen.getByText('test-document.pdf (draft)'))
      await user.click(screen.getByText('Next'))

      // Go back to step 1
      await user.click(screen.getByText('Previous'))

      expect(screen.getByText('Step 1: Select Document')).toBeInTheDocument()
    })
  })

  describe('Envelope Detail Page', () => {
    beforeEach(() => {
      const { useParams } = require('next/navigation')
      useParams.mockReturnValue({ id: '1' })
      mockUseEnvelope.mockReturnValue({
        data: mockEnvelope,
        isLoading: false,
        error: null,
      })
      mockUseSendEnvelope.mockReturnValue({ mutateAsync: jest.fn(), isPending: false } as any)
      mockUseRejectEnvelope.mockReturnValue({ mutateAsync: jest.fn(), isPending: false } as any)
      mockUseDeleteEnvelope.mockReturnValue({ mutateAsync: jest.fn(), isPending: false } as any)
    })

    it('renders envelope details correctly', () => {
      render(<EnvelopeDetailPage />, { wrapper: createTestWrapper() })

      expect(screen.getByText('Envelope: test-document.pdf')).toBeInTheDocument()
      expect(screen.getByText(/Creator:/)).toBeInTheDocument()
      expect(screen.getByText('draft')).toBeInTheDocument()
    })

    it('shows document information', () => {
      render(<EnvelopeDetailPage />, { wrapper: createTestWrapper() })

      expect(screen.getByText('Document Information')).toBeInTheDocument()
      expect(screen.getByText('test-document.pdf')).toBeInTheDocument()
    })

    it('shows recipients with signing order', () => {
      render(<EnvelopeDetailPage />, { wrapper: createTestWrapper() })

      expect(screen.getByText('Recipients (2)')).toBeInTheDocument()
      expect(screen.getByText('Signer One')).toBeInTheDocument()
      expect(screen.getByText('Signer Two')).toBeInTheDocument()
    })

    it('shows timeline of actions', () => {
      render(<EnvelopeDetailPage />, { wrapper: createTestWrapper() })

      expect(screen.getByText('Timeline')).toBeInTheDocument()
      expect(screen.getByText(/Created:/)).toBeInTheDocument()
    })

    it('shows send button for draft envelopes', () => {
      render(<EnvelopeDetailPage />, { wrapper: createTestWrapper() })

      expect(screen.getByText('Send Envelope')).toBeInTheDocument()
    })

    it('handles send envelope action', async () => {
      const user = userEvent.setup()
      const mockSendMutation = jest.fn()
      
      // Mock window.confirm
      window.confirm = jest.fn(() => true)

      render(<EnvelopeDetailPage />, { wrapper: createTestWrapper() })

      const sendButton = screen.getByText('Send Envelope')
      await user.click(sendButton)

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to send this envelope?')
    })

    it('shows reject button for pending envelopes', () => {
      // Mock pending envelope
      const pendingEnvelope = { ...mockEnvelope, status: 'pending' }
      mockUseEnvelope.mockReturnValue({ data: pendingEnvelope, isLoading: false, error: null })

      render(<EnvelopeDetailPage />, { wrapper: createTestWrapper() })

      expect(screen.getByText('Reject Envelope')).toBeInTheDocument()
    })

    it.skip('handles reject envelope action', async () => {
      const user = userEvent.setup()
      const mockRejectMutation = jest.fn()
      
      // Mock window.confirm
      window.confirm = jest.fn(() => true)

      render(<EnvelopeDetailPage />, { wrapper: createTestWrapper() })

      const rejectButton = screen.getByText('Reject Envelope')
      await user.click(rejectButton)

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to reject this envelope?')
    })

    it('handles delete envelope action', async () => {
      const user = userEvent.setup()
      const mockDeleteMutation = jest.fn()
      
      // Mock window.confirm
      window.confirm = jest.fn(() => true)

      render(<EnvelopeDetailPage />, { wrapper: createTestWrapper() })

      const deleteButton = screen.getByText('Delete')
      await user.click(deleteButton)

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this envelope?')
    })

    it.skip('shows loading state', () => {})

    it('shows error state', () => {
      mockUseEnvelope.mockReturnValue({ data: undefined, isLoading: false, error: new Error('Failed to load envelope') })

      render(<EnvelopeDetailPage />, { wrapper: createTestWrapper() })

      expect(screen.getByText('Failed to load envelope. Please try again.')).toBeInTheDocument()
    })

    it('shows not found state', () => {
      mockUseEnvelope.mockReturnValue({ data: null, isLoading: false, error: null })

      render(<EnvelopeDetailPage />, { wrapper: createTestWrapper() })

      expect(screen.getByText('Envelope not found.')).toBeInTheDocument()
    })
  })

  describe('Envelope Status Updates', () => {
    it('updates status to sent after sending', async () => {
      const user = userEvent.setup()
      const mockSendMutation = jest.fn().mockResolvedValue({})
      mockUseSendEnvelope.mockReturnValue({ mutateAsync: mockSendMutation, isPending: false } as any)
      // Mock window.confirm
      window.confirm = jest.fn(() => true)

      render(<EnvelopeDetailPage />, { wrapper: createTestWrapper() })

      const sendButton = screen.getByText('Send Envelope')
      await user.click(sendButton)

      expect(mockSendMutation).toHaveBeenCalled()
    })

    it('updates status to rejected after rejecting', async () => {
      const user = userEvent.setup()
      const mockRejectMutation = jest.fn().mockResolvedValue({})
      mockUseRejectEnvelope.mockReturnValue({ mutateAsync: mockRejectMutation, isPending: false } as any)
      // Mock window.confirm
      window.confirm = jest.fn(() => true)

      render(<EnvelopeDetailPage />, { wrapper: createTestWrapper() })

      const rejectButton = screen.getByText('Reject Envelope')
      await user.click(rejectButton)

      expect(mockRejectMutation).toHaveBeenCalled()
    })

    it('removes envelope from list after deletion', async () => {
      const user = userEvent.setup()
      const mockDeleteMutation = jest.fn().mockResolvedValue({})
      mockUseDeleteEnvelope.mockReturnValue({ mutateAsync: mockDeleteMutation, isPending: false } as any)
      // Mock window.confirm
      window.confirm = jest.fn(() => true)

      render(<EnvelopesPage />, { wrapper: createTestWrapper() })

      const deleteButton = screen.getAllByTitle('Delete envelope')[0]
      await user.click(deleteButton)

      expect(mockDeleteMutation).toHaveBeenCalledWith('1')
    })
  })
})
