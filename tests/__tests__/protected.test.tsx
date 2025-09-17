import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/app/dashboard/layout'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

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

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockRedirect = redirect as jest.MockedFunction<typeof redirect>

describe('Protected Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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
}))

const mockSignOut = signOut as jest.MockedFunction<typeof signOut>

describe('DashboardClientLayout', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    first_name: 'John',
    last_name: 'Doe',
    role: 'user',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  const mockNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Documents', href: '/dashboard/documents', icon: '📄' },
    { name: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders dashboard layout with user information', () => {
    render(
      <DashboardClientLayout navigation={mockNavigation} user={mockUser}>
        <div>Dashboard Content</div>
      </DashboardClientLayout>
    )

    expect(screen.getByText('Incel eSign')).toBeInTheDocument()
    expect(screen.getAllByText('John Doe')).toHaveLength(2)
    expect(screen.getAllByText('test@example.com')).toHaveLength(2)
  })

  it('renders navigation links', () => {
    render(
      <DashboardClientLayout navigation={mockNavigation} user={mockUser}>
        <div>Dashboard Content</div>
      </DashboardClientLayout>
    )

    expect(screen.getAllByText('Dashboard')).toHaveLength(4)
    expect(screen.getByText('Documents')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('renders logout button', () => {
    render(
      <DashboardClientLayout navigation={mockNavigation} user={mockUser}>
        <div>Dashboard Content</div>
      </DashboardClientLayout>
    )

    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument()
  })

  it('calls signOut when logout button is clicked', async () => {
    const user = userEvent.setup()
    mockSignOut.mockResolvedValue(undefined)

    render(
      <DashboardClientLayout navigation={mockNavigation} user={mockUser}>
        <div>Dashboard Content</div>
      </DashboardClientLayout>
    )

    const logoutButton = screen.getByRole('button', { name: /logout/i })
    await user.click(logoutButton)

    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/login' })
  })

  it('renders children content', () => {
    render(
      <DashboardClientLayout navigation={mockNavigation} user={mockUser}>
        <div data-testid="dashboard-content">Dashboard Content</div>
      </DashboardClientLayout>
    )

    expect(screen.getByTestId('dashboard-content')).toBeInTheDocument()
  })

  it('shows user initials in avatar', () => {
    render(
      <DashboardClientLayout navigation={mockNavigation} user={mockUser}>
        <div>Dashboard Content</div>
      </DashboardClientLayout>
    )

    expect(screen.getAllByText('JD')).toHaveLength(2)
  })
})
