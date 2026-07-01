import { render, screen } from '@testing-library/react'
import NotFound from '@/app/not-found'

describe('NotFound', () => {
  it('renders 404 message', () => {
    render(<NotFound />)
    expect(screen.getByText('Error 404')).toBeInTheDocument()
    expect(screen.getByText('Lost your way?')).toBeInTheDocument()
  })

  it('renders navigation CTAs', () => {
    render(<NotFound />)
    expect(screen.getByRole('link', { name: /back to dashboard/i })).toHaveAttribute('href', '/dashboard')
    expect(screen.getByRole('link', { name: /contact support/i })).toBeInTheDocument()
  })
})
