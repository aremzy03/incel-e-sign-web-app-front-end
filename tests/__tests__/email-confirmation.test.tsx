import { render, screen } from '@testing-library/react'
import EmailConfirmationPage from '@/app/(auth)/email-confirmation/page'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: jest.fn() }),
  useSearchParams: () => ({
    get: (key: string) => (key === 'email' ? 'user@example.com' : null),
  }),
}))

describe('EmailConfirmationPage', () => {
  it('renders confirmation message with email', () => {
    render(<EmailConfirmationPage />)
    expect(screen.getByText('Check your email')).toBeInTheDocument()
    expect(screen.getByText('user@example.com')).toBeInTheDocument()
  })

  it('renders back to login link', () => {
    render(<EmailConfirmationPage />)
    expect(screen.getByRole('link', { name: /back to login/i })).toHaveAttribute('href', '/login')
  })
})
