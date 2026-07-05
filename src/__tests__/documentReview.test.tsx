import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import DocumentReviewPage from '../app/dashboard/documents/[id]/page'

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: '1' }),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(() => null),
    has: jest.fn(() => false),
  })),
}))

describe('Document Review Page', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => {
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }

  const mockDoc = {
    id: '1',
    file_name: 'contract.pdf',
    file_size: 1024,
    file_type: 'application/pdf',
    status: 'draft',
    created_at: '2025-09-16T12:00:00Z',
    updated_at: '2025-09-16T12:00:00Z',
  }

  it('renders document details from API', async () => {
    const axios = require('axios')
    const mockApi = (axios.create as jest.Mock).mock.results[0]?.value || (axios.create as jest.Mock)()
    mockApi.get.mockResolvedValueOnce({ data: mockDoc })

    render(<DocumentReviewPage />, { wrapper })

    await waitFor(() => {
      expect(screen.getAllByText('contract.pdf').length).toBeGreaterThan(0)
      expect(screen.getByText('Document Details')).toBeInTheDocument()
      expect(screen.getAllByText('Download').length).toBeGreaterThan(0)
    })
  })
})
