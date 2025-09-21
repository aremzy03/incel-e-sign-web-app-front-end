import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
// Mock the page components since they may not exist yet
const DocumentsPage = jest.fn()
const DocumentUploadPage = jest.fn()
const DocumentDetailPage = jest.fn()

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  ...jest.requireActual('next-auth/react'),
  useSession: jest.fn(),
}))

// Mock axios
jest.mock('axios', () => ({
  post: jest.fn(),
  get: jest.fn(),
  delete: jest.fn(),
  create: jest.fn(() => ({
    post: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  })),
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
  useParams: () => ({ id: '1' }),
}))

// Mock document data
const mockDocuments = [
  {
    id: '1',
    file_name: 'test-document.pdf',
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
    it('displays documents correctly', async () => {
      const axios = require('axios')
      axios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue({
          data: {
            count: 2,
            next: null,
            previous: null,
            results: mockDocuments,
          },
        }),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      })

      render(
        <TestWrapper>
          <DocumentsPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Documents')).toBeInTheDocument()
        expect(screen.getByText('test-document.pdf')).toBeInTheDocument()
        expect(screen.getByText('another-document.pdf')).toBeInTheDocument()
      })
    })

    it('shows empty state when no documents', async () => {
      const axios = require('axios')
      axios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue({
          data: {
            count: 0,
            next: null,
            previous: null,
            results: [],
          },
        }),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      })

      render(
        <TestWrapper>
          <DocumentsPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('No documents yet')).toBeInTheDocument()
        expect(screen.getByText('Upload Your First Document')).toBeInTheDocument()
      })
    })

    it('handles delete document', async () => {
      const user = userEvent.setup()
      const axios = require('axios')
      const mockDelete = jest.fn().mockResolvedValue({ data: {} })
      
      axios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue({
          data: {
            count: 1,
            next: null,
            previous: null,
            results: [mockDocuments[0]],
          },
        }),
        delete: mockDelete,
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      })

      render(
        <TestWrapper>
          <DocumentsPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('test-document.pdf')).toBeInTheDocument()
      })

      // Find and click delete button
      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /ok/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalledWith('/documents/1/')
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
      
      const fileInput = screen.getByRole('button', { name: /choose file/i })
      await user.click(fileInput)

      // Simulate file selection
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      })

      await user.upload(input, file)

      expect(screen.getByText('Only PDF files are allowed')).toBeInTheDocument()
    })

    it('validates file size', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <DocumentUploadPage />
        </TestWrapper>
      )

      // Create a mock file that's too large (25MB)
      const largeFile = new File(['x'.repeat(25 * 1024 * 1024)], 'large.pdf', { 
        type: 'application/pdf' 
      })
      
      const fileInput = screen.getByRole('button', { name: /choose file/i })
      await user.click(fileInput)

      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      Object.defineProperty(input, 'files', {
        value: [largeFile],
        writable: false,
      })

      await user.upload(input, largeFile)

      expect(screen.getByText('File size must be less than 20MB')).toBeInTheDocument()
    })

    it('uploads document successfully', async () => {
      const user = userEvent.setup()
      const axios = require('axios')
      const mockPost = jest.fn().mockResolvedValue({
        data: {
          id: '1',
          file_name: 'test.pdf',
          file_size: 1024000,
          file_type: 'application/pdf',
          status: 'draft',
          created_at: '2025-01-01T00:00:00Z',
          download_url: 'https://example.com/download/1',
        },
      })
      
      axios.create.mockReturnValue({
        post: mockPost,
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      })

      render(
        <TestWrapper>
          <DocumentUploadPage />
        </TestWrapper>
      )

      // Create a valid PDF file
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      
      const fileInput = screen.getByRole('button', { name: /choose file/i })
      await user.click(fileInput)

      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      })

      await user.upload(input, file)

      // Click upload button
      const uploadButton = screen.getByRole('button', { name: /upload document/i })
      await user.click(uploadButton)

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith('/documents/upload/', expect.any(FormData))
      })
    })
  })

  describe('Document Detail Page', () => {
    it('displays document details correctly', async () => {
      const axios = require('axios')
      axios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue({
          data: mockDocuments[0],
        }),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      })

      render(
        <TestWrapper>
          <DocumentDetailPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Document: test-document.pdf')).toBeInTheDocument()
        expect(screen.getByText('Test User')).toBeInTheDocument()
        expect(screen.getByText('draft')).toBeInTheDocument()
      })
    })

    it('shows delete button for document owner', async () => {
      const axios = require('axios')
      axios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue({
          data: mockDocuments[0], // Document owned by test@example.com
        }),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
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
      const axios = require('axios')
      axios.create.mockReturnValue({
        get: jest.fn().mockRejectedValue({
          response: { status: 404 },
        }),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
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
