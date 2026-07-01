'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import apiClient from '@/lib/axios'
import {
  getEnvelopeDocuments,
  normalizeEnvelopeListItem,
  type EnvelopeDocumentResponse,
} from '@/lib/api/envelopes'
import { getApiBaseUrl } from '@/lib/env'
import { shouldRetryAuthQuery } from '@/hooks/useAuthReady'
import type { SigningEnvelopeResponse } from './types'

interface UseSigningEnvelopeOptions {
  envelopeId?: string
  enabled?: boolean
  accessToken?: string
}

export function useSigningEnvelope({ envelopeId, enabled = true, accessToken }: UseSigningEnvelopeOptions) {
  const [envelopeDocuments, setEnvelopeDocuments] = useState<EnvelopeDocumentResponse[]>([])
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [docsError, setDocsError] = useState<string | null>(null)
  const [pdfLoadedByDocId, setPdfLoadedByDocId] = useState<Record<string, boolean>>({})

  const resolveUrl = (url?: string | null) => {
    if (!url || typeof url !== 'string') return ''
    if (/^https?:\/\//i.test(url)) return url
    const apiBase = getApiBaseUrl()
    let backendOrigin = apiBase
    try {
      backendOrigin = new URL(apiBase).origin
    } catch {
      /* ignore */
    }
    const path = url.startsWith('/') ? url : `/${url}`
    return `${backendOrigin}${path}`
  }

  const getPreviewUrl = (documentId?: string | null) => {
    if (!documentId) return ''
    return resolveUrl(`/api/documents/${documentId}/preview/`)
  }

  const pdfFileCacheRef = useRef<Record<string, { url: string; httpHeaders?: Record<string, string> }>>({})

  const {
    data: envelope,
    isLoading: loadingEnv,
    error: envelopeError,
    refetch: refetchEnvelope,
  } = useQuery<SigningEnvelopeResponse>({
    queryKey: ['sign-envelope', envelopeId],
    enabled: enabled && !!envelopeId,
    retry: shouldRetryAuthQuery,
    queryFn: async () => {
      const res = await apiClient.get(`/envelopes/${envelopeId}/`)
      const raw = (res.data?.data ?? res.data) as Record<string, unknown>
      return normalizeEnvelopeListItem(raw) as SigningEnvelopeResponse
    },
  })

  useEffect(() => {
    if (!envelopeId || !enabled || !accessToken) return
    let cancelled = false

    const fetchDocuments = async () => {
      setLoadingDocs(true)
      setDocsError(null)
      try {
        const docs = await getEnvelopeDocuments(envelopeId)
        if (cancelled) return
        setEnvelopeDocuments(docs)
        if (docs.length === 0) setDocsError('No documents found for this envelope.')
      } catch {
        if (!cancelled) {
          setDocsError('Failed to load documents for signing')
          toast.error('Failed to load documents for signing')
        }
      } finally {
        if (!cancelled) setLoadingDocs(false)
      }
    }

    fetchDocuments()
    return () => {
      cancelled = true
    }
  }, [envelopeId, enabled, accessToken])

  const pdfFileByDocumentId = useMemo(() => {
    const nextMap: Record<string, { url: string; httpHeaders?: Record<string, string> }> = {}
    const prevMap = pdfFileCacheRef.current
    for (const d of envelopeDocuments) {
      const docId = d.document
      if (!docId) continue
      const url = getPreviewUrl(docId)
      if (!url) continue
      const nextHeaders = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
      const prev = prevMap[docId]
      if (prev && prev.url === url && prev.httpHeaders?.Authorization === nextHeaders?.Authorization) {
        nextMap[docId] = prev
      } else {
        nextMap[docId] = { url, ...(nextHeaders ? { httpHeaders: nextHeaders } : {}) }
      }
    }
    pdfFileCacheRef.current = nextMap
    return nextMap
  }, [accessToken, envelopeDocuments])

  useEffect(() => {
    setPdfLoadedByDocId({})
  }, [pdfFileByDocumentId])

  return {
    envelope,
    loadingEnv,
    envelopeError,
    refetchEnvelope,
    envelopeDocuments,
    loadingDocs,
    docsError,
    pdfFileByDocumentId,
    pdfLoadedByDocId,
    setPdfLoadedByDocId,
    resolveUrl,
    getPreviewUrl,
  }
}
