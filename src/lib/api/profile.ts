import apiClient from '@/lib/axios'

export interface ProfileUser {
  id: string
  email: string
  full_name: string
  is_active: boolean
  created_at: string
  updated_at: string
  profile_photo: string | null
  profile_photo_url: string | null
}

export interface EnvelopeDocument {
  id: string
  document: string
  order: number
  document_file_name: string
  document_file_url: string
  document_signed_file_url: string | null
  signer_document_positions: any[]
}

export interface EnvelopeBetweenUsersItem {
  id: string
  creator: string
  name: string
  status: string
  signing_order: Array<{ signer_id: string; order: number }>
  signer_count: number
  documents: EnvelopeDocument[]
  signatures: any[]
  created_at: string
  updated_at: string
}

export interface ProfileDetailResponse {
  status: 'success'
  message: string
  data: {
    user: ProfileUser
    envelopes_between_users: EnvelopeBetweenUsersItem[]
  }
}

export async function getProfileDetail(userId?: string): Promise<ProfileDetailResponse> {
  const response = await apiClient.get<ProfileDetailResponse>('/auth/profile/detail/', {
    params: userId ? { user_id: userId } : undefined,
  })
  return response.data
}

export interface UpdateOwnProfileResponse {
  status: 'success'
  message: string
  data: ProfileUser
}

export async function updateOwnProfile(formData: FormData): Promise<UpdateOwnProfileResponse> {
  // Do not set Content-Type; let the browser set multipart boundary
  const response = await apiClient.patch<UpdateOwnProfileResponse>('/auth/profile/detail/', formData)
  return response.data
}


