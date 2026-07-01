import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import RegisterPage from '@/app/(auth)/register/page'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(() => ({})),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(() => null),
    has: jest.fn(() => false),
  })),
}))

jest.mock('next-auth/react', () => ({
  getSession: jest.fn().mockResolvedValue(null),
}))

// Mock axios
jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

const mockPush = jest.fn()

async function fillRegisterForm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('checkbox'))
  await user.type(screen.getByPlaceholderText('First name'), 'John')
  await user.type(screen.getByPlaceholderText('Last name'), 'Doe')
  await user.type(screen.getByPlaceholderText('your@company.com'), 'john@example.com')
  await user.type(screen.getByPlaceholderText('Create password'), 'Password123')
  await user.type(screen.getByPlaceholderText('Confirm password'), 'Password123')
}

describe('RegisterPage', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders register page with correct title', () => {
    render(<RegisterPage />)
    
    expect(screen.getByText('Incel E-Sign')).toBeInTheDocument()
    expect(screen.getByText('Create Your Account')).toBeInTheDocument()
    expect(screen.getByText('Start sending and signing documents in minutes')).toBeInTheDocument()
  })

  it('renders all required form fields', () => {
    render(<RegisterPage />)
    
    expect(screen.getByPlaceholderText('First name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Last name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('your@company.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Create password')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Confirm password')).toBeInTheDocument()
  })

  it('renders Register button', () => {
    render(<RegisterPage />)
    
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('renders login link', () => {
    render(<RegisterPage />)
    
    expect(screen.getByText('Already have an account?')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows validation errors for empty required fields', async () => {
    const user = userEvent.setup()
    render(<RegisterPage />)
    
    await user.click(screen.getByRole('checkbox'))
    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument()
      expect(screen.getByText('Email is required')).toBeInTheDocument()
      expect(screen.getByText('Password is required')).toBeInTheDocument()
      expect(screen.getByText('Please confirm your password')).toBeInTheDocument()
    })
  })

  it.skip('shows validation error for invalid email', async () => {
    const user = userEvent.setup()
    render(<RegisterPage />)
    
    const firstNameInput = screen.getByPlaceholderText('First name')
    const lastNameInput = screen.getByPlaceholderText('Last name')
    const emailInput = screen.getByPlaceholderText('your@company.com')
    const passwordInput = screen.getByPlaceholderText('Create password')
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm password')
    const submitButton = screen.getByRole('button', { name: /create account/i })
    
    await user.type(firstNameInput, 'John')
    await user.type(lastNameInput, 'Doe')
    await user.type(emailInput, 'invalid-email')
    await user.type(passwordInput, 'Password123')
    await user.type(confirmPasswordInput, 'Password123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
    })
  })

  it('shows validation error for short first name', async () => {
    const user = userEvent.setup()
    render(<RegisterPage />)
    
    const firstNameInput = screen.getByPlaceholderText('First name')
    const submitButton = screen.getByRole('button', { name: /create account/i })
    
    await user.type(firstNameInput, 'A')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('First name must be at least 2 characters')).toBeInTheDocument()
    })
  })

  it('shows validation error for weak password', async () => {
    const user = userEvent.setup()
    render(<RegisterPage />)
    
    const firstNameInput = screen.getByPlaceholderText('First name')
    const lastNameInput = screen.getByPlaceholderText('Last name')
    const emailInput = screen.getByPlaceholderText('your@company.com')
    const passwordInput = screen.getByPlaceholderText('Create password')
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm password')
    const submitButton = screen.getByRole('button', { name: /create account/i })
    
    await user.type(firstNameInput, 'John')
    await user.type(lastNameInput, 'Doe')
    await user.type(emailInput, 'john@example.com')
    await user.type(passwordInput, 'weak')
    await user.type(confirmPasswordInput, 'weak')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument()
    })
  })

  it('shows validation error for password without required characters', async () => {
    const user = userEvent.setup()
    render(<RegisterPage />)
    
    const firstNameInput = screen.getByPlaceholderText('First name')
    const lastNameInput = screen.getByPlaceholderText('Last name')
    const emailInput = screen.getByPlaceholderText('your@company.com')
    const passwordInput = screen.getByPlaceholderText('Create password')
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm password')
    const submitButton = screen.getByRole('button', { name: /create account/i })
    
    await user.type(firstNameInput, 'John')
    await user.type(lastNameInput, 'Doe')
    await user.type(emailInput, 'john@example.com')
    await user.type(passwordInput, 'weakpassword')
    await user.type(confirmPasswordInput, 'weakpassword')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Password must contain at least one uppercase letter, one lowercase letter, and one number')).toBeInTheDocument()
    })
  })

  it('shows validation error when passwords do not match', async () => {
    const user = userEvent.setup()
    render(<RegisterPage />)
    
    const firstNameInput = screen.getByPlaceholderText('First name')
    const lastNameInput = screen.getByPlaceholderText('Last name')
    const emailInput = screen.getByPlaceholderText('your@company.com')
    const passwordInput = screen.getByPlaceholderText('Create password')
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm password')
    const submitButton = screen.getByRole('button', { name: /create account/i })
    
    await user.type(firstNameInput, 'John')
    await user.type(lastNameInput, 'Doe')
    await user.type(emailInput, 'john@example.com')
    await user.type(passwordInput, 'Password123')
    await user.type(confirmPasswordInput, 'DifferentPassword123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText("Passwords don't match")).toBeInTheDocument()
    })
  })

  it('calls registration API with correct data on successful validation', async () => {
    const user = userEvent.setup()
    mockedAxios.post.mockResolvedValue({ status: 201 })
    
    render(<RegisterPage />)
    
    await fillRegisterForm(user)
    await user.click(screen.getByRole('button', { name: /create account/i }))
    
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/auth\/register\/?$/),
        expect.objectContaining({
          email: 'john@example.com',
          password: 'Password123',
        })
      )
    })
  })

  it('shows error message when registration fails', async () => {
    const user = userEvent.setup()
    mockedAxios.post.mockRejectedValue({
      response: {
        data: {
          detail: 'Email already exists'
        }
      }
    })
    
    render(<RegisterPage />)
    
    await fillRegisterForm(user)
    await user.click(screen.getByRole('button', { name: /create account/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument()
    })
  })

  it('shows loading state during form submission', async () => {
    const user = userEvent.setup()
    const pending = new Promise((resolve) => {
      setTimeout(() => resolve({ status: 201 }), 1000)
    })
    mockedAxios.post.mockReturnValue(pending as any)
    
    render(<RegisterPage />)
    
    await fillRegisterForm(user)
    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(submitButton).toBeDisabled()
    })
  })
})
