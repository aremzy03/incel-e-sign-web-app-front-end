import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AuditPage from '../app/dashboard/audit/page'

jest.mock('@/lib/api/audit', () => ({
  listAuditLogs: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useParams: jest.fn(() => ({})),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(() => null),
    has: jest.fn(() => false),
  })),
}))

describe('Audit Log Page', () => {
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
    const api = require('@/lib/api/audit')
    api.listAuditLogs.mockResolvedValue({
      count: 2,
      next: null,
      previous: null,
      results: [
        {
          id: 1,
          created_at: new Date().toISOString(),
          actor: { id: 'u1', email: 'admin@example.com', full_name: 'Admin User' },
          action: 'CREATE_ENV',
          target: 'env-1',
          message: 'Envelope created',
        },
        {
          id: 2,
          created_at: new Date().toISOString(),
          actor: { id: 'u2', email: 'user@example.com', full_name: 'User Two' },
          action: 'SIGN_DOC',
          target: 'doc-1',
          message: 'Document signed',
        },
      ],
    })
  })

  it('renders audit log entries', async () => {
    render(<AuditPage />, { wrapper })

    expect(screen.getByText('Audit Logs')).toBeInTheDocument()
    expect(screen.getByText('Administrative view of system audit trails')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getAllByText(/CREATE ENV/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/SIGN DOC/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText('Admin User').length).toBeGreaterThan(0)
      expect(screen.getAllByText('User Two').length).toBeGreaterThan(0)
    })
  })
})
