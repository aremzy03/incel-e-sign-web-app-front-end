import apiClient from '@/lib/axios'
import type { TextFit } from '@/lib/pdf-edit/text-fit'
import { getCachedAccessToken } from '@/lib/auth-session-cache'

export interface Document {
  id: string
  file_name: string
  file_url: string
  /**
   * Backend-computed "best" URL (signed_file_url || file_url).
   * For completed docs this is typically a presigned (expiring) S3 URL.
   */
  current_file_url?: string
  /**
   * Latest signed output URL when present (may be /media/... during signing, https://... after completion).
   */
  signed_file_url?: string
  file_size: number
  status: 'draft' | 'sent' | 'completed' | 'rejected'
  created_at: string
  updated_at: string
}

export interface DocumentUploadResponse {
  status: string
  message: string
  data: {
    id: string
    file_name: string
    file_url: string
    current_file_url?: string
    signed_file_url?: string
    file_size: number
    status: string
    created_at: string
    updated_at: string
  }
}

export interface DocumentsListResponse {
  count: number
  next: string | null
  previous: string | null
  results: Document[]
}

export interface GetDocumentsParams {
  page?: number
  pageSize?: number
  status?: string
  search?: string
}

export function normalizeDocument(raw: unknown): Document {
  const payload = raw as Record<string, unknown> | null | undefined
  const doc = (payload?.data as Record<string, unknown> | undefined) ?? payload ?? {}
  const id = String(doc.id ?? doc.document_id ?? '')
  return {
    id,
    file_name: String(doc.file_name ?? doc.name ?? 'Document'),
    file_url: String(doc.file_url ?? doc.current_file_url ?? ''),
    current_file_url: typeof doc.current_file_url === 'string' ? doc.current_file_url : undefined,
    signed_file_url: typeof doc.signed_file_url === 'string' ? doc.signed_file_url : undefined,
    file_size: typeof doc.file_size === 'number' ? doc.file_size : 0,
    status: (doc.status as Document['status']) || 'draft',
    created_at: String(doc.created_at ?? ''),
    updated_at: String(doc.updated_at ?? ''),
  }
}

function normalizeDocumentsList(payload: unknown): DocumentsListResponse {
  const unwrapped: any = (payload as any)?.data ?? payload

  if (Array.isArray(unwrapped)) {
    return {
      count: unwrapped.length,
      next: null,
      previous: null,
      results: unwrapped,
    }
  }

  if (unwrapped && Array.isArray(unwrapped.results)) {
    return {
      count: typeof unwrapped.count === 'number' ? unwrapped.count : unwrapped.results.length,
      next: unwrapped.next ?? null,
      previous: unwrapped.previous ?? null,
      results: unwrapped.results,
    }
  }

  return { count: 0, next: null, previous: null, results: [] }
}

// Upload a new document
export const uploadDocument = async (
  file: File,
  onProgress?: (percent: number) => void,
): Promise<DocumentUploadResponse> => {
  console.log('=== uploadDocument called ===')
  console.log('File:', file.name, file.size, file.type)
  console.log('API Client baseURL:', apiClient.defaults.baseURL)
  console.log('Upload URL will be:', `${apiClient.defaults.baseURL}/documents/upload/`)

  const formData = new FormData()
  formData.append('file', file)

  console.log('FormData created, making request...')

  try {
    // Do NOT set Content-Type manually; let the browser set the multipart boundary
    const response = await apiClient.post('/documents/upload/', formData, {
      // Uploads (especially Word conversion) can exceed the default 30s client timeout.
      timeout: 120_000,
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          onProgress?.(Math.round((progressEvent.loaded * 100) / progressEvent.total))
        }
      },
    })
    console.log('Upload response received:', response.status)
    return response.data
  } catch (error) {
    console.error('Upload request failed:', error)
    throw error
  }
}

export const getDocuments = async (
  params: GetDocumentsParams = {},
): Promise<DocumentsListResponse> => {
  const { page = 1, pageSize = 20, status, search } = params
  const trimmedSearch = search?.trim()

  const response = await apiClient.get('/documents/', {
    params: {
      page,
      page_size: pageSize,
      ...(status ? { status } : {}),
      ...(trimmedSearch ? { search: trimmedSearch } : {}),
    },
  })

  return normalizeDocumentsList(response.data)
}

export interface MergeDocumentsResponse {
  status: string
  message: string
  data: {
    id: string
    file_url: string
    current_file_url?: string
    signed_file_url?: string
    name?: string
  }
}

// Merge multiple existing documents into a new single document
export const mergeDocuments = async (documentIds: string[], name?: string): Promise<Document> => {
  if (!Array.isArray(documentIds) || documentIds.length < 2) {
    throw new Error('At least two documents are required to merge')
  }

  const payload: { document_ids: string[]; name?: string } = { document_ids: documentIds }
  if (name && name.trim()) payload.name = name.trim()

  const response = await apiClient.post<MergeDocumentsResponse>('/documents/merge/', payload)
  const res = response.data
  const merged = res?.data

  return {
    id: merged.id,
    file_name: merged.name || 'Merged Document',
    file_url: merged.file_url,
    file_size: 0,
    status: 'draft',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

// Get a specific document by ID
export const getDocument = async (id: string): Promise<Document> => {
  try {
    console.log('Fetching document with ID:', id);
    const response = await apiClient.get(`/documents/${id}/`);
    const payload = response.data;
    const doc: any = (payload && payload.data) || payload;
    console.log('Document fetched successfully:', doc);
    return normalizeDocument(doc);
  } catch (error: any) {
    console.warn('Error fetching document:', id, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      baseURL: error.config?.baseURL,
    });
    throw error;
  }
}

// Delete a document
export const deleteDocument = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/documents/${id}/delete/`)
  } catch (error: any) {
    // Handle 404 as success for delete operations (document already deleted)
    if (error.response?.status === 404) {
      console.log('Document already deleted (404 response)')
      return // Treat as success
    }
    
    // Enhanced error handling for other errors
    const responseData = error.response?.data
    if (typeof responseData === 'string' && responseData.includes('<!DOCTYPE html>')) {
      throw new Error('Server error occurred while deleting document. Please try again or contact support.')
    }
    
    // Provide specific error messages based on status code
    if (error.response?.status === 405) {
      throw new Error('Document deletion is not supported by the backend. Please contact the administrator.')
    } else if (error.response?.status === 500) {
      throw new Error('Server error occurred while deleting document. Please try again or contact support.')
    } else if (error.response?.status === 403) {
      throw new Error('You do not have permission to delete this document.')
    }
    
    throw error
  }
}

// Download a document
export const downloadDocument = async (id: string): Promise<Blob> => {
  // Use Next proxy so browser downloads are resilient to backend 302→S3 redirects (and CORS),
  // and so we don't depend on presigned URL timing.
  const accessToken = getCachedAccessToken() ?? undefined

  // NOTE: Do NOT include trailing slash here. Next route handlers under `/api/proxy/[...path]`
  // do not require it, and the trailing slash can trigger a 308 redirect. Some browsers
  // have been observed to surface redirected binary downloads as `TypeError: Failed to fetch`.
  const res = await fetch(`/api/proxy/documents/${id}/download`, {
    method: 'GET',
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  })

  if (!res.ok) {
    // Try to surface backend error message (json or text)
    let detail = ''
    try {
      const ct = res.headers.get('content-type') || ''
      if (ct.includes('application/json')) {
        const j: any = await res.json()
        detail = j?.detail || j?.message || JSON.stringify(j)
      } else {
        detail = await res.text()
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(detail || `Download failed (${res.status})`)
  }

  return await res.blob()
}

export interface PdfPageSize {
  page: number
  width: number
  height: number
  rotate: number
}

export interface AddTextOp {
  opId: string
  op: 'add_text'
  page: number
  x: number
  y: number
  width: number
  height: number
  text: string
  font: 'Helvetica' | 'Times-Roman' | 'Courier'
  fontSize: number
  color: string
  bold: boolean
  italic: boolean
  align: 'left' | 'center' | 'right'
}

/**
 * Replace (or, with empty `text`, delete) a run of text already in the PDF.
 * Geometry is PDF user space with a bottom-left origin (plan-full-text-rewrite §5).
 */
export interface EditTextOp {
  opId: string
  op: 'edit_text'
  page: number
  text: string
  fontSize: number
  color: string
  /** The run's font name as the PDF names it (subset prefix allowed), informational. */
  fontName: string
  baseline: { x: number; y: number }
  /** The tight glyph box the server deletes. */
  remove: { x: number; y: number; width: number; height: number }
  originalText: string
  fallbackFont: 'LiberationSans' | 'LiberationSerif' | 'LiberationMono' | null
  /** The slot the replacement is fitted into (shrunk, wrapped or realigned); absent on older drafts. */
  fit?: TextFit
}

export type TextSessionOp = AddTextOp | EditTextOp

export const isEditTextOp = (op: TextSessionOp): op is EditTextOp => op.op === 'edit_text'
export const isAddTextOp = (op: TextSessionOp): op is AddTextOp => op.op === 'add_text'

export interface TextEditSession {
  session_id: string
  base_file_url: string
  page_count: number
  pages: PdfPageSize[]
  ops: TextSessionOp[]
  updated_at: string | null
  /** False when the server can't rewrite existing text: offer add-text only. */
  rewrite?: boolean
  limits?: { max_runs_per_page: number; min_font_size: number }
  /** Per page (index 0 = page 1): the colour and style of each text span, for the editor preview. */
  text_styles?: TextStyleSpan[][] | null
  /** Per page: borders as [0, x, y0, y1] (vertical) or [1, y, x0, x1] (horizontal), user space. */
  text_rules?: [number, number, number, number][][] | null
}

/** [x0, y0, x1, y1, '#rrggbb', bold, italic, fontName, previewFontId]: box in PDF user space (bottom-left origin). */
export type TextStyleSpan = [number, number, number, number, string, boolean, boolean, string, (string | null)?]

export interface TextEditWarning {
  opId: string
  code: 'font_replaced' | 'style_replaced' | string
  font?: string
}

export interface TextEditCommitResult {
  document_id: string
  file_url: string
  file_size: number
  revision_id: string | null
  session_id: string
  warnings?: TextEditWarning[]
}

function unwrapData<T>(payload: unknown): T {
  const record = payload as { data?: T }
  return (record?.data ?? payload) as T
}

/**
 * One embedded font program from the document's current file (TrueType/OpenType bytes),
 * for previewing typed text. `version` (the file URL) keys the browser cache: ids change on save.
 */
export const fetchTextEditFont = async (id: string, fontId: string, version: string): Promise<ArrayBuffer> => {
  const response = await apiClient.get<ArrayBuffer>(`/documents/${id}/text-edits/fonts/${encodeURIComponent(fontId)}/`, {
    params: { v: version },
    responseType: 'arraybuffer',
  })
  return response.data
}

export const openTextEditSession = async (id: string): Promise<TextEditSession> => {
  const response = await apiClient.post(`/documents/${id}/text-edits/`, {}, { timeout: 60_000 })
  return unwrapData<TextEditSession>(response.data)
}

export const saveTextEditSession = async (id: string, ops: TextSessionOp[]): Promise<TextEditSession> => {
  const response = await apiClient.put(`/documents/${id}/text-edits/`, { ops })
  return unwrapData<TextEditSession>(response.data)
}

export const commitTextEdits = async (id: string, ops: TextSessionOp[]): Promise<TextEditCommitResult> => {
  const response = await apiClient.post(`/documents/${id}/text-edits/commit/`, { ops }, { timeout: 120_000 })
  return unwrapData<TextEditCommitResult>(response.data)
}

export const discardTextEditSession = async (id: string): Promise<void> => {
  await apiClient.delete(`/documents/${id}/text-edits/`)
}

export function textEditErrorCopy(error: unknown): { reason: string; message: string; opIds: string[] } {
  const data = (
    error as {
      response?: {
        data?: { reason?: string; message?: string; opIds?: string[]; errors?: Array<{ opId?: string | null; reason?: string }> }
      }
    }
  )?.response?.data
  // Validation failures come back as a list of {opId, reason}.
  const firstError = data?.errors?.[0]
  const reason = data?.reason || firstError?.reason || 'unknown'
  const opIds = data?.opIds ?? (data?.errors ?? []).map((e) => e.opId).filter((id): id is string => !!id)
  return {
    reason,
    message: data?.message || TEXT_EDIT_REASON_COPY[reason] || 'Couldn’t save the text. Try again.',
    opIds,
  }
}

const TEXT_EDIT_REASON_COPY: Record<string, string> = {
  rewrite_failed: 'Couldn’t replace the text on the page. The file was not changed.',
  box_covers_other_text: 'This edit would remove text on another line. Undo it and pick the word again.',
  rotated_text: 'Rotated text can’t be edited.',
  unsupported_character: 'No available font can draw one of the characters you typed.',
  boxes_overlap: 'Two edits overlap. Undo one of them.',
  invalid_fit: 'An edit’s layout is invalid. Undo it and edit the text again.',
  rewrite_unavailable: 'Editing existing text isn’t available right now.',
}
