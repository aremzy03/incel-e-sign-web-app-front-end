import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
// Import real pages so assertions can find text
import DocumentsPage from '@/app/dashboard/documents/page'
import DocumentUploadPage from '@/app/dashboard/documents/upload/page'
import DocumentDetailPage from '@/app/dashboard/documents/[id]/page'

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  ...jest.requireActual('next-auth/react'),
  useSession: jest.fn(),
}))

const getMockApi = () => {
  const axios = require('axios')
  return (axios.create as jest.Mock).mock.results[0]?.value || (axios.create as jest.Mock)()
}

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
  useParams: () => ({ id: '1' }),
  useSearchParams: () => ({
    get: jest.fn((key: string) => (key === 'pdf_password' ? undefined : null)),
    has: jest.fn(() => false),
    getAll: jest.fn(() => []),
  }),
}))

// Mock document data
const mockDocuments = [
  {
    id: '1',
    file_name: 'test-document.pdf',
    file_url: 'https://example.com/1.pdf',
    file_size: 1024000,
    file_type: 'application/pdf',
    status: 'draft',
    owner: {
      id: '1',
      email: 'test@example.com',
      full_name: 'Test User',
    },
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    download_url: 'https://example.com/download/1',
  },
  {
    id: '2',
    file_name: 'another-document.pdf',
    file_url: 'https://example.com/2.pdf',
    file_size: 2048000,
    file_type: 'application/pdf',
    status: 'sent',
    owner: {
      id: '2',
      email: 'other@example.com',
      full_name: 'Other User',
    },
    created_at: '2025-01-02T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z',
    download_url: 'https://example.com/download/2',
  },
]

const mockSession = {
  user: {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
  },
  accessToken: 'mock-access-token',
}

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return (
    <SessionProvider session={mockSession}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster />
      </QueryClientProvider>
    </SessionProvider>
  )
}

describe('Documents Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    require('next-auth/react').useSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    })
  })

  describe('Documents List Page', () => {
    const mockListResponse = (docs: typeof mockDocuments) => {
      const mockApi = getMockApi()
      mockApi.get.mockResolvedValue({ data: docs })
    }

    it('displays documents correctly', async () => {
      mockListResponse(mockDocuments)

      render(
        <TestWrapper>
          <DocumentsPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Documents')).toBeInTheDocument()
        expect(screen.getAllByText('test-document.pdf').length).toBeGreaterThan(0)
        expect(screen.getAllByText('another-document.pdf').length).toBeGreaterThan(0)
      })
    })

    it('shows empty state when no documents', async () => {
      mockListResponse([])

      render(
        <TestWrapper>
          <DocumentsPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('No documents found')).toBeInTheDocument()
        expect(screen.getByText('Upload Your First Document')).toBeInTheDocument()
      })
    })

    it('handles delete document', async () => {
      const user = userEvent.setup()
      const mockApi = getMockApi()
      const mockDelete = mockApi.delete as jest.Mock
      mockApi.get.mockResolvedValue({ data: [mockDocuments[0]] })
      mockDelete.mockResolvedValueOnce({ data: {} })

      render(
        <TestWrapper>
          <DocumentsPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getAllByText('test-document.pdf').length).toBeGreaterThan(0)
      })

      jest.spyOn(window, 'confirm').mockReturnValue(true)
      const rowActionButtons = screen.getAllByRole('button', { name: 'Row actions' })
      await user.click(rowActionButtons[0])
      const deleteItem = await screen.findByText('Delete')
      await user.click(deleteItem)

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalledWith('/documents/1/delete/')
      })
    })
  })

  describe('Document Upload Page', () => {
    it('validates file type', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <DocumentUploadPage />
        </TestWrapper>
      )

      // Create a mock file with invalid type
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' })
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getAllByText('Only PDF or Word (.doc, .docx) files are allowed').length).toBeGreaterThan(0)
      })
    })

    it('validates file size', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <DocumentUploadPage />
        </TestWrapper>
      )

      // Create a mock file that's too large (25MB) without huge payload
      const largeFile = new File(['x'], 'large.pdf', { type: 'application/pdf' })
      Object.defineProperty(largeFile, 'size', { value: 25 * 1024 * 1024 })
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      fireEvent.change(input, { target: { files: [largeFile] } })

      await waitFor(() => {
        expect(screen.getAllByText('File size must be less than 20MB').length).toBeGreaterThan(0)
      })
    })

    it('uploads document successfully', async () => {
      const user = userEvent.setup()
      const mockApi = getMockApi()
      const mockPost = mockApi.post as jest.Mock
      mockPost.mockResolvedValue({
        data: {
          status: 'success',
          message: 'ok',
          data: {
            id: '1',
            file_name: 'test.pdf',
            file_size: 1024000,
            file_url: '/test.pdf',
            status: 'draft',
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
          },
        },
      })

      render(
        <TestWrapper>
          <DocumentUploadPage />
        </TestWrapper>
      )

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      await user.upload(input, file)

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalled()
        const callUrl = mockPost.mock.calls[0][0]
        expect(callUrl).toMatch(/\/documents\/upload\/?$/)
      })

      expect(await screen.findByText(/ready to sign/i)).toBeInTheDocument()
    })
  })

  describe('Document Detail Page', () => {
    it('displays document details correctly', async () => {
      const mockApi = getMockApi()
      mockApi.get.mockResolvedValueOnce({ data: mockDocuments[0] })

      render(
        <TestWrapper>
          <DocumentDetailPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Document: test-document.pdf')).toBeInTheDocument()
        expect(screen.getAllByText('You').length).toBeGreaterThan(0)
        expect(screen.getAllByText('draft').length).toBeGreaterThan(0)
      })
    })

    it('shows delete button for document owner', async () => {
      const mockApi = getMockApi()
      mockApi.get.mockResolvedValueOnce({
        data: mockDocuments[0], // Document owned by test@example.com
      })

      render(
        <TestWrapper>
          <DocumentDetailPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
      })
    })

    it('handles document not found', async () => {
      const mockApi = getMockApi()
      mockApi.get.mockRejectedValueOnce({
        response: { status: 404 },
      })

      render(
        <TestWrapper>
          <DocumentDetailPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Document not found')).toBeInTheDocument()
        expect(screen.getByText('Back to Documents')).toBeInTheDocument()
      })
    })
  })
})
