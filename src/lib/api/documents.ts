import apiClient from '@/lib/axios'

export interface Document {
  id: string
  file_name: string
  file_url: string
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
  console.log('Upload URL will be:', `${apiClient.defaults.baseURL}/api/proxy/documents/upload`)
  
  const formData = new FormData()
  formData.append('file', file)
  
  console.log('FormData created, making request...')
  
  try {
    // Do NOT set Content-Type manually; let the browser set the multipart boundary
    const response = await apiClient.post('/api/proxy/documents/upload', formData)
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
  console.log('API URL: /api/proxy/documents')
  
  const response = await apiClient.get('/api/proxy/documents')
  
  console.log('getDocuments response:', {
    status: response.status,
    dataLength: response.data?.length || 0,
    data: response.data
  })
  
  return response.data
}

// Get a specific document by ID
export const getDocument = async (id: string): Promise<Document> => {
  const response = await apiClient.get(`/api/proxy/documents/${id}/`)
  const payload = response.data
  const doc: any = (payload && payload.data) || payload
  return {
    id: doc.id,
    file_name: doc.file_name,
    file_url: doc.file_url || '',
    file_size: doc.file_size ?? 0,
    status: doc.status || 'draft',
    created_at: doc.created_at || '',
    updated_at: doc.updated_at || '',
  }
}

// Delete a document
export const deleteDocument = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/api/proxy/documents/${id}/delete/`)
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
  const response = await apiClient.get(`/api/proxy/documents/${id}/download/`, {
    responseType: 'blob',
  })
  
  return response.data
}
