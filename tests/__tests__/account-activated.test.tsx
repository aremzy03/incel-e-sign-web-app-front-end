import { render, screen } from '@testing-library/react'
import AccountActivatedPage from '@/app/(auth)/account-activated/page'

describe('AccountActivatedPage', () => {
  it('renders success message', () => {
    render(<AccountActivatedPage />)
    expect(screen.getByText('Account activated!')).toBeInTheDocument()
  })

  it('renders sign in CTA', () => {
    render(<AccountActivatedPage />)
    expect(screen.getByRole('link', { name: /sign in to get started/i })).toHaveAttribute('href', '/login')
  })
})
