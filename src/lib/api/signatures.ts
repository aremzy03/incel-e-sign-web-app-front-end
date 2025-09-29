import apiClient from '@/lib/axios'

export interface ReusableSignature {
  id: number
  name: string
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
  // backend may wrap responses; handle both raw list and wrapped
  if (Array.isArray(response.data)) return response.data as ReusableSignature[]
  if (response.data?.data) return response.data.data as ReusableSignature[]
  return []
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

export async function deleteUserSignature(id: number): Promise<void> {
  await apiClient.delete(`/signatures/user/${id}/`)
}

export async function signEnvelopeWithReusableSignature(envelopeId: string | number, signatureId: number) {
  const response = await apiClient.post(`/signatures/${envelopeId}/sign/`, {
    signature_id: signatureId,
    type: 'reusable',
  })
  return response.data
}

export async function signEnvelopeWithInline(envelopeId: string | number, dataUrlPng: string) {
  const response = await apiClient.post(`/signatures/${envelopeId}/sign/`, {
    signature_image: dataUrlPng,
    type: 'inline',
  })
  return response.data
}

export async function declineEnvelope(envelopeId: string | number) {
  const response = await apiClient.post(`/signatures/${envelopeId}/decline/`)
  return response.data
}


