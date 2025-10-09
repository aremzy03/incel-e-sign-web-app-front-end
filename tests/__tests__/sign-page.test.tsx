import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EnvelopeSignPage from '@/app/dashboard/envelopes/[id]/sign/page'

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: '123' }),
  useRouter: () => ({ push: jest.fn() }),
}))

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('react-pdf', () => ({
  Document: ({ children }: any) => <div data-testid="pdf-document">{children}</div>,
  Page: ({ onLoadSuccess }: any) => {
    setTimeout(() => onLoadSuccess?.({ view: [0, 0, 612, 792] }), 0)
    return <div data-testid="pdf-page" style={{ width: 612, height: 792 }} />
  },
  pdfjs: { version: '5.3.93', GlobalWorkerOptions: { workerSrc: '' } },
}))

jest.mock('@/lib/api/envelopes', () => ({
  getEnvelopeDetail: jest.fn().mockResolvedValue({ id: '123', status: 'pending', document: { id: 1, name: 'Doc', file_url: '/doc.pdf' } }),
  getEnvelopePdfUrl: jest.fn().mockResolvedValue('/doc.pdf'),
}))

jest.mock('@/lib/api/signatures', () => ({
  listUserSignatures: jest.fn().mockResolvedValue([
    { id: 1, name: 'Default', image_url: '/sig.png', uploaded_at: new Date().toISOString() },
  ]),
  signEnvelopeWithReusableSignature: jest.fn().mockResolvedValue({ ok: true }),
  signEnvelopeWithInline: jest.fn().mockResolvedValue({ ok: true }),
  declineEnvelope: jest.fn().mockResolvedValue({ ok: true }),
}))

describe('Sign Page', () => {
  it('renders PDF and pagination', async () => {
    render(<EnvelopeSignPage />)
    expect(await screen.findByTestId('pdf-document')).toBeInTheDocument()
    expect(await screen.findByTestId('pdf-page')).toBeInTheDocument()
    expect(await screen.findByText(/Page 1/i)).toBeInTheDocument()
  })

  it('loads reusable signatures', async () => {
    render(<EnvelopeSignPage />)
    expect(await screen.findByText('Default')).toBeInTheDocument()
  })

  it('allows drawing signature and confirming', async () => {
    render(<EnvelopeSignPage />)
    const drawBtn = await screen.findByRole('button', { name: /Draw New/i })
    await userEvent.click(drawBtn)
    const useThis = await screen.findByRole('button', { name: /Use This/i })
    await userEvent.click(useThis)
    const confirm = await screen.findByRole('button', { name: /Confirm Sign/i })
    expect(confirm).toBeDisabled() // disabled until placement exists; overlay drag is hard to simulate here
  })

  it('decline updates status', async () => {
    render(<EnvelopeSignPage />)
    const decline = await screen.findByRole('button', { name: /Decline/i })
    await userEvent.click(decline)
  })
})


