import { resolveSigningDocumentUrl } from '@/lib/url'

const CDN = 'https://cdn.example.com/docs/file.pdf?Signature=abc'
const API = 'http://localhost:8000'

describe('resolveSigningDocumentUrl', () => {
  it('loads CloudFront URLs directly for token signing', () => {
    const url = resolveSigningDocumentUrl({
      directUrl: CDN,
      previewApiUrl: `${API}/api/documents/doc-1/preview/`,
      hasToken: true,
      token: 'signing-token',
      documentId: 'doc-1',
      apiBase: `${API}/api`,
      usePreviewFallback: false,
    })

    expect(url).toBe(CDN)
  })

  it('falls back to the public preview proxy after a direct fetch fails', () => {
    const url = resolveSigningDocumentUrl({
      directUrl: CDN,
      previewApiUrl: `${API}/api/documents/doc-1/preview/`,
      hasToken: true,
      token: 'signing token',
      documentId: 'doc-1',
      apiBase: `${API}/api`,
      usePreviewFallback: true,
    })

    expect(url).toBe(
      `${API}/api/documents/doc-1/preview-public/?token=${encodeURIComponent('signing token')}`,
    )
  })

  it('uses the public preview proxy when the file is still on the API host', () => {
    const url = resolveSigningDocumentUrl({
      directUrl: `${API}/media/file.pdf`,
      previewApiUrl: `${API}/api/documents/doc-1/preview/`,
      hasToken: true,
      token: 'signing-token',
      documentId: 'doc-1',
      apiBase: `${API}/api`,
      usePreviewFallback: false,
    })

    expect(url).toBe(`${API}/api/documents/doc-1/preview-public/?token=signing-token`)
  })

  it('uses the authenticated preview API when there is no signing token', () => {
    const previewApiUrl = `${API}/api/documents/doc-1/preview/`
    const url = resolveSigningDocumentUrl({
      directUrl: `${API}/media/file.pdf`,
      previewApiUrl,
      hasToken: false,
      documentId: 'doc-1',
      apiBase: `${API}/api`,
      usePreviewFallback: true,
    })

    expect(url).toBe(previewApiUrl)
  })
})
