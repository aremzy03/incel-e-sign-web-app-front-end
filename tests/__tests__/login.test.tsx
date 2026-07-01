import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import LoginPage from '@/app/(auth)/login/page'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(() => ({})),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(() => null),
    has: jest.fn(() => false),
  })),
}))

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
  getSession: jest.fn(),
}))

const mockPush = jest.fn()
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>

describe('LoginPage', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
    mockSignIn.mockResolvedValue({ error: null })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders login page with correct title', () => {
    render(<LoginPage />)
    
    expect(screen.getByText('Welcome Back')).toBeInTheDocument()
    expect(screen.getByText('Sign in to your legal authority platform')).toBeInTheDocument()
  })

  it('renders email and password input fields', () => {
    render(<LoginPage />)
    
    expect(screen.getByPlaceholderText('your@company.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('your@company.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument()
  })

  it('renders Sign In button', () => {
    render(<LoginPage />)
    
    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument()
  })

  it('renders register link', () => {
    render(<LoginPage />)
    
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /create account/i })).toBeInTheDocument()
  })

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    
    const submitButton = screen.getByRole('button', { name: /^sign in$/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument()
      expect(screen.getByText('Password is required')).toBeInTheDocument()
    })
  })

  it.skip('shows validation error for invalid email', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    
    const emailInput = screen.getByPlaceholderText('your@company.com')
    const passwordInput = screen.getByPlaceholderText('Enter your password')
    const submitButton = screen.getByRole('button', { name: /^sign in$/i })
    
    await user.clear(emailInput)
    await user.type(emailInput, 'invalid-email')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('shows validation error for short password', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    
    const emailInput = screen.getByPlaceholderText('your@company.com')
    const passwordInput = screen.getByPlaceholderText('Enter your password')
    const submitButton = screen.getByRole('button', { name: /^sign in$/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, '123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument()
    })
  })

  it('calls signIn with correct credentials on form submission', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    
    const emailInput = screen.getByPlaceholderText('your@company.com')
    const passwordInput = screen.getByPlaceholderText('Enter your password')
    const submitButton = screen.getByRole('button', { name: /^sign in$/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('credentials', {
        email: 'test@example.com',
        password: 'password123',
        redirect: false,
      })
    })
  })

  it('shows error message when login fails', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({ error: 'Invalid credentials' })
    
    render(<LoginPage />)
    
    const emailInput = screen.getByPlaceholderText('your@company.com')
    const passwordInput = screen.getByPlaceholderText('Enter your password')
    const submitButton = screen.getByRole('button', { name: /^sign in$/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Invalid credentials|Invalid email or password/i)).toBeInTheDocument()
    })
  })

  it('shows loading state during form submission', async () => {
    const user = userEvent.setup()
    let resolveSignIn: ((value: any) => void) | null = null
    const pending = new Promise((resolve) => {
      resolveSignIn = resolve
    })
    mockSignIn.mockReturnValue(pending as any)
    
    render(<LoginPage />)
    
    const emailInput = screen.getByPlaceholderText('your@company.com')
    const passwordInput = screen.getByPlaceholderText('Enter your password')
    const submitButton = screen.getByRole('button', { name: /^sign in$/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^sign in$/i })).toBeDisabled()
    })

    // cleanup: resolve pending sign-in to avoid leaks
    resolveSignIn?.({ error: null })
  })
})
