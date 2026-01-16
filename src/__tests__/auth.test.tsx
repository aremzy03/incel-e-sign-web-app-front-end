import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import LoginPage from '@/app/(auth)/login/page'
import RegisterPage from '@/app/(auth)/register/page'
import { DashboardClientLayout } from '@/app/dashboard/dashboard-client-layout'

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  ...jest.requireActual('next-auth/react'),
  signIn: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
  useSession: jest.fn(),
}))

jest.mock('@/hooks/useProfile', () => ({
  useProfile: jest.fn(),
}))

// Mock axios
jest.mock('axios')

const getMockApi = () => {
  const axios = require('axios')
  return (axios.create as jest.Mock).mock.results[0]?.value || (axios.create as jest.Mock)()
}

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/dashboard',
  useParams: jest.fn(() => ({})),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(() => null),
    has: jest.fn(() => false),
  })),
}))

const mockUser = {
  id: '1',
  email: 'test@example.com',
  full_name: 'John Doe',
  first_name: 'John',
  last_name: 'Doe',
  role: 'user',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
}

const mockSession = {
  user: mockUser,
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
}

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient()
  
  return (
    <SessionProvider session={mockSession}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster />
      </QueryClientProvider>
    </SessionProvider>
  )
}

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const { useSession } = require('next-auth/react')
    useSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    })
    const { useProfile } = require('@/hooks/useProfile')
    useProfile.mockReturnValue({ data: undefined })
  })

  describe('Login Page', () => {
    it('renders login form correctly', () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      )

      expect(screen.getByText('INCEL E-Sign')).toBeInTheDocument()
      expect(screen.getByText('Welcome Back')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('your@company.com')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in securely/i })).toBeInTheDocument()
    })

    it('validates email format', async () => {
      const user = userEvent.setup()
      const mockSignIn = require('next-auth/react').signIn
      mockSignIn.mockResolvedValue({ error: null })

      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      )

      const emailInput = screen.getByPlaceholderText('your@company.com')
      await user.type(emailInput, 'invalid-email')
      await user.click(screen.getByRole('button', { name: /sign in securely/i }))

      // The form should not proceed with invalid email
      expect(mockSignIn).not.toHaveBeenCalled()
    })

    it('validates password length', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      )

      const passwordInput = screen.getByPlaceholderText('Enter your password')
      await user.type(passwordInput, '123')
      await user.click(screen.getByRole('button', { name: /sign in securely/i }))

      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument()
    })

    it('handles login success', async () => {
      const user = userEvent.setup()
      const mockSignIn = require('next-auth/react').signIn
      mockSignIn.mockResolvedValue({ error: null })

      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      )

      await user.type(screen.getByPlaceholderText('your@company.com'), 'test@example.com')
      await user.type(screen.getByPlaceholderText('Enter your password'), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in securely/i }))

      expect(mockSignIn).toHaveBeenCalledWith('credentials', {
        email: 'test@example.com',
        password: 'password123',
        redirect: false,
      })
    })

    it('handles login failure', async () => {
      const user = userEvent.setup()
      const mockSignIn = require('next-auth/react').signIn
      mockSignIn.mockResolvedValue({ error: 'Invalid credentials' })

      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      )

      await user.type(screen.getByPlaceholderText('your@company.com'), 'test@example.com')
      await user.type(screen.getByPlaceholderText('Enter your password'), 'wrongpassword')
      await user.click(screen.getByRole('button', { name: /sign in securely/i }))

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
      })
    })
  })

  describe('Register Page', () => {
    it('renders register form correctly', () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      )

      expect(screen.getByText('INCEL E-Sign')).toBeInTheDocument()
      expect(screen.getByText('Create Your Account')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('First name')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Last name')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('your@company.com')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Create a strong password')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Re-enter your password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
    })

    it('validates password strength', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      )

      await user.type(screen.getByPlaceholderText('First name'), 'John')
      await user.type(screen.getByPlaceholderText('Last name'), 'Doe')
      await user.type(screen.getByPlaceholderText('your@company.com'), 'test@example.com')
      await user.type(screen.getByPlaceholderText('Create a strong password'), 'weak')
      await user.type(screen.getByPlaceholderText('Re-enter your password'), 'weak')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        // Check for any password validation error message
        expect(screen.getByText(/Password must be at least 8 characters|Password must contain/)).toBeInTheDocument()
      })
    })

    it('validates password confirmation', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      )

      await user.type(screen.getByPlaceholderText('First name'), 'John')
      await user.type(screen.getByPlaceholderText('Last name'), 'Doe')
      await user.type(screen.getByPlaceholderText('your@company.com'), 'test@example.com')
      await user.type(screen.getByPlaceholderText('Create a strong password'), 'Password123')
      await user.type(screen.getByPlaceholderText('Re-enter your password'), 'DifferentPassword123')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      expect(screen.getByText("Passwords don't match")).toBeInTheDocument()
    })

    it('handles registration success', async () => {
      const user = userEvent.setup()
      const axios = require('axios')
      axios.post.mockResolvedValue({ status: 201 })

      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      )

      await user.type(screen.getByPlaceholderText('First name'), 'John')
      await user.type(screen.getByPlaceholderText('Last name'), 'Doe')
      await user.type(screen.getByPlaceholderText('your@company.com'), 'test@example.com')
      await user.type(screen.getByPlaceholderText('Create a strong password'), 'Password123')
      await user.type(screen.getByPlaceholderText('Re-enter your password'), 'Password123')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/auth/register/'),
        {
          email: 'test@example.com',
          password: 'Password123',
          full_name: 'John Doe',
        }
      )
    })

    it('handles registration failure', async () => {
      const user = userEvent.setup()
      const axios = require('axios')
      axios.post.mockRejectedValue({
        response: {
          data: { detail: 'Email already exists' }
        }
      })

      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      )

      await user.type(screen.getByPlaceholderText('First name'), 'John')
      await user.type(screen.getByPlaceholderText('Last name'), 'Doe')
      await user.type(screen.getByPlaceholderText('your@company.com'), 'test@example.com')
      await user.type(screen.getByPlaceholderText('Create a strong password'), 'Password123')
      await user.type(screen.getByPlaceholderText('Re-enter your password'), 'Password123')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(screen.getByText('Email already exists')).toBeInTheDocument()
      })
    })
  })

  describe('Dashboard Layout', () => {
    it('displays user information correctly', () => {
      render(
        <TestWrapper>
          <DashboardClientLayout user={mockUser}>
            <div>Dashboard Content</div>
          </DashboardClientLayout>
        </TestWrapper>
      )

      expect(screen.getAllByText('John Doe')).toHaveLength(2) // Appears in sidebar and header
      expect(screen.getAllByText('test@example.com')).toHaveLength(2) // Appears in sidebar and header
    })

    it('handles logout', async () => {
      const user = userEvent.setup()
      const mockSignOut = require('next-auth/react').signOut
      mockSignOut.mockResolvedValue(undefined)

      render(
        <TestWrapper>
          <DashboardClientLayout user={mockUser}>
            <div>Dashboard Content</div>
          </DashboardClientLayout>
        </TestWrapper>
      )

      await user.click(screen.getByRole('button', { name: /logout/i }))
      expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/login' })
    })
  })

  describe('Profile Fetch', () => {
    it('fetches and displays profile data', async () => {
      const { useProfile } = require('@/hooks/useProfile')
      useProfile.mockReturnValue({ data: mockUser })

      render(
        <TestWrapper>
          <DashboardClientLayout user={mockUser}>
            <div>Dashboard Content</div>
          </DashboardClientLayout>
        </TestWrapper>
      )

      // The profile hook should be called and the user data should be displayed
      expect(screen.getAllByText('John Doe')).toHaveLength(2) // Appears in sidebar and header
      expect(screen.getAllByText('test@example.com')).toHaveLength(2) // Appears in sidebar and header
    })
  })
})
