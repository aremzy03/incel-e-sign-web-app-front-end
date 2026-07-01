import apiClient from '@/lib/axios'
import { logger } from '@/lib/logger'
import { getCurrentFileUrl } from '@/lib/url'
import {
  normalizeDocumentsWithPositionsForApi,
  normalizeSignerPositionEntries,
} from '@/lib/utils/field-geometry'

export interface EnvelopeDetail {
  id: number | string
  name?: string
  status: string
  subject?: string
  message?: string
}

import { ApiResponse, PaginatedResponse } from '@/types/api'

export interface EnvelopeRecipient {
  id: string
  email: string
  name: string
  order: number
  status: 'pending' | 'signed' | 'rejected'
  signed_at?: string
  rejected_at?: string
}

export interface EnvelopeSignature {
  id: string
  signer: string
  signer_email: string
  signer_name: string
  status: 'pending' | 'processing' | 'signed' | 'rejected'
  signing_order: number
  signed_at?: string
  signature_image?: string
  created_at: string
  updated_at: string
}

export interface EnvelopeSigningOrderEntry {
  signer_id: string
  order: number
  signer_name?: string
  name?: string
  email?: string
}

export interface EnvelopeCurrentSigner {
  id: string
  name: string
  email: string
}

export interface Envelope {
  id: string
  name?: string
  description?: string | null
  pdf_lock_password?: string | null
  creator: {
    id: string
    email: string
    full_name: string
  }
  /** Present on list responses from GET /envelopes/ */
  creator_name?: string
  signer_count?: number
  current_signer?: EnvelopeCurrentSigner | null
  signing_order?: EnvelopeSigningOrderEntry[]
  recipients: EnvelopeRecipient[]
  signatures?: EnvelopeSignature[]
  documents_with_positions?: DocumentWithPositions[]
  // Optional: some responses may inline associated documents
  documents?: Array<{
    id: string
    file_name?: string
    file_url?: string
    signer_document_positions?: Array<{ signer_id: string; position: Position }>
  }>
  status: 'draft' | 'pending' | 'completed' | 'rejected' | 'self-sign'
  is_self_sign?: boolean
  decline_message?: string
  fields?: Array<{
    id?: string
    document_id?: string
    assigned_signer?: string
    type?: string
    [key: string]: unknown
  }>
  created_at: string
  updated_at: string
  sent_at?: string
  completed_at?: string
  rejected_at?: string
}

export interface Position {
  page: number
  x: number
  y: number
  width: number
  height: number
}

export interface SignerDocumentPosition {
  signer_id: string
  position: Position
}

export interface DocumentWithPositions {
  document_id: string
  signer_document_positions: SignerDocumentPosition[]
}

/** Normalize recipients from either `recipients` or `signing_order`, enriched with signature metadata. */
export function normalizeEnvelopeRecipients(raw: {
  recipients?: unknown
  signing_order?: unknown
  signatures?: EnvelopeSignature[]
}): EnvelopeRecipient[] {
  const signatures = Array.isArray(raw.signatures) ? raw.signatures : []

  const fromList = (list: unknown[]): EnvelopeRecipient[] =>
    list.map((entry, idx) => {
      const s = entry as Record<string, unknown>
      const nestedSigner =
        s.signer && typeof s.signer === 'object'
          ? (s.signer as Record<string, unknown>)
          : null
      const signerId = String(
        s.signer_id ?? s.id ?? nestedSigner?.id ?? idx,
      )
      const sig = signatures.find(
        (item) =>
          String(item.signer) === signerId ||
          String((item as { signer_id?: string }).signer_id) === signerId,
      )

      return {
        id: signerId,
        email: String(
          s.email ??
            nestedSigner?.email ??
            sig?.signer_email ??
            '',
        ),
        name: String(
          s.signer_name ??
            s.name ??
            s.full_name ??
            nestedSigner?.full_name ??
            nestedSigner?.name ??
            sig?.signer_name ??
            '',
        ),
        order: Number(s.order ?? idx + 1),
        status: (s.status ?? sig?.status ?? 'pending') as EnvelopeRecipient['status'],
        signed_at: (s.signed_at as string | undefined) ?? sig?.signed_at,
        rejected_at: s.rejected_at as string | undefined,
      }
    })

  if (Array.isArray(raw.recipients) && raw.recipients.length > 0) {
    return fromList(raw.recipients)
  }
  if (Array.isArray(raw.signing_order) && raw.signing_order.length > 0) {
    return fromList(raw.signing_order)
  }
  return []
}

/** Whether an envelope is a self-sign flow (by flag or status). */
export function isSelfSignEnvelope(
  env: Pick<Envelope, 'status' | 'is_self_sign'>,
): boolean {
  const status = env.status?.toLowerCase().replace(/_/g, '-') ?? ''
  return Boolean(env.is_self_sign) || status === 'self-sign' || status.includes('self-sign')
}

/** Normalize a list-item from GET /envelopes/ into the shared Envelope shape. */
export function normalizeEnvelopeListItem(raw: Record<string, unknown>): Envelope {
  const creatorId =
    typeof raw.creator === 'object' && raw.creator !== null
      ? String((raw.creator as { id?: string }).id ?? '')
      : String(raw.creator ?? '')

  const creatorName = String(
    raw.creator_name ??
      (typeof raw.creator === 'object' && raw.creator !== null
        ? (raw.creator as { full_name?: string }).full_name
        : '') ??
      '',
  )

  const creatorEmail =
    typeof raw.creator === 'object' && raw.creator !== null
      ? String((raw.creator as { email?: string }).email ?? '')
      : String(raw.creator_email ?? '')

  const signingOrder: EnvelopeSigningOrderEntry[] = Array.isArray(raw.signing_order)
    ? raw.signing_order.map((entry, idx) => {
        const item = entry as Record<string, unknown>
        const nestedSigner =
          item.signer && typeof item.signer === 'object'
            ? (item.signer as Record<string, unknown>)
            : null
        return {
          signer_id: String(item.signer_id ?? item.id ?? nestedSigner?.id ?? idx),
          order: Number(item.order ?? idx + 1),
          signer_name: String(item.signer_name ?? '') || undefined,
          name: String(
            item.signer_name ??
              item.name ??
              item.full_name ??
              nestedSigner?.name ??
              nestedSigner?.full_name ??
              '',
          ) || undefined,
          email: String(
            item.email ?? nestedSigner?.email ?? '',
          ) || undefined,
        }
      })
    : []

  const signatures = Array.isArray(raw.signatures)
    ? (raw.signatures as EnvelopeSignature[])
    : []

  const currentSignerRaw = raw.current_signer
  const currentSigner: EnvelopeCurrentSigner | null =
    currentSignerRaw && typeof currentSignerRaw === 'object'
      ? {
          id: String((currentSignerRaw as { id?: string }).id ?? ''),
          name: String((currentSignerRaw as { name?: string }).name ?? ''),
          email: String((currentSignerRaw as { email?: string }).email ?? ''),
        }
      : null

  const enrichedSigningOrder = signingOrder.map((entry) => {
    const sig = signatures.find((s) => String(s.signer) === String(entry.signer_id))
    let next = { ...entry }

    if (currentSigner && String(entry.signer_id) === String(currentSigner.id)) {
      next = {
        ...next,
        name: next.name || currentSigner.name || undefined,
        email: next.email || currentSigner.email || undefined,
      }
    }

    if (sig) {
      next = {
        ...next,
        signer_name: next.signer_name || sig.signer_name || undefined,
        name: next.name || sig.signer_name || undefined,
        email: next.email || sig.signer_email || undefined,
      }
    }

    return next
  })

  const recipients = normalizeEnvelopeRecipients({ ...raw, signatures })

  return {
    id: String(raw.id ?? ''),
    name: raw.name as string | undefined,
    description: (raw.description as string | null | undefined) ?? null,
    pdf_lock_password:
      (raw.pdf_lock_password as string | null | undefined) ??
      (raw.pdf_lock_code as string | null | undefined) ??
      null,
    creator: {
      id: creatorId,
      email: creatorEmail,
      full_name: creatorName,
    },
    creator_name: creatorName,
    signer_count:
      typeof raw.signer_count === 'number'
        ? raw.signer_count
        : enrichedSigningOrder.length || recipients.length,
    current_signer: currentSigner,
    signing_order: enrichedSigningOrder,
    recipients,
    signatures,
    fields: Array.isArray(raw.fields) ? (raw.fields as Envelope['fields']) : undefined,
    decline_message: typeof raw.decline_message === 'string' ? raw.decline_message : undefined,
    documents: raw.documents as Envelope['documents'],
    status: (raw.status as Envelope['status']) || 'draft',
    is_self_sign: Boolean(raw.is_self_sign),
    created_at: String(raw.created_at ?? ''),
    updated_at: String(raw.updated_at ?? ''),
    sent_at: raw.sent_at as string | undefined,
    completed_at: raw.completed_at as string | undefined,
    rejected_at: raw.rejected_at as string | undefined,
  }
}

export interface CreateEnvelopeRequest {
  document_ids: string[]
  name?: string
  description?: string | null
  signing_order: Array<{
    signer_id: string
    order: number
  }>
  documents_with_positions: DocumentWithPositions[]
  /**
   * When true, backend will apply PDF password protection on completion.
   * Defaults to false when omitted.
   */
  pdf_password_protection_enabled?: boolean
}

export interface EditEnvelopeRequest {
  name?: string
  description?: string | null
  document_ids?: string[]
  signing_order?: Array<{
    signer_id: string
    order: number
  }>
  documents_with_positions?: DocumentWithPositions[]
}

export interface CreateEnvelopeResponse {
  id: string
  documents: Array<{
    id: string
    file_name: string
    file_url: string
    file_size: number
  }>
  creator: {
    id: string
    email: string
    full_name: string
  }
  recipients: EnvelopeRecipient[]
  status: string
  created_at: string
  description?: string | null
}

export interface EnvelopeDashboardMetrics {
  documents_signed: number
  pending_signatures: number
  active_envelopes: number
  completion_rate: number
}

export interface EnvelopeDashboardCounts {
  pending_my_signature: number
  pending_sent: number
  completed: number
  draft: number
}

export interface EnvelopeDashboardActivity {
  id: string
  action: string
  envelope_id: string | null
  envelope_name: string | null
  message: string
  created_at: string
}

export interface EnvelopeDashboard {
  metrics: EnvelopeDashboardMetrics
  counts: EnvelopeDashboardCounts
  action_required: Envelope[]
  recent_activity: EnvelopeDashboardActivity[]
}

export interface EnvelopesListResponse {
  count: number
  next: string | null
  previous: string | null
  results: Envelope[]
}

// Create a new envelope
export const createEnvelope = async (data: CreateEnvelopeRequest): Promise<CreateEnvelopeResponse> => {
  logger.debug('Creating envelope', { documentIds: data.document_ids?.length, signingOrder: data.signing_order?.length })
  
  try {
    const payload: CreateEnvelopeRequest = {
      ...data,
      documents_with_positions:
        normalizeDocumentsWithPositionsForApi(data.documents_with_positions) ??
        data.documents_with_positions,
    }
    logger.api('POST', '/envelopes/create/', payload)
    
    // Direct to backend API
    const response = await apiClient.post('/envelopes/create/', payload)
    logger.debug('Create envelope response received')
    
    // Normalize possible response wrappers
    const responseData = response.data
    const unwrapped = responseData?.data?.envelope || responseData?.data || responseData
    if (!unwrapped?.id) {
      logger.warn('Create envelope: unexpected response shape, missing id')
    }
    return unwrapped
  } catch (error: any) {
    logger.errorSafe(error, 'Create envelope failed')
    
    // Log detailed error info only in development
    if (error.response?.status === 400) {
      logger.debug('400 Bad Request details', {
        responseData: error.response?.data,
        requestData: data,
      })
    }
    
    throw error
  }
}

// Get all envelopes
export const getEnvelopes = async (
  page: number = 1,
  pageSize: number = 10,
  status?: string,
  search?: string,
  isSelfSign?: boolean,
): Promise<EnvelopesListResponse> => {
  const trimmedSearch = search?.trim()
  logger.debug('Fetching envelopes', { page, pageSize, status, search: trimmedSearch, isSelfSign })

  try {
    const response = await apiClient.get('/envelopes/', {
      params: {
        page,
        page_size: pageSize,
        ...(status ? { status } : {}),
        ...(trimmedSearch ? { search: trimmedSearch } : {}),
        ...(isSelfSign === true ? { is_self_sign: true } : {}),
        ...(isSelfSign === false ? { is_self_sign: false } : {}),
      },
    })
    
    logger.debug('Envelopes response received')
    const payload = response.data
    const unwrapped: any = (payload && payload.data) || payload

    let results: any[] = []
    let count = 0
    let next: string | null = null
    let previous: string | null = null

    if (Array.isArray(unwrapped)) {
      results = unwrapped
      count = unwrapped.length
    } else if (unwrapped && Array.isArray(unwrapped.results)) {
      results = unwrapped.results
      count = typeof unwrapped.count === 'number' ? unwrapped.count : results.length
      next = unwrapped.next ?? null
      previous = unwrapped.previous ?? null
    } else {
      logger.warn('Unexpected envelopes list shape, defaulting to empty list')
      results = []
      count = 0
    }

    // Normalize result items to Envelope shape consumed by UI
    const normalizedResults: Envelope[] = results.map((r: Record<string, unknown>) =>
      normalizeEnvelopeListItem(r),
    )

    return { count, next, previous, results: normalizedResults }
  } catch (error: any) {
    logger.errorSafe(error, 'Get envelopes failed')
    throw error
  }
}

// Get a specific envelope by ID
export const getEnvelope = async (id: string): Promise<Envelope> => {
  logger.debug('Fetching envelope', { id })

  try {
    const response = await apiClient.get(`/envelopes/${id}/`)
    const payload = response.data
    const raw = (payload && (payload.data?.envelope || payload.data)) || payload
    return normalizeEnvelopeListItem(raw as Record<string, unknown>)
  } catch (error: any) {
    logger.errorSafe(error, 'Get envelope failed')
    throw error
  }
}

export const getEnvelopeDashboard = async (): Promise<EnvelopeDashboard> => {
  const response = await apiClient.get('/envelopes/dashboard/')
  const payload = response.data
  const data = payload?.data ?? payload

  const metrics = data?.metrics ?? {}
  const counts = data?.counts ?? {}
  const actionRequired = Array.isArray(data?.action_required) ? data.action_required : []
  const recentActivity = Array.isArray(data?.recent_activity) ? data.recent_activity : []

  return {
    metrics: {
      documents_signed: metrics.documents_signed ?? 0,
      pending_signatures: metrics.pending_signatures ?? 0,
      active_envelopes: metrics.active_envelopes ?? 0,
      completion_rate: metrics.completion_rate ?? 0,
    },
    counts: {
      pending_my_signature: counts.pending_my_signature ?? 0,
      pending_sent: counts.pending_sent ?? 0,
      completed: counts.completed ?? 0,
      draft: counts.draft ?? 0,
    },
    action_required: actionRequired.map((item: Record<string, unknown>) =>
      normalizeEnvelopeListItem(item),
    ),
    recent_activity: recentActivity.map((item: Record<string, unknown>) => ({
      id: String(item.id ?? ''),
      action: String(item.action ?? ''),
      envelope_id: item.envelope_id != null ? String(item.envelope_id) : null,
      envelope_name: item.envelope_name != null ? String(item.envelope_name) : null,
      message: String(item.message ?? ''),
      created_at: String(item.created_at ?? ''),
    })),
  }
}

// Send an envelope
export const sendEnvelope = async (id: string): Promise<ApiResponse<Envelope>> => {
  logger.debug('Sending envelope', { id })
  
  try {
    const response = await apiClient.post(`/envelopes/${id}/send/`)
    logger.debug('Envelope sent successfully')
    return response.data
  } catch (error: any) {
    logger.errorSafe(error, 'Send envelope failed')
    throw error
  }
}

export interface EnvelopeDocumentResponse {
  id: string; // This is the ID of the document within the envelope context (association ID)
  document: string; // This is the actual document ID
  file_name: string;
  document_file_name: string;
  document_file_url: string; // This is the actual file URL for PDF viewer
  current_file_url?: string;
  signed_file_url?: string;
  document_signed_file_url?: string;
  file_url?: string;
  file_size: number;
  status: string;
  created_at: string;
  updated_at: string;
  signer_document_positions: Array<{
    signer_id: string;
    position: Position;
  }>;
}

export function normalizeEnvelopeDocumentEntry(doc: Record<string, unknown>): EnvelopeDocumentResponse {
  const documentId = String(doc.document ?? doc.id ?? '')
  return {
    ...doc,
    id: documentId,
    document: documentId,
    file_name: String(doc.document_file_name ?? doc.file_name ?? `Document ${documentId}`),
    document_file_name: String(doc.document_file_name ?? doc.file_name ?? `Document ${documentId}`),
    document_file_url: String(
      doc.document_file_url ?? getCurrentFileUrl(doc) ?? doc.file_url ?? '',
    ),
    signed_file_url:
      (doc.document_signed_file_url as string | undefined) ??
      (doc.signed_file_url as string | undefined) ??
      undefined,
    document_signed_file_url:
      (doc.document_signed_file_url as string | undefined) ??
      (doc.signed_file_url as string | undefined) ??
      undefined,
    signer_document_positions: normalizeSignerPositionEntries(
      (doc.signer_document_positions ?? doc.signer_positions ?? doc.positions ?? []) as Parameters<
        typeof normalizeSignerPositionEntries
      >[0],
    ),
  } as EnvelopeDocumentResponse
}

export function normalizeEnvelopeDocumentEntries(
  documents: unknown,
): EnvelopeDocumentResponse[] {
  if (!Array.isArray(documents)) return []
  return documents.map((doc) =>
    normalizeEnvelopeDocumentEntry(doc as Record<string, unknown>),
  )
}

// Get documents associated with an envelope
export const getEnvelopeDocuments = async (envelopeId: string): Promise<EnvelopeDocumentResponse[]> => {
  try {
    const response = await apiClient.get(`/envelopes/${envelopeId}/document/`);
    const payload = response.data;
    // Assuming the backend returns an array of documents directly or nested under a 'data' field
    const documents = (payload && payload.data) || payload;
    if (!Array.isArray(documents)) {
      logger.warn('getEnvelopeDocuments: unexpected response shape, expected array');
      return [];
    }
    logger.debug('Fetched documents for envelope', { envelopeId, count: documents.length });
    return normalizeEnvelopeDocumentEntries(documents);
  } catch (error: any) {
    logger.errorSafe(error, `Error fetching documents for envelope ${envelopeId}`)
    throw error
  }
}

// Edit an envelope (PATCH)
export const editEnvelope = async (
  id: string,
  data: EditEnvelopeRequest
): Promise<ApiResponse<Envelope>> => {
  logger.debug('Editing envelope', { id })
  
  try {
    const payload: EditEnvelopeRequest = {
      ...data,
      documents_with_positions: normalizeDocumentsWithPositionsForApi(
        data.documents_with_positions,
      ),
    }
    logger.api('PATCH', `/envelopes/${id}/edit/`, payload)
    const response = await apiClient.patch(`/envelopes/${id}/edit/`, payload)
    logger.debug('Envelope edited successfully')
    return response.data
  } catch (error: any) {
    logger.errorSafe(error, 'Edit envelope failed')
    throw error
  }
}

// Reject an envelope (creator cancels)
export const rejectEnvelope = async (id: string): Promise<ApiResponse<Envelope>> => {
  logger.debug('Rejecting envelope', { id })
  
  // Validate input
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Invalid envelope ID provided')
  }
  
  try {
    const response = await apiClient.post(`/envelopes/${id}/reject/`, {}, {
      timeout: 15000, // Increase timeout for reject operation
    })
    logger.debug('Envelope rejected successfully')
    return response.data
  } catch (error: any) {
    logger.errorSafe(error, 'Reject envelope failed')
    
    // Provide specific error messages based on status code
    if (error.response?.status === 400) {
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          'Invalid request. Please check the envelope ID and try again.'
      throw new Error(errorMessage)
    } else if (error.response?.status === 403) {
      throw new Error('You do not have permission to reject this envelope.')
    } else if (error.response?.status === 404) {
      throw new Error('Envelope not found. It may have already been processed.')
    } else if (error.response?.status === 500) {
      const serverMessage = error.response?.data?.detail || 
                           error.response?.data?.message || 
                           'Server error occurred while rejecting envelope.'
      throw new Error(`Server error: ${serverMessage}. Please try again or contact support.`)
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. Please try again.')
    } else if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail)
    } else if (error.response?.data?.message) {
      throw new Error(error.response.data.message)
    }
    
    throw error
  }
}

// Delete an envelope
export const deleteEnvelope = async (id: string): Promise<void> => {
  logger.debug('Deleting envelope', { id })
  
  try {
    await apiClient.delete(`/envelopes/${id}/delete/`)
    logger.debug('Envelope deleted successfully')
  } catch (error: any) {
    logger.errorSafe(error, 'Delete envelope failed')
    
    // Provide specific error messages based on status code
    if (error.response?.status === 404) {
      throw new Error('Envelope not found. It may have already been deleted.')
    } else if (error.response?.status === 403) {
      throw new Error('You do not have permission to delete this envelope.')
    } else if (error.response?.status === 500) {
      throw new Error('Server error occurred while deleting envelope. Please try again or contact support.')
    }
    
    throw error
  }
}
