import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import DocumentReviewPage from '../app/dashboard/documents/[id]/page'
import EnvelopeReviewPage from '../app/dashboard/envelopes/review/[id]/page'
import FinalSignOffPage from '../app/dashboard/sign/review/[envelopeId]/page'
import { useParams } from 'next/navigation'

jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(() => null),
    has: jest.fn(() => false),
  })),
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
    (useParams as jest.Mock).mockReturnValue({ id: '1', envelopeId: '1' })
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

  it('renders final sign-off page actions', () => {
    render(<FinalSignOffPage />, { wrapper })
    expect(screen.getByText('Review & Sign')).toBeInTheDocument()
    expect(screen.getByText('Confirm & Sign')).toBeInTheDocument()
  })
})
