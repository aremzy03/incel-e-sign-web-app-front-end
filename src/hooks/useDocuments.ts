import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query'
import { shouldRetryAuthQuery, useAuthReady } from '@/hooks/useAuthReady'
import {
  uploadDocument,
  getDocuments,
  getDocument,
  deleteDocument,
  downloadDocument,
  Document,
  DocumentsListResponse,
} from '@/lib/api/documents'
import { toast } from 'react-hot-toast'

const DOCUMENT_STATUS_TABS = ['all', 'draft', 'sent', 'completed', 'rejected'] as const
export type DocumentStatusTab = (typeof DOCUMENT_STATUS_TABS)[number]

function normalizeSearch(search?: string) {
  const trimmed = search?.trim()
  return trimmed || undefined
}

export interface UseDocumentsParams {
  page?: number
  pageSize?: number
  status?: string
  search?: string
}

export const useDocuments = (params: UseDocumentsParams = {}) => {
  const { isReady } = useAuthReady()
  const normalized = {
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 20,
    status: params.status,
    search: normalizeSearch(params.search),
  }

  return useQuery<DocumentsListResponse>({
    queryKey: ['documents', normalized],
    queryFn: () => getDocuments(normalized),
    enabled: isReady,
    staleTime: 0,
    retry: shouldRetryAuthQuery,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    placeholderData: (previousData) => previousData,
  })
}

export const useDocumentStatusCounts = (search?: string) => {
  const { isReady } = useAuthReady()
  const normalizedSearch = normalizeSearch(search)

  const queries = useQueries({
    queries: DOCUMENT_STATUS_TABS.map((tab) => ({
      queryKey: ['documents', 'status-count', tab, normalizedSearch],
      queryFn: () =>
        getDocuments({
          page: 1,
          pageSize: 1,
          status: tab === 'all' ? undefined : tab,
          search: normalizedSearch,
        }),
      enabled: isReady,
      staleTime: 30_000,
      retry: shouldRetryAuthQuery,
    })),
  })

  const counts: Record<DocumentStatusTab, number> = {
    all: queries[0]?.data?.count ?? 0,
    draft: queries[1]?.data?.count ?? 0,
    sent: queries[2]?.data?.count ?? 0,
    completed: queries[3]?.data?.count ?? 0,
    rejected: queries[4]?.data?.count ?? 0,
  }

  return { counts, isLoading: queries.some((q) => q.isLoading) }
}

// Hook to get a specific document
export const useDocument = (id: string) => {
  const { isReady } = useAuthReady()

  return useQuery<Document>({
    queryKey: ['document', id],
    queryFn: () => getDocument(id),
    enabled: isReady && !!id,
    staleTime: 5 * 60 * 1000,
    retry: shouldRetryAuthQuery,
  })
}

// Hook to upload a document
export const useUploadDocument = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => uploadDocument(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.refetchQueries({ queryKey: ['documents'] })
    },
    onError: (error: any) => {
      console.error('Upload error:', error)
    },
  })
}

// Hook to delete a document
export const useDeleteDocument = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: (_, documentId) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.refetchQueries({ queryKey: ['documents'] })
      queryClient.removeQueries({ queryKey: ['document', documentId] })
      toast.success('Document deleted successfully!')
    },
    onError: (error: any) => {
      console.error('Delete error:', error)
      let errorMessage = 'Failed to delete document'

      if (error.response?.status === 405) {
        errorMessage =
          'Document deletion is not supported by the backend. Please contact the administrator.'
      } else if (error.response?.status === 500) {
        errorMessage =
          'Server error occurred while deleting document. Please try again or contact support.'
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
export const useDownloadDocument = () => {
  return useMutation({
    mutationFn: ({ id }: { id: string; fileName: string }) => downloadDocument(id),
    onSuccess: (blob, variables) => {
      const { id, fileName } = variables as { id: string; fileName: string }
      try {
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download =
          fileName && fileName.trim().length > 0 ? fileName : `document-${id}.pdf`
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

      if (error.response?.status === 500) {
        errorMessage =
          'Server error occurred while downloading document. The file may be corrupted or missing.'
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
