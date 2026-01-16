import '@testing-library/jest-dom'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import AdminDashboard from '../app/dashboard/admin/page'
import UserManagementPage from '../app/dashboard/admin/users/page'
import SystemSettingsPage from '../app/dashboard/admin/settings/page'
import AuditLogViewer from '../app/dashboard/admin/audit/page'
import NotificationsCenter from '../app/dashboard/admin/notifications/page'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(() => ({})),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(() => null),
    has: jest.fn(() => false),
  })),
}))

describe('Admin Dashboard Pages', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }

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
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  })

  it('renders Admin Dashboard heading', () => {
    render(<AdminDashboard />, { wrapper })
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
  })

  it('renders User Management heading', () => {
    render(<UserManagementPage />, { wrapper })
    expect(screen.getByText('User Management')).toBeInTheDocument()
  })

  it('renders System Settings heading', () => {
    render(<SystemSettingsPage />, { wrapper })
    expect(screen.getByText('System Settings')).toBeInTheDocument()
  })

  it('renders Audit Logs heading', () => {
    render(<AuditLogViewer />, { wrapper })
    expect(screen.getByText('Audit Logs')).toBeInTheDocument()
  })

  it('renders Notifications Center heading', () => {
    render(<NotificationsCenter />, { wrapper })
    expect(screen.getByText('Notifications Center')).toBeInTheDocument()
  })
})
