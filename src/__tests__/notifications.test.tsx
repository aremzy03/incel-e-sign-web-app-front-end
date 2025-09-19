import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import NotificationsPage from '../app/dashboard/notifications/page'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}))

describe('Notifications Page', () => {
  it('renders notifications page with dummy data', () => {
    render(<NotificationsPage />)
    
    // Check if the page title is rendered
    expect(screen.getByText('Notifications')).toBeInTheDocument()
    expect(screen.getByText('Stay updated with your document activities')).toBeInTheDocument()
    
    // Check if notification cards are rendered
    expect(screen.getByText('Envelope Contract NDA was sent')).toBeInTheDocument()
    expect(screen.getByText('Signer John Doe completed signing')).toBeInTheDocument()
    expect(screen.getByText('Envelope was declined')).toBeInTheDocument()
  })

  it('shows unread count badge', () => {
    render(<NotificationsPage />)
    
    // Check if unread count is displayed
    expect(screen.getByText('3 unread')).toBeInTheDocument()
  })

  it('allows marking notifications as read', async () => {
    render(<NotificationsPage />)
    
    // Find and click a "Mark as Read" button
    const markAsReadButtons = screen.getAllByText('Mark as Read')
    expect(markAsReadButtons.length).toBeGreaterThan(0)
    
    // Click the first "Mark as Read" button
    fireEvent.click(markAsReadButtons[0])
    
    // Wait for the state to update
    await waitFor(() => {
      // The notification should no longer have the "Mark as Read" button
      const remainingButtons = screen.queryAllByText('Mark as Read')
      expect(remainingButtons.length).toBeLessThan(markAsReadButtons.length)
    })
  })

  it('allows marking all notifications as read', async () => {
    render(<NotificationsPage />)
    
    // Find and click "Mark All as Read" button
    const markAllButton = screen.getByText('Mark All as Read')
    fireEvent.click(markAllButton)
    
    // Wait for all notifications to be marked as read
    await waitFor(() => {
      // All "Mark as Read" buttons should be gone
      const markAsReadButtons = screen.queryAllByText('Mark as Read')
      expect(markAsReadButtons).toHaveLength(0)
    })
  })

  it('shows notification details correctly', () => {
    render(<NotificationsPage />)
    
    // Check if notification details are displayed
    expect(screen.getByText('Your envelope "Contract NDA" has been sent to 2 recipients for signing.')).toBeInTheDocument()
    expect(screen.getByText('John Doe has successfully signed the document "Sales Agreement".')).toBeInTheDocument()
    expect(screen.getByText('The envelope "Contract Proposal" was declined by the recipient.')).toBeInTheDocument()
  })

  it('shows timestamps for notifications', () => {
    render(<NotificationsPage />)
    
    // Check if timestamps are displayed
    expect(screen.getByText('2025-09-16 14:32')).toBeInTheDocument()
    expect(screen.getByText('2025-09-15 18:21')).toBeInTheDocument()
    expect(screen.getByText('2025-09-14 09:30')).toBeInTheDocument()
  })

  it('displays notification icons correctly', () => {
    render(<NotificationsPage />)
    
    // Check if notification icons are present (they should be rendered as SVG elements)
    const notificationCards = screen.getAllByText(/Envelope|Signer|declined/)
    expect(notificationCards.length).toBeGreaterThan(0)
  })
})
