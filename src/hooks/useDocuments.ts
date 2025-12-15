import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { uploadDocument, getDocuments, getDocument, deleteDocument, downloadDocument, Document, DocumentsListResponse } from '@/lib/api/documents'
import { toast } from 'react-hot-toast'

// Hook to get documents list
export const useDocuments = () => {
  return useQuery<DocumentsListResponse>({
    queryKey: ['documents'],
    queryFn: () => getDocuments(),
    staleTime: 0, // Always refetch when invalidated
    retry: 1,
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true, // Refetch when component mounts
  })
}

// Hook to get a specific document
export const useDocument = (id: string) => {
  return useQuery<Document>({
    queryKey: ['document', id],
    queryFn: () => getDocument(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  })
}

// Hook to upload a document
export const useUploadDocument = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: uploadDocument,
    onSuccess: (data) => {
      // Force refetch documents list immediately
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.refetchQueries({ queryKey: ['documents'] })
      toast.success(`Document "${data.data.file_name}" uploaded successfully!`)
    },
    onError: (error: any) => {
      console.error('Upload error:', error)
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          'Failed to upload document'
      toast.error(errorMessage)
    },
  })
}

// Hook to delete a document
export const useDeleteDocument = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: (_, documentId) => {
      // Force refetch documents list immediately
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.refetchQueries({ queryKey: ['documents'] })
      // Remove the specific document from cache
      queryClient.removeQueries({ queryKey: ['document', documentId] })
      toast.success('Document deleted successfully!')
    },
    onError: (error: any) => {
      console.error('Delete error:', error)
      let errorMessage = 'Failed to delete document'
      
      // Handle specific status codes
      if (error.response?.status === 405) {
        errorMessage = 'Document deletion is not supported by the backend. Please contact the administrator.'
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error occurred while deleting document. Please try again or contact support.'
      } else if (error.response?.status === 404) {
        errorMessage = 'Document not found. It may have already been deleted.'
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to delete this document.'
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
    },
  })
}

// Hook to download a document
// Expects both the document ID and its file_name so the saved file name is user friendly.
export const useDownloadDocument = () => {
  return useMutation({
    mutationFn: ({ id }: { id: string; fileName: string }) => downloadDocument(id),
    onSuccess: (blob, variables) => {
      const { id, fileName } = variables as { id: string; fileName: string }
      try {
        // Create download link
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        // Prefer the original file name; fall back to a generic name with ID if missing
        link.download = fileName && fileName.trim().length > 0
          ? fileName
          : `document-${id}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        toast.success('Document downloaded successfully!')
      } catch (error) {
        console.error('Download link creation error:', error)
        toast.error('Failed to create download link')
      }
    },
    onError: (error: any) => {
      console.error('Download error:', error)
      let errorMessage = 'Failed to download document'
      
      // Handle specific status codes
      if (error.response?.status === 500) {
        errorMessage = 'Server error occurred while downloading document. The file may be corrupted or missing.'
      } else if (error.response?.status === 404) {
        errorMessage = 'Document not found. It may have been deleted.'
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to download this document.'
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
    },
  })
}
