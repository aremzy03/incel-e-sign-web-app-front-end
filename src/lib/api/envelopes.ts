import apiClient from '@/lib/axios'

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
  status: 'pending' | 'signed' | 'rejected'
  signing_order: number
  signed_at?: string
  signature_image?: string
  created_at: string
  updated_at: string
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
  recipients: EnvelopeRecipient[]
  signatures?: EnvelopeSignature[]
  // Optional: some responses may inline associated documents
  documents?: Array<{
    id: string
    file_name?: string
    file_url?: string
    signer_document_positions?: Array<{ signer_id: string; position: Position }>
  }>
  status: 'draft' | 'pending' | 'completed' | 'rejected'
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

export interface CreateEnvelopeRequest {
  document_ids: string[]
  name?: string
  description?: string | null
  signing_order: Array<{
    signer_id: string
    order: number
  }>
  documents_with_positions: DocumentWithPositions[]
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
  console.log('Document IDs:', data.document_ids)
  console.log('Signing order:', data.signing_order)
  console.log('Signing order length:', data.signing_order?.length)
  console.log('Documents with positions:', data.documents_with_positions)
  console.log('Documents with positions length:', data.documents_with_positions?.length)
  console.log('API Base URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api')
  console.log('Full URL:', `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/envelopes/create/`)
  
  try {
    // Log the exact data being sent
    console.log('=== Sending to Backend ===')
    console.log('URL:', '/envelopes/create/')
    console.log('Method:', 'POST')
    console.log('Data being sent:', JSON.stringify(data, null, 2))
    console.log('Data type check:', {
      hasDocumentIds: !!data.document_ids,
      documentIdsType: typeof data.document_ids,
      documentIdsLength: data.document_ids?.length,
      hasSigningOrder: !!data.signing_order,
      signingOrderType: typeof data.signing_order,
      signingOrderLength: data.signing_order?.length,
      signingOrderItems: data.signing_order?.map(item => ({
        signer_id: item.signer_id,
        signer_id_type: typeof item.signer_id,
        signer_id_length: item.signer_id?.length,
        order: item.order,
        order_type: typeof item.order
      })),
      hasDocumentsWithPositions: !!data.documents_with_positions,
      documentsWithPositionsType: typeof data.documents_with_positions,
      documentsWithPositionsLength: data.documents_with_positions?.length,
      documentsWithPositionsItems: data.documents_with_positions?.map(doc => ({
        document_id: doc.document_id,
        signerDocumentPositionsLength: doc.signer_document_positions?.length
      }))
    })
    
    // Direct to backend API
    const response = await apiClient.post('/envelopes/create/', data)
    console.log('Create envelope response:', response.data)
    // Normalize possible response wrappers
    const payload = response.data
    const unwrapped = payload?.data?.envelope || payload?.data || payload
    if (!unwrapped?.id) {
      console.warn('Create envelope: unexpected response shape, missing id')
    }
    return unwrapped
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
    
    console.log('Envelopes raw response:', response.data)
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
      console.warn('Unexpected envelopes list shape, defaulting to empty list')
      results = []
      count = 0
    }

    // Normalize result items to Envelope shape consumed by UI
    const normalizedResults: Envelope[] = results.map((r: any) => {
      const creator = r.creator && typeof r.creator === 'object'
        ? r.creator
        : {
            id: r.creator,
            email: r.creator_email || r.creator?.email || '',
            full_name: r.creator_full_name || r.creator?.full_name || (r.creator_email || ''),
          }

      const recipients: EnvelopeRecipient[] = Array.isArray(r.recipients)
        ? r.recipients
        : Array.isArray(r.signing_order)
          ? r.signing_order.map((s: any, idx: number) => ({
              id: s.signer_id || String(idx),
              email: s.email || '',
              name: s.name || '',
              order: s.order ?? idx + 1,
              status: (s.status || 'pending') as any,
            }))
          : []

      return {
        id: r.id,
        name: r.name,
        description: r.description ?? null,
      pdf_lock_code: r.pdf_lock_code ?? null,
        creator,
        recipients,
        status: r.status || 'draft',
        created_at: r.created_at || '',
        updated_at: r.updated_at || '',
        sent_at: r.sent_at,
        completed_at: r.completed_at,
        rejected_at: r.rejected_at,
      }
    })

    return { count, next, previous, results: normalizedResults }
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
    console.log('Envelope raw response:', response.data)
    const payload = response.data
    const r: any = (payload && (payload.data?.envelope || payload.data)) || payload

    const creator = r.creator && typeof r.creator === 'object'
      ? r.creator
      : {
          id: r.creator,
          email: r.creator_email || r.creator?.email || '',
          full_name: r.creator_full_name || r.creator?.full_name || (r.creator_email || ''),
        }

    const recipients: EnvelopeRecipient[] = Array.isArray(r.recipients)
      ? r.recipients
      : Array.isArray(r.signing_order)
        ? r.signing_order.map((s: any, idx: number) => ({
            id: s.signer_id || String(idx),
            email: s.email || '',
            name: s.name || '',
            order: s.order ?? idx + 1,
            status: (s.status || 'pending') as any,
          }))
        : []

    return {
      id: r.id,
      name: r.name,
      description: r.description ?? null,
      pdf_lock_password: r.pdf_lock_password ?? null,
      creator,
      recipients,
      signatures: r.signatures || [],
      status: r.status || 'draft',
      created_at: r.created_at || '',
      updated_at: r.updated_at || '',
      sent_at: r.sent_at,
      completed_at: r.completed_at,
      rejected_at: r.rejected_at,
    }
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

export interface EnvelopeDocumentResponse {
  id: string; // This is the ID of the document within the envelope context (association ID)
  document: string; // This is the actual document ID
  file_name: string;
  document_file_name: string;
  document_file_url: string; // This is the actual file URL for PDF viewer
  file_size: number;
  status: string;
  created_at: string;
  updated_at: string;
  signer_document_positions: Array<{
    signer_id: string;
    position: Position;
  }>;
}

// Get documents associated with an envelope
export const getEnvelopeDocuments = async (envelopeId: string): Promise<EnvelopeDocumentResponse[]> => {
  try {
    const response = await apiClient.get(`/envelopes/${envelopeId}/document/`);
    const payload = response.data;
    // Assuming the backend returns an array of documents directly or nested under a 'data' field
    const documents = (payload && payload.data) || payload;
    if (!Array.isArray(documents)) {
      console.warn('getEnvelopeDocuments: unexpected response shape, expected array', documents);
      return [];
    }
    console.log('Fetched documents for envelope:', envelopeId, documents);
    // Map the documents to ensure correct IDs and file names are used
    return documents.map(doc => ({
      ...doc,
      id: doc.document, // The ID for linking to document details etc.
      document: doc.document, // The actual document ID from backend
      file_name: doc.document_file_name || doc.file_name || `Document ${doc.document}`, // Fallback for display
      document_file_url: doc.document_file_url || doc.file_url, // Use document_file_url for the PDF source
      signer_document_positions: doc.signer_document_positions || [],
    })) as EnvelopeDocumentResponse[];
  } catch (error: any) {
    console.error('Error fetching documents for envelope:', envelopeId, {
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

// Edit an envelope (PATCH)
export const editEnvelope = async (
  id: string,
  data: EditEnvelopeRequest
): Promise<ApiResponse<Envelope>> => {
  console.log('=== Edit Envelope Function ===')
  console.log('Envelope ID:', id)
  console.log('Edit data:', data)
  console.log('Edit URL:', `/envelopes/${id}/edit/`)
  
  try {
    console.log('=== Sending to Backend for Edit ===')
    console.log('URL:', `/envelopes/${id}/edit/`)
    console.log('Method:', 'PATCH')
    console.log('Data being sent:', JSON.stringify(data, null, 2))
    
    const response = await apiClient.patch(`/envelopes/${id}/edit/`, data)
    console.log('Edit envelope response:', response.data)
    return response.data
  } catch (error: any) {
    console.error('Edit envelope error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      baseURL: error.config?.baseURL,
      requestData: error.config?.data,
    })
    throw error
  }
}

// Reject an envelope (creator cancels)
export const rejectEnvelope = async (id: string): Promise<ApiResponse<Envelope>> => {
  console.log('=== Reject Envelope Function ===')
  console.log('Envelope ID:', id)
  console.log('Envelope ID type:', typeof id)
  console.log('Reject URL:', `/envelopes/${id}/reject/`)
  
  // Validate input
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Invalid envelope ID provided')
  }
  
  try {
    // Log the exact request being made
    console.log('Making POST request to:', `/envelopes/${id}/reject/`)
    console.log('Request payload:', {})
    console.log('Request config:', { timeout: 15000 })
    
    const response = await apiClient.post(`/envelopes/${id}/reject/`, {}, {
      timeout: 15000, // Increase timeout for reject operation
    })
    console.log('Reject envelope response status:', response.status)
    console.log('Reject envelope response headers:', response.headers)
    console.log('Reject envelope response data:', response.data)
    return response.data
  } catch (error: any) {
    console.error('Reject envelope error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      baseURL: error.config?.baseURL,
      requestData: error.config?.data,
      headers: error.config?.headers
    })
    
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
      
      // Log additional debugging information for 500 errors
      console.error('=== 500 SERVER ERROR DETAILS ===')
      console.error('Full error response:', error.response)
      console.error('Error response data:', JSON.stringify(error.response?.data, null, 2))
      console.error('Request URL:', error.config?.url)
      console.error('Request method:', error.config?.method)
      console.error('Request headers:', error.config?.headers)
      console.error('Request data:', error.config?.data)
      
      throw new Error(`Server error: ${serverMessage}. Please check the console for more details or contact support.`)
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
