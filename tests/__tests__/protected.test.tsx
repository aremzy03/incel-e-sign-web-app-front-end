import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

let mockHeaderGetImpl: (name: string) => string | null = () => null
jest.mock('next/headers', () => ({
  headers: jest.fn(async () => ({
    get: (name: string) => mockHeaderGetImpl(name),
  })),
}))

import DashboardLayout from '@/app/dashboard/layout'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
  usePathname: jest.fn(() => '/dashboard'),
}))

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

// Mock the auth options
jest.mock('@/pages/api/auth/[...nextauth]', () => ({
  authOptions: {},
}))

jest.mock('@/hooks/useProfile', () => ({
  useProfile: jest.fn(),
}))

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockRedirect = redirect as jest.MockedFunction<typeof redirect>

describe('Protected Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHeaderGetImpl = () => null
  })

  it('renders dashboard layout when user is authenticated', async () => {
    const mockSession = {
      user: {
        id: '1',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'user',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    }

    mockGetServerSession.mockResolvedValue(mockSession)

    const result = await DashboardLayout({
      children: <div>Dashboard Content</div>,
    })

    expect(result).toBeDefined()
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it('redirects to login when user is not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)

    try {
      await DashboardLayout({
        children: <div>Dashboard Content</div>,
      })
    } catch (error) {
      // Redirect throws an error, which is expected
    }

    expect(mockRedirect).toHaveBeenCalledWith('/login')
  })

  it('redirects to login with next when x-return-path header is present', async () => {
    mockHeaderGetImpl = (name: string) => (name === 'x-return-path' ? '/dashboard/inbox' : null)
    mockGetServerSession.mockResolvedValue(null)

    try {
      await DashboardLayout({
        children: <div>Dashboard Content</div>,
      })
    } catch {
      // redirect throws
    }

    expect(mockRedirect).toHaveBeenCalledWith('/login?next=%2Fdashboard%2Finbox')
  })

  it('redirects to login when session is undefined', async () => {
    mockGetServerSession.mockResolvedValue(undefined)

    try {
      await DashboardLayout({
        children: <div>Dashboard Content</div>,
      })
    } catch (error) {
      // Redirect throws an error, which is expected
    }

    expect(mockRedirect).toHaveBeenCalledWith('/login')
  })

  it('calls getServerSession with correct auth options', async () => {
    const mockSession = {
      user: {
        id: '1',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'user',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    }

    mockGetServerSession.mockResolvedValue(mockSession)

    await DashboardLayout({
      children: <div>Dashboard Content</div>,
    })

    expect(mockGetServerSession).toHaveBeenCalledWith(authOptions)
  })
})

// Test the DashboardClientLayout component
import { DashboardClientLayout } from '@/app/dashboard/dashboard-client-layout'
import { signOut } from 'next-auth/react'

jest.mock('next-auth/react', () => ({
  ...jest.requireActual('next-auth/react'),
  signOut: jest.fn(),
  getSession: jest.fn(),
}))

const mockSignOut = signOut as jest.MockedFunction<typeof signOut>

describe('DashboardClientLayout', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    full_name: 'John Doe',
    first_name: 'John',
    last_name: 'Doe',
    role: 'user',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
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
    jest.clearAllMocks()
    const { useProfile } = require('@/hooks/useProfile')
    useProfile.mockReturnValue({ data: undefined })
    const { getSession } = require('next-auth/react')
    getSession.mockResolvedValue({ refreshToken: 'mock-refresh-token' })
  })

  it('renders dashboard layout with user information', () => {
    render(
      <DashboardClientLayout user={mockUser}>
        <div>Dashboard Content</div>
      </DashboardClientLayout>,
      { wrapper }
    )

    expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0)
    expect(screen.getAllByText('test@example.com').length).toBeGreaterThan(0)
  })

  it('renders navigation links', () => {
    render(
      <DashboardClientLayout user={mockUser}>
        <div>Dashboard Content</div>
      </DashboardClientLayout>,
      { wrapper }
    )

    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0)
    expect(screen.getByText('Documents')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('renders logout button', () => {
    render(
      <DashboardClientLayout user={mockUser}>
        <div>Dashboard Content</div>
      </DashboardClientLayout>,
      { wrapper }
    )

    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument()
  })

  it('calls signOut when logout button is clicked', async () => {
    const user = userEvent.setup()
    mockSignOut.mockResolvedValue(undefined)

    render(
      <DashboardClientLayout user={mockUser}>
        <div>Dashboard Content</div>
      </DashboardClientLayout>,
      { wrapper }
    )

    const logoutButton = screen.getByRole('button', { name: /logout/i })
    await user.click(logoutButton)

    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/login' })
  })

  it('renders children content', () => {
    render(
      <DashboardClientLayout user={mockUser}>
        <div data-testid="dashboard-content">Dashboard Content</div>
      </DashboardClientLayout>,
      { wrapper }
    )

    expect(screen.getByTestId('dashboard-content')).toBeInTheDocument()
  })

  it('shows user initials in avatar', () => {
    render(
      <DashboardClientLayout user={mockUser}>
        <div>Dashboard Content</div>
      </DashboardClientLayout>,
      { wrapper }
    )

    expect(screen.getAllByText('JD').length).toBeGreaterThan(0)
  })
})
