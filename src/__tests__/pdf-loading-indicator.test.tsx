import { render, screen } from '@testing-library/react'
import { PdfLoadingIndicator } from '@/components/pdf/PdfLoadingIndicator'

describe('PdfLoadingIndicator', () => {
  it('renders the default label and status role', () => {
    render(<PdfLoadingIndicator />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading document…')
  })

  it('renders a custom label', () => {
    render(<PdfLoadingIndicator label="Loading envelope…" />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading envelope…')
  })
})
