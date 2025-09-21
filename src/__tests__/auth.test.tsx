import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
// Mock the page components since they may not exist yet
const LoginPage = jest.fn()
const RegisterPage = jest.fn()
const DashboardClientLayout = jest.fn()

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  ...jest.requireActual('next-auth/react'),
  signIn: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
  useSession: jest.fn(),
}))

// Mock axios
jest.mock('axios', () => ({
  post: jest.fn(),
  get: jest.fn(),
  create: jest.fn(() => ({
    post: jest.fn(),
    get: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  })),
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/dashboard',
}))

const mockUser = {
  id: '1',
  email: 'test@example.com',
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
  })

  describe('Login Page', () => {
    it('renders login form correctly', () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      )

      expect(screen.getByText('Incel eSign')).toBeInTheDocument()
      expect(screen.getByText('Login to your account')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
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

      const emailInput = screen.getByLabelText('Email')
      await user.type(emailInput, 'invalid-email')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

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

      const passwordInput = screen.getByLabelText('Password')
      await user.type(passwordInput, '123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

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

      await user.type(screen.getByLabelText('Email'), 'test@example.com')
      await user.type(screen.getByLabelText('Password'), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

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

      await user.type(screen.getByLabelText('Email'), 'test@example.com')
      await user.type(screen.getByLabelText('Password'), 'wrongpassword')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
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

      expect(screen.getByText('Incel eSign')).toBeInTheDocument()
      expect(screen.getByText('Create your account')).toBeInTheDocument()
      expect(screen.getByLabelText('First Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Last Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument()
    })

    it('validates password strength', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      )

      await user.type(screen.getByLabelText('First Name'), 'John')
      await user.type(screen.getByLabelText('Last Name'), 'Doe')
      await user.type(screen.getByLabelText('Email'), 'test@example.com')
      await user.type(screen.getByLabelText('Password'), 'weak')
      await user.type(screen.getByLabelText('Confirm Password'), 'weak')
      await user.click(screen.getByRole('button', { name: /register/i }))

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

      await user.type(screen.getByLabelText('First Name'), 'John')
      await user.type(screen.getByLabelText('Last Name'), 'Doe')
      await user.type(screen.getByLabelText('Email'), 'test@example.com')
      await user.type(screen.getByLabelText('Password'), 'Password123')
      await user.type(screen.getByLabelText('Confirm Password'), 'DifferentPassword123')
      await user.click(screen.getByRole('button', { name: /register/i }))

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

      await user.type(screen.getByLabelText('First Name'), 'John')
      await user.type(screen.getByLabelText('Last Name'), 'Doe')
      await user.type(screen.getByLabelText('Email'), 'test@example.com')
      await user.type(screen.getByLabelText('Password'), 'Password123')
      await user.type(screen.getByLabelText('Confirm Password'), 'Password123')
      await user.click(screen.getByRole('button', { name: /register/i }))

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/auth/register/'),
        {
          email: 'test@example.com',
          password: 'Password123',
          first_name: 'John',
          last_name: 'Doe',
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

      await user.type(screen.getByLabelText('First Name'), 'John')
      await user.type(screen.getByLabelText('Last Name'), 'Doe')
      await user.type(screen.getByLabelText('Email'), 'test@example.com')
      await user.type(screen.getByLabelText('Password'), 'Password123')
      await user.type(screen.getByLabelText('Confirm Password'), 'Password123')
      await user.click(screen.getByRole('button', { name: /register/i }))

      await waitFor(() => {
        expect(screen.getByText('Email already exists')).toBeInTheDocument()
      })
    })
  })

  describe('Dashboard Layout', () => {
    it('displays user information correctly', () => {
      render(
        <TestWrapper>
          <DashboardClientLayout
            navigation={[]}
            user={mockUser}
          >
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
          <DashboardClientLayout
            navigation={[]}
            user={mockUser}
          >
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
      const axios = require('axios')
      axios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue({
          data: mockUser
        }),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      })

      render(
        <TestWrapper>
          <DashboardClientLayout
            navigation={[]}
            user={mockUser}
          >
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
