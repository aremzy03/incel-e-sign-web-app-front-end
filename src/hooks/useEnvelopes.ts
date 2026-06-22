import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { shouldRetryAuthQuery, useAuthReady } from '@/hooks/useAuthReady'
import { 
  getEnvelopes, 
  getEnvelope, 
  createEnvelope, 
  sendEnvelope, 
  rejectEnvelope, 
  deleteEnvelope,
  CreateEnvelopeRequest,
  EditEnvelopeRequest,
  Envelope
} from '@/lib/api/envelopes'
import { editEnvelope } from '@/lib/api/envelopes'
import { selfSignEnvelope, type SelfSignRequest } from '@/lib/api/signatures'

function normalizeEnvelopeSearch(search?: string) {
  const trimmed = search?.trim()
  return trimmed || undefined
}

// Hook to get envelopes list
export const useEnvelopes = (
  page: number = 1,
  pageSize: number = 10,
  status?: string,
  search?: string,
  isSelfSign?: boolean,
) => {
  const normalizedSearch = normalizeEnvelopeSearch(search)
  const { isReady } = useAuthReady()

  return useQuery({
    queryKey: ['envelopes', page, pageSize, status, normalizedSearch, isSelfSign],
    queryFn: () => getEnvelopes(page, pageSize, status, normalizedSearch, isSelfSign),
    enabled: isReady,
    staleTime: 5 * 60 * 1000,
    retry: shouldRetryAuthQuery,
    placeholderData: (previousData) => previousData,
  })
}

// Hook to get a specific envelope
export const useEnvelope = (id: string) => {
  const { isReady } = useAuthReady()

  return useQuery({
    queryKey: ['envelope', id],
    queryFn: () => getEnvelope(id),
    enabled: isReady && !!id,
    staleTime: 5 * 60 * 1000,
    retry: shouldRetryAuthQuery,
  })
}

// Hook to create an envelope
export const useCreateEnvelope = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createEnvelope,
    onSuccess: (data) => {
      // Invalidate and refetch envelopes list
      queryClient.invalidateQueries({ queryKey: ['envelopes'] })
      toast.success(`Envelope created successfully!`)
    },
    onError: (error: any) => {
      console.error('Create envelope error:', error)
      let errorMessage = 'Failed to create envelope'
      
      if (error.response?.status === 400) {
        // Handle validation errors
        const data = error.response?.data
        if (data?.signing_order) {
          errorMessage = `Signing order validation failed: ${Array.isArray(data.signing_order) ? data.signing_order.join(', ') : data.signing_order}`
        } else if (data?.detail) {
          errorMessage = data.detail
        } else if (data?.message) {
          errorMessage = data.message
        } else if (data?.errors) {
          // Handle field-specific errors
          const fieldErrors = Object.entries(data.errors).map(([field, messages]) => 
            `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`
          ).join('; ')
          errorMessage = `Validation failed: ${fieldErrors}`
        }
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to create envelopes for this document'
      } else if (error.response?.status === 404) {
        errorMessage = 'Document not found or you do not have access to it'
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }
      
      toast.error(errorMessage)
    },
  })
}

// Hook to send an envelope
export const useSendEnvelope = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: sendEnvelope,
    onSuccess: (data, envelopeId) => {
      // Invalidate and refetch envelopes list and specific envelope
      queryClient.invalidateQueries({ queryKey: ['envelopes'] })
      queryClient.invalidateQueries({ queryKey: ['envelope', envelopeId] })
      toast.success('Envelope sent successfully!')
    },
    onError: (error: any) => {
      console.error('Send envelope error:', error)
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          'Failed to send envelope'
      toast.error(errorMessage)
    },
  })
}

// Hook to edit an envelope (PATCH)
export const useEditEnvelope = () => {
  const queryClient = useQueryClient()

  return useMutation({
    // eslint-disable-next-line
    mutationFn: async ({ id, data }: { id: string; data: EditEnvelopeRequest }) => {
      return await editEnvelope(id, data)
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['envelope', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['envelope-documents', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['envelopes'] })
      toast.success('Envelope saved successfully!')
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Failed to save envelope'
      toast.error(errorMessage)
    },
  })
}

// Hook to reject an envelope
export const useRejectEnvelope = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: rejectEnvelope,
    onSuccess: (data, envelopeId) => {
      // Invalidate and refetch envelopes list and specific envelope
      queryClient.invalidateQueries({ queryKey: ['envelopes'] })
      queryClient.invalidateQueries({ queryKey: ['envelope', envelopeId] })
      toast.success('Envelope rejected successfully!')
    },
    onError: (error: any) => {
      console.error('Reject envelope error:', error)
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          'Failed to reject envelope'
      toast.error(errorMessage)
    },
  })
}

// Hook to self-sign documents in one call
export const useSelfSignEnvelope = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SelfSignRequest) => selfSignEnvelope(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['envelopes'] })
      toast.success('Document signed successfully!')
    },
    onError: (error: any) => {
      console.error('Self-sign error:', error)
      let errorMessage = 'Failed to self-sign document'

      if (error.response?.status === 400) {
        const data = error.response?.data
        if (data?.message) {
          errorMessage = data.message
        } else if (data?.data && typeof data.data === 'object') {
          const fieldErrors = Object.entries(data.data).map(([field, messages]) =>
            `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`
          ).join('; ')
          errorMessage = fieldErrors || 'Validation failed'
        } else if (data?.detail) {
          errorMessage = data.detail
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      }

      toast.error(errorMessage)
    },
  })
}

// Hook to delete an envelope
export const useDeleteEnvelope = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteEnvelope,
    onSuccess: (_, envelopeId) => {
      // Invalidate and refetch envelopes list
      queryClient.invalidateQueries({ queryKey: ['envelopes'] })
      // Remove the specific envelope from cache
      queryClient.removeQueries({ queryKey: ['envelope', envelopeId] })
      toast.success('Envelope deleted successfully!')
    },
    onError: (error: any) => {
      console.error('Delete envelope error:', error)
      let errorMessage = 'Failed to delete envelope'
      
      if (error.response?.status === 404) {
        errorMessage = 'Envelope not found. It may have already been deleted.'
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to delete this envelope.'
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error occurred while deleting envelope. Please try again or contact support.'
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
