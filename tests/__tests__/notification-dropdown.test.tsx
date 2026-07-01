import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NotificationDropdown } from '@/components/dashboard/notification-dropdown'

const notifications = [
  {
    id: 1,
    message: 'Your turn to sign the contract',
    created_at: '2024-01-01T12:00:00Z',
    is_read: false,
  },
  {
    id: 2,
    message: 'Envelope completed successfully',
    created_at: '2024-01-02T12:00:00Z',
    is_read: true,
  },
]

describe('NotificationDropdown', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
  )

  it('opens panel when bell is clicked', async () => {
    const user = userEvent.setup()
    render(<NotificationDropdown notifications={notifications} unreadCount={1} />, { wrapper })

    await user.click(screen.getByRole('button', { name: /notifications/i }))
    expect(screen.getByText('Notifications')).toBeInTheDocument()
    expect(screen.getByText('Your turn to sign the contract')).toBeInTheDocument()
  })

  it('shows view all link', async () => {
    const user = userEvent.setup()
    render(<NotificationDropdown notifications={notifications} unreadCount={1} />, { wrapper })

    await user.click(screen.getByRole('button', { name: /notifications/i }))
    expect(screen.getByRole('link', { name: /view all/i })).toHaveAttribute('href', '/dashboard/notifications')
  })
})
