'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import { listUserSignatures, type ReusableSignature } from '@/lib/api/signatures'
import { shouldRetryAuthQuery } from '@/hooks/useAuthReady'

interface MySignatureResponse {
  id?: string
  signature_id?: string
  signature_image?: string
  image?: string
  image_url?: string
  is_default?: boolean
  status?: string
}

interface UseUserSignaturesOptions {
  envelopeId?: string
  mode: 'dashboard' | 'public'
  enabled?: boolean
}

export function useUserSignatures({ envelopeId, mode, enabled = true }: UseUserSignaturesOptions) {
  const queryClient = useQueryClient()

  const dashboardQuery = useQuery<ReusableSignature[]>({
    queryKey: ['my-signatures'],
    enabled: enabled && mode === 'dashboard',
    retry: shouldRetryAuthQuery,
    queryFn: listUserSignatures,
  })

  const publicQuery = useQuery<MySignatureResponse | MySignatureResponse[]>({
    queryKey: ['my-signature', envelopeId],
    enabled: enabled && mode === 'public' && !!envelopeId,
    queryFn: async () => {
      const res = await apiClient.get(`/signatures/me/`, { params: { envelope: envelopeId } })
      return (res.data?.data ?? res.data) as MySignatureResponse | MySignatureResponse[]
    },
  })

  const refetch = async () => {
    if (mode === 'dashboard') {
      await queryClient.invalidateQueries({ queryKey: ['my-signatures'] })
      return dashboardQuery.refetch()
    }
    await queryClient.invalidateQueries({ queryKey: ['my-signature', envelopeId] })
    return publicQuery.refetch()
  }

  if (mode === 'dashboard') {
    return {
      signatures: dashboardQuery.data ?? [],
      isLoading: dashboardQuery.isLoading,
      selectedSource: 'list' as const,
      refetch,
    }
  }

  const raw = publicQuery.data
  const single = Array.isArray(raw) ? raw[0] : raw
  const signatures = single ? [single as ReusableSignature] : []

  return {
    signatures,
    isLoading: publicQuery.isLoading,
    selectedSource: 'single' as const,
    refetch,
  }
}

export function resolveSignatureId(signature: unknown): string | undefined {
  if (!signature || typeof signature !== 'object') return undefined
  const raw = signature as Record<string, unknown>
  // Prefer linked UserSignature id (envelope Signature rows expose this as signature_id).
  const id = raw.signature_id ?? raw.id
  return id != null ? String(id) : undefined
}

export function resolveSignatureImage(signature: unknown): string | undefined {
  if (!signature || typeof signature !== 'object') return undefined
  const raw = signature as Record<string, unknown>
  const img = raw.image ?? raw.image_url ?? raw.signature_image
  return typeof img === 'string' ? img : undefined
}
