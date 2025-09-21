import apiClient from '@/lib/axios'
import { ApiResponse, PaginatedResponse } from '@/types/api'

export interface EnvelopeRecipient {
  id: string
  email: string
  name: string
  order: number
  status: 'pending' | 'sent' | 'signed' | 'rejected'
  signed_at?: string
  rejected_at?: string
}

export interface Envelope {
  id: string
  document: {
    id: string
    file_name: string
    file_url: string
    file_size: number
  }
  creator: {
    id: string
    email: string
    full_name: string
  }
  recipients: EnvelopeRecipient[]
  status: 'draft' | 'sent' | 'completed' | 'rejected'
  created_at: string
  updated_at: string
  sent_at?: string
  completed_at?: string
  rejected_at?: string
}

export interface CreateEnvelopeRequest {
  document_id: string
  signing_order: Array<{
    signer_id: string
    order: number
  }>
}

export interface CreateEnvelopeResponse {
  id: string
  document: {
    id: string
    file_name: string
    file_url: string
    file_size: number
  }
  creator: {
    id: string
    email: string
    full_name: string
  }
  recipients: EnvelopeRecipient[]
  status: string
  created_at: string
}

export interface EnvelopesListResponse {
  count: number
  next: string | null
  previous: string | null
  results: Envelope[]
}

// Create a new envelope
export const createEnvelope = async (data: CreateEnvelopeRequest): Promise<CreateEnvelopeResponse> => {
  console.log('=== Create Envelope Function ===')
  console.log('Envelope data:', data)
  console.log('Envelope data type:', typeof data)
  console.log('Envelope data keys:', Object.keys(data))
  console.log('Document ID:', data.document_id)
  console.log('Signing order:', data.signing_order)
  console.log('Signing order length:', data.signing_order?.length)
  console.log('API Base URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api')
  console.log('Full URL:', `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/envelopes/create/`)
  
  try {
    // Log the exact data being sent
    console.log('=== Sending to Backend ===')
    console.log('URL:', '/envelopes/create/')
    console.log('Method:', 'POST')
    console.log('Data being sent:', JSON.stringify(data, null, 2))
    console.log('Data type check:', {
      hasDocumentId: !!data.document_id,
      documentIdType: typeof data.document_id,
      hasSigningOrder: !!data.signing_order,
      signingOrderType: typeof data.signing_order,
      signingOrderLength: data.signing_order?.length,
      signingOrderItems: data.signing_order?.map(item => ({
        signer_id: item.signer_id,
        signer_id_type: typeof item.signer_id,
        signer_id_length: item.signer_id?.length,
        order: item.order,
        order_type: typeof item.order
      }))
    })
    
    const response = await apiClient.post('/envelopes/create/', data)
    console.log('Create envelope response:', response.data)
    return response.data
  } catch (error: any) {
    console.error('Create envelope error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      baseURL: error.config?.baseURL
    })
    
    // Log the full error response for 400 errors
    if (error.response?.status === 400) {
      console.error('=== 400 BAD REQUEST DETAILS ===')
      console.error('Error response data:', JSON.stringify(error.response?.data, null, 2))
      console.error('Request data that was sent:', JSON.stringify(data, null, 2))
      console.error('Headers sent:', error.config?.headers)
    }
    
    // Log the full error response for debugging
    console.error('Full error response:', error.response)
    console.error('Error response data:', error.response?.data)
    console.error('Error response headers:', error.response?.headers)
    console.error('Request data that was sent:', data)
    
    
    throw error
  }
}

// Get all envelopes
export const getEnvelopes = async (page: number = 1, pageSize: number = 10): Promise<EnvelopesListResponse> => {
  console.log('=== Get Envelopes Function ===')
  console.log('Page:', page, 'PageSize:', pageSize)
  console.log('API Base URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api')
  console.log('Full URL:', `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/envelopes/`)
  console.log('Attempting to fetch envelopes from backend...')
  
  try {
    const response = await apiClient.get('/envelopes/', {
      params: {
        page,
        page_size: pageSize,
      },
    })
    
    console.log('Envelopes response:', response.data)
    console.log('Envelopes count:', response.data?.count)
    console.log('Envelopes results:', response.data?.results?.length)
    
    // Handle both paginated and direct array responses
    if (Array.isArray(response.data)) {
      // Backend returns direct array
      console.log('Backend returns direct array, converting to paginated format')
      return {
        count: response.data.length,
        next: null,
        previous: null,
        results: response.data
      }
    } else {
      // Backend returns paginated response
      console.log('Backend returns paginated response')
      return response.data
    }
  } catch (error: any) {
    console.error('Get envelopes error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      baseURL: error.config?.baseURL
    })
    
    
    throw error
  }
}

// Get a specific envelope by ID
export const getEnvelope = async (id: string): Promise<Envelope> => {
  console.log('=== Get Envelope Function ===')
  console.log('Envelope ID:', id)
  console.log('Full URL:', `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/envelopes/${id}/`)
  
  try {
    const response = await apiClient.get(`/envelopes/${id}/`)
    console.log('Envelope response:', response.data)
    return response.data
  } catch (error: any) {
    console.error('Get envelope error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      baseURL: error.config?.baseURL
    })
    
    
    throw error
  }
}

// Send an envelope
export const sendEnvelope = async (id: string): Promise<ApiResponse<Envelope>> => {
  console.log('=== Send Envelope Function ===')
  console.log('Envelope ID:', id)
  console.log('Send URL:', `/envelopes/${id}/send/`)
  
  try {
    const response = await apiClient.post(`/envelopes/${id}/send/`)
    console.log('Send envelope response:', response.data)
    return response.data
  } catch (error: any) {
    console.error('Send envelope error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      baseURL: error.config?.baseURL
    })
    
    
    throw error
  }
}

// Reject an envelope (creator cancels)
export const rejectEnvelope = async (id: string): Promise<ApiResponse<Envelope>> => {
  console.log('=== Reject Envelope Function ===')
  console.log('Envelope ID:', id)
  console.log('Reject URL:', `/envelopes/${id}/reject/`)
  
  try {
    const response = await apiClient.post(`/envelopes/${id}/reject/`)
    console.log('Reject envelope response:', response.data)
    return response.data
  } catch (error: any) {
    console.error('Reject envelope error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      baseURL: error.config?.baseURL
    })
    
    
    throw error
  }
}

// Delete an envelope
export const deleteEnvelope = async (id: string): Promise<void> => {
  console.log('=== Delete Envelope Function ===')
  console.log('Envelope ID:', id)
  console.log('Delete URL:', `/envelopes/${id}/delete/`)
  
  try {
    const response = await apiClient.delete(`/envelopes/${id}/delete/`)
    console.log('Delete envelope response:', response.status)
    console.log('Delete successful')
  } catch (error: any) {
    console.error('Delete envelope error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method
    })
    
    
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
