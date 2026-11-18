import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import SelfSignPage from '@/app/dashboard/envelopes/self-sign/page'
import { buildSelfSignPayload, getSelfSignValidationErrors } from '@/hooks/useSelfSignFields'
import { defaultFieldSettings } from '@/lib/fields/stamps'
import type { FieldPosition } from '@/types/envelope'

const mockPush = jest.fn()
const mockReplace = jest.fn()
const selfSignAsync = jest.fn()
const listUserSignatures = jest.fn()
const getDocuments = jest.fn()

jest.mock('@/lib/api/documents', () => {
  const actual = jest.requireActual('@/lib/api/documents')
  return { ...actual, getDocuments: (...args: unknown[]) => getDocuments(...args) }
})

jest.mock('@/lib/axios', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: jest.fn(() => ({
    get: jest.fn((key: string) => {
      if (key === 'step') return 'editor'
      return null
    }),
  })),
}))

jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { id: 'user-1', name: 'Test User', email: 'test@example.com', full_name: 'Test User' } },
    status: 'authenticated',
  }),
}))

jest.mock('@/hooks/useProfile', () => ({
  useProfile: () => ({ data: null }),
}))

jest.mock('@/hooks/useEnvelopes', () => ({
  useSelfSignEnvelope: () => ({
    mutateAsync: selfSignAsync,
    isPending: false,
  }),
}))

jest.mock('@/components/signing/signing-job-background-watcher', () => ({
  SigningJobBackgroundWatcher: () => null,
}))

jest.mock('@/lib/api/signatures', () => {
  const actual = jest.requireActual('@/lib/api/signatures')
  return {
    ...actual,
    listUserSignatures: (...args: unknown[]) => listUserSignatures(...args),
  }
})

jest.mock('next/dynamic', () => () => {
  const Dynamic = () => <div data-testid="pdf-viewer" />
  Dynamic.displayName = 'DynamicPDFViewer'
  return Dynamic
})

describe('SelfSignPage (document picker)', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>
      {children}
    </QueryClientProvider>
  )

  beforeEach(() => {
    jest.clearAllMocks()
    getDocuments.mockResolvedValue({
      results: [{ id: 'doc-7', file_name: 'Lease.pdf', created_at: '2026-11-01T00:00:00Z' }],
    })
  })

  it('lists documents and opens the edit-and-sign screen for the one picked', async () => {
    const { useSearchParams } = require('next/navigation')
    useSearchParams.mockReturnValue({ get: jest.fn(() => null) })
    render(<SelfSignPage />, { wrapper })
    expect(screen.getByText('Add text or sign a document')).toBeInTheDocument()
    const doc = await screen.findByRole('button', { name: /lease\.pdf/i })
    doc.click()
    expect(mockPush).toHaveBeenCalledWith('/dashboard/documents/doc-7/edit?tools=sign')
  })

  it('sends old ?documentId= links straight to the editor', async () => {
    const { useSearchParams } = require('next/navigation')
    useSearchParams.mockReturnValue({ get: jest.fn((key: string) => (key === 'documentId' ? 'doc-9' : null)) })
    render(<SelfSignPage />, { wrapper })
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/dashboard/documents/doc-9/edit?tools=sign'))
  })
})

describe('self-sign fields', () => {
  const field = (over: Partial<FieldPosition>): FieldPosition => ({
    id: 'f', type: 'signature', page: 1, x: 120, y: 240, width: 120, height: 48, assignedTo: '1', documentId: 'doc-1',
    ...over,
  })

  it('needs a signature and rejects retired text fields', () => {
    expect(getSelfSignValidationErrors({})).toContain('Add at least one signature field')
    expect(getSelfSignValidationErrors({ s: field({}), t: field({ id: 't', type: 'text' }) }).join(' ')).toMatch(/Add text/)
    expect(getSelfSignValidationErrors({ s: field({}), d: field({ id: 'd', type: 'date', ...defaultFieldSettings('date') }) })).toEqual([])
  })

  it('builds a payload where the server fills date and initials', () => {
    const payload = buildSelfSignPayload(
      {
        s: field({}),
        i: field({ id: 'i', type: 'initials', prefill_value: 'ZZ', ...defaultFieldSettings('initials') }),
        d: field({ id: 'd', type: 'date', prefill_value: '1999-01-01', ...defaultFieldSettings('date') }),
      },
      {
        documentId: 'doc-1',
        signatureId: 'sig-1',
        initialsChoice: { style: 'last_name', font: 'allura' },
      },
    )
    expect(payload.document_ids).toEqual(['doc-1'])
    expect(payload.documents_with_positions?.[0].signer_document_positions).toHaveLength(1)
    expect(payload.signature_id).toBe('sig-1')
    expect(payload.initials_style).toBe('last_name')
    expect(payload.initials_font).toBe('allura')
    expect(payload.timezone).toBeTruthy()
    for (const f of payload.fields ?? []) {
      expect(f).not.toHaveProperty('value')
      expect(f).not.toHaveProperty('prefill_value')
    }
    // Fields are stored in points already.
    expect(payload.fields?.[0]).toMatchObject({ type: 'initials', x: 120, y: 240 })
  })
})

describe('selfSignEnvelope API', () => {
  it('returns queued job on 202', async () => {
    const apiClient = (await import('@/lib/axios')).default
    ;(apiClient.post as jest.Mock).mockResolvedValue({
      status: 202,
      data: {
        data: { job_id: 'job-1', status: 'queued', envelope_id: 'env-1' },
      },
    })
    const { selfSignEnvelope } = await import('@/lib/api/signatures')
    const payload = {
      document_ids: ['doc-1'],
      signature_id: 'sig-1',
      pdf_password_protection_enabled: false,
      documents_with_positions: [{
        document_id: 'doc-1',
        signer_document_positions: [{ position: { page: 1, x: 10, y: 20, width: 100, height: 40 } }],
      }],
    }
    const result = await selfSignEnvelope(payload)
    expect(apiClient.post).toHaveBeenCalledWith(
      '/signatures/self-sign/',
      expect.objectContaining({
        document_ids: ['doc-1'],
        documents_with_positions: payload.documents_with_positions,
      }),
    )
    expect(result).toEqual({
      kind: 'queued',
      data: { job_id: 'job-1', status: 'queued', envelope_id: 'env-1' },
    })
    expect(JSON.stringify(payload)).not.toContain('signing_order')
  })

  it('returns backend message from 400 responses via thrown error shape', async () => {
    const apiClient = (await import('@/lib/axios')).default
    const error = { response: { status: 400, data: { message: 'Signature placement is required' } } }
    ;(apiClient.post as jest.Mock).mockRejectedValue(error)
    const { selfSignEnvelope } = await import('@/lib/api/signatures')
    await expect(selfSignEnvelope({ document_ids: ['doc-1'], signature_id: 'sig-1' })).rejects.toEqual(error)
  })
})
