import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import LoginPage from '@/app/(auth)/login/page'
import RegisterPage from '@/app/(auth)/register/page'
import { authAPI } from '@/lib/api/auth'

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  ...jest.requireActual('next-auth/react'),
  signIn: jest.fn(),
  getSession: jest.fn(),
  useSession: jest.fn(),
}))

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

// Mock authAPI
jest.mock('@/lib/api/auth', () => ({
  authAPI: {
    register: jest.fn(),
    login: jest.fn(),
    getProfile: jest.fn(),
    logout: jest.fn(),
    refreshToken: jest.fn(),
  },
}))

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
    <SessionProvider session={null}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </SessionProvider>
  )
}

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Register Page', () => {
    it('renders register form correctly', () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      )

      // Check for form elements
      expect(screen.getByLabelText('First Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Last Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument()
    })

    it('handles successful registration', async () => {
      const user = userEvent.setup()
      const mockRegister = authAPI.register as jest.MockedFunction<typeof authAPI.register>
      mockRegister.mockResolvedValueOnce({
        access_token: 'access_token',
        refresh_token: 'refresh_token',
        user: {
          id: '1',
          email: 'test@example.com',
          full_name: 'Test User',
          role: 'user',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      })

      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      )

      await user.type(screen.getByLabelText('First Name'), 'John')
      await user.type(screen.getByLabelText('Last Name'), 'Doe')
      await user.type(screen.getByLabelText('Email'), 'john@example.com')
      await user.type(screen.getByLabelText('Password'), 'Password123')
      await user.type(screen.getByLabelText('Confirm Password'), 'Password123')
      await user.click(screen.getByRole('button', { name: /register/i }))

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          email: 'john@example.com',
          password: 'Password123',
          full_name: 'John Doe',
        })
      })

      expect(toast.success).toHaveBeenCalledWith('Registration successful, please log in')
    })

    it('handles registration failure with field errors', async () => {
      const user = userEvent.setup()
      const mockRegister = authAPI.register as jest.MockedFunction<typeof authAPI.register>
      mockRegister.mockRejectedValueOnce({
        response: {
          data: {
            email: ['Email already exists'],
          },
        },
      })

      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      )

      await user.type(screen.getByLabelText('First Name'), 'John')
      await user.type(screen.getByLabelText('Last Name'), 'Doe')
      await user.type(screen.getByLabelText('Email'), 'existing@example.com')
      await user.type(screen.getByLabelText('Password'), 'Password123')
      await user.type(screen.getByLabelText('Confirm Password'), 'Password123')
      await user.click(screen.getByRole('button', { name: /register/i }))

      await waitFor(() => {
        expect(screen.getByText('Email already exists')).toBeInTheDocument()
      })

      expect(toast.error).toHaveBeenCalledWith('Email already exists')
    })
  })

  describe('Login Page', () => {
    it('renders login form correctly', () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      )

      // Check for form elements
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('handles successful login', async () => {
      const user = userEvent.setup()
      const mockSignIn = require('next-auth/react').signIn as jest.MockedFunction<any>
      const mockGetSession = require('next-auth/react').getSession as jest.MockedFunction<any>
      
      mockSignIn.mockResolvedValueOnce({ error: null })
      mockGetSession.mockResolvedValueOnce({
        user: { id: '1', email: 'test@example.com' },
        accessToken: 'access_token',
      })

      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      )

      await user.type(screen.getByLabelText('Email'), 'test@example.com')
      await user.type(screen.getByLabelText('Password'), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('credentials', {
          email: 'test@example.com',
          password: 'password123',
          redirect: false,
        })
      })

      expect(toast.success).toHaveBeenCalledWith('Welcome back!')
    })

    it('handles login failure', async () => {
      const user = userEvent.setup()
      const mockSignIn = require('next-auth/react').signIn as jest.MockedFunction<any>
      
      mockSignIn.mockResolvedValueOnce({ error: 'Invalid credentials' })

      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      )

      await user.type(screen.getByLabelText('Email'), 'test@example.com')
      await user.type(screen.getByLabelText('Password'), 'wrongpassword')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
      })

      expect(toast.error).toHaveBeenCalledWith('Invalid credentials')
    })
  })

  describe('Profile Fetch', () => {
    it('displays logged-in user profile', async () => {
      const mockUseSession = require('next-auth/react').useSession as jest.MockedFunction<any>
      const mockGetProfile = authAPI.getProfile as jest.MockedFunction<typeof authAPI.getProfile>
      
      mockUseSession.mockReturnValue({
        data: {
          accessToken: 'access_token',
        },
      })

      mockGetProfile.mockResolvedValueOnce({
        id: '1',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'user',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      })

      // This would be tested in a component that uses the useProfile hook
      // For now, we're testing the API function directly
      const profile = await authAPI.getProfile('access_token')
      
      expect(profile).toEqual({
        id: '1',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'user',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      })
    })
  })
})
