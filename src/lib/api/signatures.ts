import apiClient from '@/lib/axios'

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

export async function listUserSignatures(): Promise<ReusableSignature[]> {
  const response = await apiClient.get('/signatures/user/')
  const raw = Array.isArray(response.data) ? response.data : (response.data?.data ?? [])
  if (!Array.isArray(raw)) return []
  return raw.map((item: any) => {
    const id = String(item.id)
    const imageUrl = item.image_url || item.image || ''
    const uploadedAt = item.uploaded_at || item.created_at || new Date().toISOString()
    const isDefault = Boolean(item.is_default)
    const name = item.name || (isDefault ? 'Default Signature' : 'Signature')
    return { id, name, image_url: imageUrl, uploaded_at: uploadedAt, is_default: isDefault } as ReusableSignature
  })
}

export async function uploadUserSignature(file: File, name?: string, isDefault?: boolean): Promise<ReusableSignature> {
  const formData = new FormData()
  // Backend expects 'image' field for the file
  formData.append('image', file)
  if (typeof isDefault === 'boolean') formData.append('is_default', String(isDefault))
  if (name) formData.append('name', name)
  const response = await apiClient.post('/signatures/user/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return (response.data?.data ?? response.data) as ReusableSignature
}

export async function deleteUserSignature(id: string): Promise<void> {
  await apiClient.delete(`/signatures/user/${id}/`)
}

export interface SignaturePlacementPayload {
  signature_image?: string
  signature_id?: string
  page: number
  x: number
  y: number
  width: number
  height: number
}

export async function signEnvelopeWithReusableSignature(
  envelopeId: string | number,
  signatureId: string,
  page: number,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const response = await apiClient.post(`/signatures/${envelopeId}/sign/`, {
    signature_id: signatureId,
    page,
    x,
    y,
    width,
    height,
  })
  return response.data
}

export async function signEnvelopeWithInline(
  envelopeId: string | number,
  dataUrlPng: string,
  page: number,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const response = await apiClient.post(`/signatures/${envelopeId}/sign/`, {
    signature_image: dataUrlPng,
    page,
    x,
    y,
    width,
    height,
  })
  return response.data
}

export async function declineEnvelope(envelopeId: string | number, declineMessage: string) {
  const response = await apiClient.post(`/signatures/${envelopeId}/decline/`, { decline_message: declineMessage })
  return response.data
}


