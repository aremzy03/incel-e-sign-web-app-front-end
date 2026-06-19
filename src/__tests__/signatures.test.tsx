import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import SignaturesPage from '@/app/dashboard/signatures/page'
import EnvelopeSignPage from '@/app/dashboard/envelopes/[id]/sign/page'

jest.mock('next-auth/react', () => ({
  ...jest.requireActual('next-auth/react'),
  useSession: jest.fn(),
}))

const mockSession = {
  user: { id: 'user-1', email: 'test@example.com', name: 'Test User' },
  accessToken: 'mock-access-token',
}

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: '123' }),
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => ({
    get: jest.fn(() => null),
    has: jest.fn(() => false),
  }),
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

describe('Signatures integration', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => {
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }

  test('Upload reusable signature → appears in list', async () => {
    let listCalls = 0
    global.fetch = jest.fn(async (url, options) => {
      const method = options?.method || 'GET'
      if (url === '/api/signatures/user' && method === 'GET') {
        listCalls += 1
        const data = listCalls === 1
          ? []
          : [{ id: 1, name: 'my-sign', image_url: '/x.png', uploaded_at: new Date().toISOString() }]
        return { ok: true, json: async () => data } as Response
      }
      if (url === '/api/signatures/user' && method === 'POST') {
        return { ok: true, json: async () => ({ id: 1, name: 'my-sign', image_url: '/x.png', uploaded_at: new Date().toISOString() }) } as Response
      }
      return { ok: true, json: async () => ({}) } as Response
    })

    render(<SignaturesPage />, { wrapper })

    const file = new File([new Uint8Array([1, 2, 3])], 'my-sign.png', { type: 'image/png' })
    const input = await screen.findByLabelText(/choose file/i)
    await userEvent.upload(input, file)

    const uploadButton = screen.getByRole('button', { name: /upload signature/i })
    await userEvent.click(uploadButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/signatures/user', expect.objectContaining({ method: 'POST' }))
    })

    expect(await screen.findByText('my-sign')).toBeInTheDocument()
  })

  test('Sign page renders signature actions', async () => {
    require('next-auth/react').useSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    })

    const axios = require('axios')
    const mockApi = (axios.create as jest.Mock).mock.results[0]?.value || (axios.create as jest.Mock)()
    mockApi.get.mockResolvedValueOnce({
      data: { id: '123', status: 'pending', name: 'Test Envelope', signing_order: [] },
    })

    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => [{ id: 2, name: 'saved', image_url: '/x.png', uploaded_at: new Date().toISOString() }],
    })) as any

    render(<EnvelopeSignPage />, { wrapper })

    expect(await screen.findByText('Select Your Signature')).toBeInTheDocument()
    expect(await screen.findByText('Decline to Sign')).toBeInTheDocument()
  })
})
