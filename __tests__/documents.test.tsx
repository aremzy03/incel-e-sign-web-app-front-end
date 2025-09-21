import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import DocumentsPage from '@/app/dashboard/documents/page'
import DocumentUploadPage from '@/app/dashboard/documents/upload/page'
import DocumentDetailPage from '@/app/dashboard/documents/[id]/page'
import * as documentsApi from '@/lib/api/documents'

// Mock the API functions
vi.mock('@/lib/api/documents', () => ({
  getDocuments: vi.fn(),
  getDocument: vi.fn(),
  uploadDocument: vi.fn(),
  deleteDocument: vi.fn(),
  downloadDocument: vi.fn(),
}))

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useParams: () => ({
    id: 'test-document-id',
  }),
}))

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock the DocumentPreviewModal component
vi.mock('@/components/documents/DocumentPreviewModal', () => ({
  DocumentPreviewModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
    isOpen ? (
      <div data-testid="document-preview-modal">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
  ),
}))

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
})

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('Documents Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Documents List Page', () => {
    it('should display documents correctly when loaded', async () => {
      const mockDocuments = {
        count: 2,
        results: [
          {
            id: '1',
            file_name: 'test-document.pdf',
            file_size: 1024000,
            file_type: 'application/pdf',
            status: 'draft',
            owner: { email: 'test@example.com' },
            created_at: '2024-01-01T00:00:00Z',
          },
          {
            id: '2',
            file_name: 'another-document.pdf',
            file_size: 2048000,
            file_type: 'application/pdf',
            status: 'sent',
            owner: { email: 'test@example.com' },
            created_at: '2024-01-02T00:00:00Z',
          },
        ],
      }

      vi.mocked(documentsApi.getDocuments).mockResolvedValue(mockDocuments)

      renderWithQueryClient(<DocumentsPage />)

      await waitFor(() => {
        expect(screen.getByText('test-document.pdf')).toBeInTheDocument()
        expect(screen.getByText('another-document.pdf')).toBeInTheDocument()
        expect(screen.getByText('Draft')).toBeInTheDocument()
        expect(screen.getByText('Sent')).toBeInTheDocument()
      })
    })

    it('should handle empty state when no documents', async () => {
      const mockDocuments = {
        count: 0,
        results: [],
      }

      vi.mocked(documentsApi.getDocuments).mockResolvedValue(mockDocuments)

      renderWithQueryClient(<DocumentsPage />)

      await waitFor(() => {
        expect(screen.getByText('No documents found')).toBeInTheDocument()
        expect(screen.getByText('Upload your first document to get started with digital signing')).toBeInTheDocument()
      })
    })

    it('should handle loading state', () => {
      vi.mocked(documentsApi.getDocuments).mockImplementation(() => new Promise(() => {}))

      renderWithQueryClient(<DocumentsPage />)

      expect(screen.getByText('Loading documents...')).toBeInTheDocument()
    })

    it('should handle error state', async () => {
      vi.mocked(documentsApi.getDocuments).mockRejectedValue(new Error('API Error'))

      renderWithQueryClient(<DocumentsPage />)

      await waitFor(() => {
        expect(screen.getByText('Failed to load documents. Please try again.')).toBeInTheDocument()
      })
    })

    it('should delete document when delete button is clicked', async () => {
      const mockDocuments = {
        count: 1,
        results: [
          {
            id: '1',
            file_name: 'test-document.pdf',
            file_size: 1024000,
            file_type: 'application/pdf',
            status: 'draft',
            owner: { email: 'test@example.com' },
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
      }

      vi.mocked(documentsApi.getDocuments).mockResolvedValue(mockDocuments)
      vi.mocked(documentsApi.deleteDocument).mockResolvedValue(undefined)

      // Mock window.confirm
      window.confirm = vi.fn(() => true)

      renderWithQueryClient(<DocumentsPage />)

      await waitFor(() => {
        expect(screen.getByText('test-document.pdf')).toBeInTheDocument()
      })

      const deleteButton = screen.getByRole('button', { name: /delete/i })
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(documentsApi.deleteDocument).toHaveBeenCalledWith('1')
      })
    })
  })

  describe('Document Upload Page', () => {
    it('should upload document successfully', async () => {
      const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      const mockResponse = {
        id: '1',
        file_name: 'test.pdf',
        file_size: 1024,
        file_type: 'application/pdf',
        status: 'draft',
        created_at: '2024-01-01T00:00:00Z',
        download_url: 'http://example.com/download/1',
      }

      vi.mocked(documentsApi.uploadDocument).mockResolvedValue(mockResponse)

      renderWithQueryClient(<DocumentUploadPage />)

      const fileInput = screen.getByRole('button', { name: /choose file/i })
      fireEvent.click(fileInput)

      // Simulate file selection
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      Object.defineProperty(input, 'files', {
        value: [mockFile],
        writable: false,
      })
      fireEvent.change(input)

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument()
      })

      const uploadButton = screen.getByRole('button', { name: /upload document/i })
      fireEvent.click(uploadButton)

      await waitFor(() => {
        expect(documentsApi.uploadDocument).toHaveBeenCalledWith(mockFile)
      })
    })

    it('should validate file type and size', async () => {
      const invalidFile = new File(['test content'], 'test.txt', { type: 'text/plain' })

      renderWithQueryClient(<DocumentUploadPage />)

      const fileInput = screen.getByRole('button', { name: /choose file/i })
      fireEvent.click(fileInput)

      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      Object.defineProperty(input, 'files', {
        value: [invalidFile],
        writable: false,
      })
      fireEvent.change(input)

      await waitFor(() => {
        expect(screen.getByText('Only PDF and DOCX files are allowed')).toBeInTheDocument()
      })
    })

    it('should show upload progress', async () => {
      const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      const mockResponse = {
        id: '1',
        file_name: 'test.pdf',
        file_size: 1024,
        file_type: 'application/pdf',
        status: 'draft',
        created_at: '2024-01-01T00:00:00Z',
        download_url: 'http://example.com/download/1',
      }

      vi.mocked(documentsApi.uploadDocument).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockResponse), 100))
      )

      renderWithQueryClient(<DocumentUploadPage />)

      const fileInput = screen.getByRole('button', { name: /choose file/i })
      fireEvent.click(fileInput)

      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      Object.defineProperty(input, 'files', {
        value: [mockFile],
        writable: false,
      })
      fireEvent.change(input)

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument()
      })

      const uploadButton = screen.getByRole('button', { name: /upload document/i })
      fireEvent.click(uploadButton)

      await waitFor(() => {
        expect(screen.getByText('Uploading...')).toBeInTheDocument()
      })
    })
  })

  describe('Document Detail Page', () => {
    it('should display document details correctly', async () => {
      const mockDocument = {
        id: '1',
        file_name: 'test-document.pdf',
        file_size: 1024000,
        file_type: 'application/pdf',
        status: 'draft',
        owner: { email: 'test@example.com' },
        created_at: '2024-01-01T00:00:00Z',
      }

      vi.mocked(documentsApi.getDocument).mockResolvedValue(mockDocument)

      renderWithQueryClient(<DocumentDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('test-document.pdf')).toBeInTheDocument()
        expect(screen.getByText('Draft')).toBeInTheDocument()
        expect(screen.getByText('test@example.com')).toBeInTheDocument()
      })
    })

    it('should handle document not found', async () => {
      vi.mocked(documentsApi.getDocument).mockRejectedValue(new Error('Document not found'))

      renderWithQueryClient(<DocumentDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Document not found')).toBeInTheDocument()
      })
    })

    it('should download document when download button is clicked', async () => {
      const mockDocument = {
        id: '1',
        file_name: 'test-document.pdf',
        file_size: 1024000,
        file_type: 'application/pdf',
        status: 'draft',
        owner: { email: 'test@example.com' },
        created_at: '2024-01-01T00:00:00Z',
      }

      const mockBlob = new Blob(['test content'], { type: 'application/pdf' })

      vi.mocked(documentsApi.getDocument).mockResolvedValue(mockDocument)
      vi.mocked(documentsApi.downloadDocument).mockResolvedValue(mockBlob)

      renderWithQueryClient(<DocumentDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('test-document.pdf')).toBeInTheDocument()
      })

      const downloadButton = screen.getByRole('button', { name: /download/i })
      fireEvent.click(downloadButton)

      await waitFor(() => {
        expect(documentsApi.downloadDocument).toHaveBeenCalledWith('test-document-id')
      })
    })

    it('should delete document when delete button is clicked', async () => {
      const mockDocument = {
        id: '1',
        file_name: 'test-document.pdf',
        file_size: 1024000,
        file_type: 'application/pdf',
        status: 'draft',
        owner: { email: 'test@example.com' },
        created_at: '2024-01-01T00:00:00Z',
      }

      vi.mocked(documentsApi.getDocument).mockResolvedValue(mockDocument)
      vi.mocked(documentsApi.deleteDocument).mockResolvedValue(undefined)

      // Mock window.confirm
      window.confirm = vi.fn(() => true)

      renderWithQueryClient(<DocumentDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('test-document.pdf')).toBeInTheDocument()
      })

      const deleteButton = screen.getByRole('button', { name: /delete/i })
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(documentsApi.deleteDocument).toHaveBeenCalledWith('test-document-id')
      })
    })
  })
})
