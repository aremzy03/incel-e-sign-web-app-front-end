'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import apiClient from '@/lib/axios'
import {
  getEnvelopeDocuments,
  normalizeEnvelopeListItem,
  type EnvelopeDocumentResponse,
} from '@/lib/api/envelopes'
import { classifyError } from '@/lib/errors'
import {
  documentUrlNeedsAuth,
  getDocumentFileUrlForViewer,
  resolveBackendUrl,
} from '@/lib/url'
import { getCachedAccessToken } from '@/lib/auth-session-cache'
import { shouldRetryAuthQuery } from '@/hooks/useAuthReady'
import type { SigningEnvelopeResponse } from './types'

interface UseSigningEnvelopeOptions {
  envelopeId?: string
  enabled?: boolean
  accessToken?: string
}

export function useSigningEnvelope({ envelopeId, enabled = true, accessToken }: UseSigningEnvelopeOptions) {
  const effectiveAccessToken = accessToken ?? getCachedAccessToken() ?? undefined
  const [envelopeDocuments, setEnvelopeDocuments] = useState<EnvelopeDocumentResponse[]>([])
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [docsError, setDocsError] = useState<string | null>(null)
  const [documentsError, setDocumentsError] = useState<unknown>(null)
  const [pdfLoadedByDocId, setPdfLoadedByDocId] = useState<Record<string, boolean>>({})
  const [previewFallbackDocIds, setPreviewFallbackDocIds] = useState<Set<string>>(() => new Set())
  const [documentReloadToken, setDocumentReloadToken] = useState(0)

  const resolveUrl = (url?: string | null) => resolveBackendUrl(url)
  const waitingForDocumentsAuth = Boolean(enabled && envelopeId && !effectiveAccessToken)

  const getDocumentViewerUrl = (
    doc: EnvelopeDocumentResponse,
    usePreviewApi = false,
  ) => getDocumentFileUrlForViewer(doc, { preferEnvelopeFields: true, usePreviewApi })

  const markPreviewFallback = useCallback((documentId: string) => {
    setPreviewFallbackDocIds((prev) => new Set(prev).add(documentId))
  }, [])

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
    if (!envelopeId || !enabled || !effectiveAccessToken) return
    let cancelled = false

    const fetchDocuments = async () => {
      setLoadingDocs(true)
      setDocsError(null)
      setDocumentsError(null)
      try {
        const docs = await getEnvelopeDocuments(envelopeId)
        if (cancelled) return
        setEnvelopeDocuments(docs)
        if (docs.length === 0) setDocsError('No documents found for this envelope.')
      } catch (error) {
        if (!cancelled) {
          const errorState = classifyError(error, 'Failed to load documents for signing')
          setDocumentsError(error)
          setDocsError(errorState.message)
          toast.error(errorState.message)
        }
      } finally {
        if (!cancelled) setLoadingDocs(false)
      }
    }

    fetchDocuments()
    return () => {
      cancelled = true
    }
  }, [documentReloadToken, effectiveAccessToken, enabled, envelopeId])

  useEffect(() => {
    setPreviewFallbackDocIds(new Set())
  }, [envelopeDocuments])

  const pdfFileByDocumentId = useMemo(() => {
    const nextMap: Record<string, { url: string; httpHeaders?: Record<string, string> }> = {}
    const prevMap = pdfFileCacheRef.current
    for (const d of envelopeDocuments) {
      const docId = d.document
      if (!docId) continue
      const url = getDocumentViewerUrl(d, previewFallbackDocIds.has(docId))
      if (!url) continue
      const nextHeaders =
        effectiveAccessToken && documentUrlNeedsAuth(url)
          ? { Authorization: `Bearer ${effectiveAccessToken}` }
          : undefined
      const prev = prevMap[docId]
      if (prev && prev.url === url && prev.httpHeaders?.Authorization === nextHeaders?.Authorization) {
        nextMap[docId] = prev
      } else {
        nextMap[docId] = { url, ...(nextHeaders ? { httpHeaders: nextHeaders } : {}) }
      }
    }
    pdfFileCacheRef.current = nextMap
    return nextMap
  }, [effectiveAccessToken, envelopeDocuments, previewFallbackDocIds])

  useEffect(() => {
    setPdfLoadedByDocId({})
  }, [pdfFileByDocumentId])

  const refetchDocuments = useCallback(() => {
    setDocumentReloadToken((current) => current + 1)
  }, [])

  const envelopeErrorState = envelopeError
    ? classifyError(envelopeError, 'Failed to load envelope')
    : null
  const documentsErrorState = documentsError
    ? classifyError(documentsError, 'Failed to load documents for signing')
    : null

  return {
    envelope,
    loadingEnv,
    envelopeError,
    envelopeErrorState,
    refetchEnvelope,
    envelopeDocuments,
    loadingDocs,
    docsError,
    documentsError,
    documentsErrorState,
    refetchDocuments,
    waitingForDocumentsAuth,
    pdfFileByDocumentId,
    pdfLoadedByDocId,
    setPdfLoadedByDocId,
    resolveUrl,
    getDocumentViewerUrl,
    markPreviewFallback,
  }
}
