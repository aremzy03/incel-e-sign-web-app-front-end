import apiClient from '@/lib/axios'
import type { DocumentWithPositions, EnvelopeSignature, Position } from '@/lib/api/envelopes'
import {
  FrozenEnvelopeError,
  SigningApiError,
  SigningRequestTimeoutError,
} from '@/lib/api/signing-errors'
import { isLoggingEnabled } from '@/lib/env'
import {
  ensurePdfPointsPosition,
  normalizeDocumentsWithPositionsForApi,
} from '@/lib/utils/field-geometry'
import type { AxiosError } from 'axios'

export type SigningJobStatus = 'queued' | 'processing' | 'succeeded' | 'failed'

export interface SignJobQueuedData {
  job_id: string
  status: SigningJobStatus
  envelope_id: string
}

export interface SigningJobDetail {
  id: string
  status: SigningJobStatus
  envelope_id: string
  signer_id: string
  error_message: string
  attempt_count: number
  created_at: string
  completed_at: string | null
  envelope_status: string
  signature: EnvelopeSignature | null
}

export type SignEnvelopePayload = {
  signature_image?: string
  signature_id?: string
  page?: number
  x?: number
  y?: number
  width?: number
  height?: number
}

export type SignEnvelopeResult =
  | { kind: 'queued'; data: SignJobQueuedData }
  | { kind: 'already_signed'; signature: EnvelopeSignature }

/** Sign enqueue should return quickly; worker handles heavy PDF/S3 work. */
export const SIGNING_API_TIMEOUT_MS = 30_000

function isAxiosTimeout(error: unknown): boolean {
  const axiosError = error as AxiosError
  return axiosError?.code === 'ECONNABORTED' || axiosError?.message?.toLowerCase().includes('timeout') === true
}

function unwrapApiData<T>(payload: unknown): T {
  const body = payload as { data?: T }
  return (body?.data ?? payload) as T
}

function parseApiErrorMessage(payload: unknown, fallback: string): string {
  const body = payload as { message?: string; detail?: string }
  return body?.message?.trim() || body?.detail?.trim() || fallback
}

/** Strip undefined fields and enforce one signature source for POST /signatures/{envelope_id}/sign/. */
export function buildSignEnvelopePayload(payload: SignEnvelopePayload): SignEnvelopePayload {
  const hasImage = typeof payload.signature_image === 'string' && payload.signature_image.trim() !== ''
  const hasSavedId = typeof payload.signature_id === 'string' && payload.signature_id.trim() !== ''

  if (hasImage && hasSavedId) {
    throw new SigningApiError(
      'Provide either signature_image or signature_id, not both.',
      400,
    )
  }

  const cleaned: SignEnvelopePayload = {}
  if (hasImage) cleaned.signature_image = payload.signature_image!.trim()
  if (hasSavedId) cleaned.signature_id = payload.signature_id!.trim()

  if (typeof payload.page === 'number' && Number.isFinite(payload.page) && payload.page >= 1) {
    cleaned.page = payload.page
  }
  if (typeof payload.x === 'number' && Number.isFinite(payload.x)) cleaned.x = payload.x
  if (typeof payload.y === 'number' && Number.isFinite(payload.y)) cleaned.y = payload.y
  if (typeof payload.width === 'number' && Number.isFinite(payload.width) && payload.width >= 1) {
    cleaned.width = payload.width
  }
  if (typeof payload.height === 'number' && Number.isFinite(payload.height) && payload.height >= 1) {
    cleaned.height = payload.height
  }

  return cleaned
}

export async function signEnvelope(
  envelopeId: string | number,
  payload: SignEnvelopePayload = {},
): Promise<SignEnvelopeResult> {
  const resolvedEnvelopeId = String(envelopeId).trim()
  if (!resolvedEnvelopeId) {
    throw new SigningApiError('Missing envelope id.', 400)
  }

  const requestPayload = buildSignEnvelopePayload(payload)
  const requestUrl = `/api/signatures/${encodeURIComponent(resolvedEnvelopeId)}/sign`

  if (isLoggingEnabled()) {
    console.info('[signEnvelope] POST', requestUrl, requestPayload)
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), SIGNING_API_TIMEOUT_MS)

  try {
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      cache: 'no-store',
      body: JSON.stringify(requestPayload),
      signal: controller.signal,
    })

    let data: unknown
    try {
      data = await response.json()
    } catch {
      throw new SigningApiError('Server returned an invalid response.', response.status)
    }

    if ((data as { status?: string })?.status === 'error') {
      const message = parseApiErrorMessage(data, 'Signing failed')
      if (response.status === 409) {
        throw new FrozenEnvelopeError(message)
      }
      throw new SigningApiError(message, response.status, (data as { data?: unknown }).data)
    }

    if (response.status === 409) {
      throw new FrozenEnvelopeError(
        parseApiErrorMessage(
          data,
          'Envelope frozen for system upgrade. Ask the creator to resend.',
        ),
      )
    }

    if (response.status === 200) {
      const signature = unwrapApiData<EnvelopeSignature>(data)
      return { kind: 'already_signed', signature }
    }

    if (response.status !== 202) {
      throw new SigningApiError(
        parseApiErrorMessage(data, `Unexpected sign response status: ${response.status}`),
        response.status,
        (data as { data?: unknown }).data,
      )
    }

    const queued = unwrapApiData<SignJobQueuedData>(data)
    return { kind: 'queued', data: queued }
  } catch (error) {
    if (error instanceof FrozenEnvelopeError || error instanceof SigningApiError) {
      throw error
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new SigningRequestTimeoutError()
    }
    if (isAxiosTimeout(error)) {
      throw new SigningRequestTimeoutError()
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function getSigningJob(jobId: string): Promise<SigningJobDetail> {
  const response = await apiClient.get(`/signatures/jobs/${jobId}/`)
  return unwrapApiData<SigningJobDetail>(response.data)
}

export async function retrySigningJob(jobId: string): Promise<SignJobQueuedData> {
  const response = await apiClient.post(`/signatures/jobs/${jobId}/retry/`, undefined, {
    timeout: SIGNING_API_TIMEOUT_MS,
  })
  if (response.status !== 202) {
    throw new Error(`Unexpected retry response status: ${response.status}`)
  }
  return unwrapApiData<SignJobQueuedData>(response.data)
}

export interface ReusableSignature {
  id: string
  name?: string
  image_url: string
  uploaded_at: string
  is_default?: boolean
}

export interface UploadSignatureResponse {
  status: 'success' | 'error'
  data?: ReusableSignature
  message?: string
}

/**
 * Helper to normalize raw backend signature payloads into ReusableSignature
 */
function mapToReusableSignature(item: any): ReusableSignature {
  const id = String(item.id)
  const imageUrl = item.image_url || item.image || ''
  const uploadedAt = item.uploaded_at || item.created_at || new Date().toISOString()
  const isDefault = Boolean(item.is_default)
  const name = item.name || (isDefault ? 'Default Signature' : 'Signature')
  return { id, name, image_url: imageUrl, uploaded_at: uploadedAt, is_default: isDefault }
}

export async function listUserSignatures(): Promise<ReusableSignature[]> {
  // Hit the documented Next.js API route which proxies to the backend
  // Use relative URL - Next.js will handle protocol automatically
  try {
    const response = await fetch('/api/signatures/user', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store', // Prevent browser from using cached redirects
    })

    if (!response.ok) {
      // Best-effort JSON parse for error details; fall back to empty list
      try {
        const errorData = await response.json()
        console.error('[listUserSignatures] Failed to fetch signatures:', errorData)
      } catch {
        console.error('[listUserSignatures] Failed to fetch signatures, status:', response.status)
      }
      return []
    }

    const data = await response.json()
    // Handle paginated response (results array) or direct array or nested data
    const raw = Array.isArray(data) 
      ? data 
      : (data?.results ?? data?.data ?? [])
    if (!Array.isArray(raw)) {
      console.warn('[listUserSignatures] Unexpected response format:', data)
      return []
    }
    return raw.map(mapToReusableSignature)
  } catch (error) {
    console.error('[listUserSignatures] Network error:', error)
    return []
  }
}

export async function uploadUserSignature(file: File, name?: string, isDefault?: boolean): Promise<ReusableSignature> {
  const formData = new FormData()
  // Backend expects 'image' field for the file
  formData.append('image', file)
  if (typeof isDefault === 'boolean') formData.append('is_default', String(isDefault))
  if (name) formData.append('name', name)

  // Use the documented Next.js API route which will forward multipart form-data
  // Use relative URL - Next.js will handle protocol automatically
  const response = await fetch('/api/signatures/user', {
    method: 'POST',
    body: formData,
    credentials: 'include',
    cache: 'no-store', // Prevent browser from using cached redirects
  })

  if (!response.ok) {
    let message = 'Failed to upload signature'
    try {
      const errData = await response.json()
      message = errData?.detail || errData?.message || message
      console.error('[uploadUserSignature] Error response:', errData)
    } catch {
      console.error('[uploadUserSignature] Failed with status:', response.status)
    }
    throw new Error(message)
  }

  const data = await response.json()
  const payload = (data?.data ?? data) as any
  return mapToReusableSignature(payload)
}

export async function deleteUserSignature(id: string): Promise<void> {
  // Use the documented Next.js API route which proxies DELETE to backend
  // Use relative URL - Next.js will handle protocol automatically
  const response = await fetch(`/api/signatures/user/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    cache: 'no-store', // Prevent browser from using cached redirects
  })

  if (!response.ok) {
    try {
      const errData = await response.json()
      console.error('[deleteUserSignature] Failed to delete signature:', errData)
    } catch {
      console.error('[deleteUserSignature] Failed to delete signature, status:', response.status)
    }
    throw new Error('Failed to delete signature')
  }
}

export interface SignaturePlacementPayload {
  signature_image?: string
  signature_id?: string
  page?: number
  x?: number
  y?: number
  width?: number
  height?: number
}

export async function signEnvelopeWithReusableSignature(
  envelopeId: string | number,
  signatureId: string,
  page: number,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  return signEnvelope(envelopeId, {
    signature_id: signatureId,
    page,
    x,
    y,
    width,
    height,
  })
}

export async function signEnvelopeWithInline(
  envelopeId: string | number,
  dataUrlPng: string,
  page: number,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  return signEnvelope(envelopeId, {
    signature_image: dataUrlPng,
    page,
    x,
    y,
    width,
    height,
  })
}

export async function declineEnvelope(envelopeId: string | number, declineMessage: string) {
  const response = await apiClient.post(`/signatures/${envelopeId}/decline/`, { decline_message: declineMessage })
  return response.data
}

export interface SelfSignRequest {
  document_ids: string[]
  name?: string
  description?: string | null
  documents_with_positions?: Array<{
    document_id: string
    signer_document_positions: Array<{ position: Position; signer_id?: string }>
  }>
  fields?: Array<Record<string, unknown>>
  signature_id?: string
  signature_image?: string
  pdf_password_protection_enabled?: boolean
}

export interface SelfSignResponse {
  id: string
  status: string
  is_self_sign: boolean
  pdf_lock_password?: string | null
  name?: string
}

export type SelfSignResult =
  | { kind: 'queued'; data: SignJobQueuedData }
  | { kind: 'already_signed'; signature: EnvelopeSignature }

export async function selfSignEnvelope(data: SelfSignRequest): Promise<SelfSignResult> {
  const payload: SelfSignRequest = {
    ...data,
    documents_with_positions: normalizeDocumentsWithPositionsForApi(
      data.documents_with_positions as DocumentWithPositions[] | undefined,
    ) as SelfSignRequest['documents_with_positions'],
    fields: data.fields?.map((field) => {
      const x = Number(field.x)
      const y = Number(field.y)
      const width = Number(field.width)
      const height = Number(field.height)
      const page = Number(field.page)
      if (![x, y, width, height, page].every(Number.isFinite)) {
        return field
      }
      const pdf = ensurePdfPointsPosition({ page, x, y, width, height })
      return {
        ...field,
        page: pdf.page,
        x: pdf.x,
        y: pdf.y,
        width: pdf.width,
        height: pdf.height,
      }
    }),
  }

  try {
    const response = await apiClient.post('/signatures/self-sign/', payload)

    if (response.status === 409) {
      throw new FrozenEnvelopeError(
        (response.data as { message?: string })?.message ||
          'Envelope frozen for system upgrade. Ask the creator to resend.',
      )
    }

    if (response.status !== 202) {
      throw new Error(`Unexpected self-sign response status: ${response.status}`)
    }

    const queued = unwrapApiData<SignJobQueuedData>(response.data)
    return { kind: 'queued', data: queued }
  } catch (error) {
    if (error instanceof FrozenEnvelopeError) {
      throw error
    }
    const axiosError = error as AxiosError<{ message?: string }>
    if (axiosError?.response?.status === 409) {
      throw new FrozenEnvelopeError(
        axiosError.response?.data?.message ||
          'Envelope frozen for system upgrade. Ask the creator to resend.',
      )
    }
    throw error
  }
}


