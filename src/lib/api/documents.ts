import apiClient from '@/lib/axios'
import { getSession } from 'next-auth/react'

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
  status: 'draft' | 'pending' | 'completed' | 'rejected'
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

// Backend returns direct array, not paginated
export type DocumentsListResponse = Document[]

// Upload a new document
export const uploadDocument = async (file: File): Promise<DocumentUploadResponse> => {
  console.log('=== uploadDocument called ===')
  console.log('File:', file.name, file.size, file.type)
  console.log('API Client baseURL:', apiClient.defaults.baseURL)
  console.log('Upload URL will be:', `${apiClient.defaults.baseURL}/documents/upload/`)
  
  const formData = new FormData()
  formData.append('file', file)
  
  console.log('FormData created, making request...')
  
  try {
    // Do NOT set Content-Type manually; let the browser set the multipart boundary
    const response = await apiClient.post('/documents/upload/', formData)
    console.log('Upload response received:', response.status)
    return response.data
  } catch (error) {
    console.error('Upload request failed:', error)
    throw error
  }
}

// Get all documents
export const getDocuments = async (): Promise<DocumentsListResponse> => {
  console.log('=== getDocuments API called ===')
  console.log('Timestamp:', new Date().toISOString())
  console.log('API URL: /documents/')
  
  const response = await apiClient.get('/documents/')
  
  console.log('getDocuments response:', {
    status: response.status,
    dataLength: response.data?.length || 0,
    data: response.data
  })
  
  return response.data
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
    return {
      id: doc.id,
      file_name: doc.file_name,
      file_url: doc.file_url || '',
      current_file_url: doc.current_file_url || undefined,
      signed_file_url: doc.signed_file_url || undefined,
      file_size: doc.file_size ?? 0,
      status: doc.status || 'draft',
      created_at: doc.created_at || '',
      updated_at: doc.updated_at || '',
    };
  } catch (error: any) {
    console.error('Error fetching document:', id, {
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
  const session = await getSession()
  const accessToken = (session as any)?.accessToken as string | undefined

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
