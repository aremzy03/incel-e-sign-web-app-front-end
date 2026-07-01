import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import NotificationsPage from '../app/dashboard/notifications/page'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

jest.mock('@/lib/api/notifications', () => ({
  listNotifications: jest.fn(),
  markNotificationRead: jest.fn(),
  markAllNotificationsRead: jest.fn(),
}))

jest.mock('@/hooks/useAuthReady', () => ({
  useAuthReady: () => ({ isReady: true, status: 'authenticated' }),
  shouldRetryAuthQuery: () => false,
}))

// Mock Next.js router
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

describe('Notifications Page', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => {
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }

  const mockNotifications = [
    { id: 1, message: 'Envelope Contract NDA was sent', created_at: new Date().toISOString(), is_read: false },
    { id: 2, message: 'Signer John Doe completed signing', created_at: new Date().toISOString(), is_read: false },
    { id: 3, message: 'Envelope was declined', created_at: new Date().toISOString(), is_read: true },
  ]

  beforeEach(() => {
    const { useSession } = require('next-auth/react')
    useSession.mockReturnValue({
      data: {
        accessToken: 'test-token',
        user: { id: '1', email: 'a@test.com', full_name: 'Test User' },
      },
      status: 'authenticated',
    })

    const api = require('@/lib/api/notifications')
    api.listNotifications.mockResolvedValue(mockNotifications)
    api.markNotificationRead.mockResolvedValue(undefined)
    api.markAllNotificationsRead.mockResolvedValue(undefined)
  })

  it('renders notifications page with dummy data', async () => {
    render(<NotificationsPage />, { wrapper })

    expect(screen.getByText('Notifications')).toBeInTheDocument()
    expect(screen.getByText('Stay updated with your document activities')).toBeInTheDocument()

    expect(await screen.findByText('Envelope Contract NDA was sent')).toBeInTheDocument()
    expect(await screen.findByText('Signer John Doe completed signing')).toBeInTheDocument()
    expect(await screen.findByText('Envelope was declined')).toBeInTheDocument()
  })

  it('shows unread count in segmented control', async () => {
    render(<NotificationsPage />, { wrapper })
    expect(await screen.findByText(/Unread \(2\)/)).toBeInTheDocument()
  })

  it('allows marking notifications as read', async () => {
    render(<NotificationsPage />, { wrapper })

    const item = await screen.findByTestId('notification-item-1')
    expect(item).toBeInTheDocument()
    expect(item).toHaveTextContent('Envelope Contract NDA was sent')
    expect(screen.getByText('Unread (2)')).toBeInTheDocument()
  })

  it('allows marking all notifications as read', async () => {
    const api = require('@/lib/api/notifications')
    render(<NotificationsPage />, { wrapper })

    const markAllButton = await screen.findByRole('button', { name: /mark all as read/i })
    fireEvent.click(markAllButton)

    await waitFor(() => {
      expect(api.markAllNotificationsRead).toHaveBeenCalled()
    })
  })
})
