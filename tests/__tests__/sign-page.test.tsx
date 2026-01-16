import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import EnvelopeSignPage from '@/app/dashboard/envelopes/[id]/sign/page'

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: '123' }),
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(() => null),
    has: jest.fn(() => false),
  })),
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
  getEnvelopeDetail: jest.fn().mockResolvedValue({ id: '123', status: 'pending', name: 'Test Envelope', signing_order: [], documents: [{ id: 'doc-1', document_file_url: '/doc.pdf', signer_document_positions: [] }] }),
  getEnvelopePdfUrl: jest.fn().mockResolvedValue('/doc.pdf'),
  getEnvelopeDocuments: jest.fn().mockResolvedValue([{ id: 'doc-1', document_file_url: '/doc.pdf' }]),
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
  const wrapper = ({ children }: { children: React.ReactNode }) => {
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }

  it('renders signature actions', async () => {
    const axios = require('axios')
    const mockApi = (axios.create as jest.Mock).mock.results[0]?.value || (axios.create as jest.Mock)()
    mockApi.get
      .mockResolvedValueOnce({ data: { id: '123', name: 'Test Envelope', signing_order: [], documents: [] } })
      .mockResolvedValueOnce({ data: [] })

    render(<EnvelopeSignPage />, { wrapper })
    expect(await screen.findByText('Select Your Signature')).toBeInTheDocument()
    expect(await screen.findByText('Decline to Sign')).toBeInTheDocument()
  })
})
