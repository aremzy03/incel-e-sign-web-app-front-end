/**
 * Document URL helpers for PDF viewers.
 *
 * With S3 + CloudFront, the API returns fresh signed URLs on each fetch via
 * `current_file_url` (documents) or `document_file_url` (envelope responses).
 * Absolute URLs are loaded directly in the browser; relative `/media/...` paths
 * are resolved against the backend origin and may still require Bearer auth.
 */

import { getApiBaseUrl } from '@/lib/env'

export type DocumentUrlLike = {
  id?: string
  updated_at?: string | null
  current_file_url?: string | null
  signed_file_url?: string | null
  document_file_url?: string | null
  document_signed_file_url?: string | null
  file_url?: string | null
}

export function isAbsoluteHttpUrl(url?: string | null): boolean {
  return Boolean(url && /^https?:\/\//i.test(url.trim()))
}

export function isBlobDocumentUrl(url?: string | null): boolean {
  return Boolean(url && /^blob:/i.test(url.trim()))
}

/** Remove stray whitespace from URLs (e.g. bad CDN hostnames from .env). */
export function sanitizeDocumentUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return ''
  const trimmed = url.trim()
  if (!isAbsoluteHttpUrl(trimmed)) return trimmed
  try {
    const parsed = new URL(trimmed)
    parsed.hostname = parsed.hostname.trim()
    return parsed.toString()
  } catch {
    return trimmed
  }
}

export function resolveBackendUrl(url?: string | null): string {
  const cleaned = sanitizeDocumentUrl(url)
  if (!cleaned) return ''
  if (/^blob:/i.test(cleaned)) return cleaned
  if (isAbsoluteHttpUrl(cleaned)) return cleaned

  const apiBase = getApiBaseUrl()
  let backendOrigin = apiBase
  try {
    backendOrigin = new URL(apiBase).origin
  } catch {
    // keep apiBase as-is
  }
  const path = cleaned.startsWith('/') ? cleaned : `/${cleaned}`
  return `${backendOrigin}${path}`
}

function getApiOrigin(): string {
  try {
    return new URL(getApiBaseUrl()).origin
  } catch {
    return ''
  }
}

/** CloudFront / S3 presigned URLs — auth is embedded in the URL query string. */
export function isExternalDocumentUrl(url?: string | null): boolean {
  if (!url || !isAbsoluteHttpUrl(url)) return false
  const apiOrigin = getApiOrigin()
  if (!apiOrigin) return true
  try {
    return new URL(url).origin !== apiOrigin
  } catch {
    return true
  }
}

/**
 * True when pdf.js should attach `Authorization: Bearer …` (preview API, /media/, etc.).
 * External CDN URLs are signed and must not receive app JWT headers.
 */
export function documentUrlNeedsAuth(url?: string | null): boolean {
  if (!url) return false
  if (isBlobDocumentUrl(url)) return false
  if (!isAbsoluteHttpUrl(url)) return true
  return !isExternalDocumentUrl(url)
}

export function getCurrentFileUrl(doc?: DocumentUrlLike | null): string {
  if (!doc) return ''
  return (
    (doc.current_file_url ?? undefined) ||
    (doc.signed_file_url ?? undefined) ||
    (doc.file_url ?? undefined) ||
    ''
  )
}

/** Best URL for envelope document entries (prefers signed output when present). */
export function getEnvelopeDocumentFileUrl(doc?: DocumentUrlLike | null): string {
  if (!doc) return ''
  return (
    (doc.document_signed_file_url ?? undefined) ||
    (doc.document_file_url ?? undefined) ||
    getCurrentFileUrl(doc) ||
    ''
  )
}

/**
 * Resolved direct file URL (CloudFront/S3 or /media). Empty when none available.
 */
export function getDirectDocumentFileUrl(
  doc?: DocumentUrlLike | null,
  options?: { preferEnvelopeFields?: boolean },
): string {
  if (!doc) return ''

  const raw = options?.preferEnvelopeFields
    ? getEnvelopeDocumentFileUrl(doc)
    : getCurrentFileUrl(doc) || getEnvelopeDocumentFileUrl(doc)

  return raw ? resolveBackendUrl(raw) : ''
}

/** Authenticated backend preview stream — works without CloudFront CORS. */
export function getDocumentPreviewApiUrl(doc?: DocumentUrlLike | null): string {
  if (!doc?.id) return ''
  const apiBase = getApiBaseUrl().replace(/\/$/, '')
  const cacheBuster = doc.updated_at
    ? `?v=${encodeURIComponent(doc.updated_at)}`
    : ''
  return `${apiBase}/documents/${doc.id}/preview/${cacheBuster}`
}

/**
 * Resolved URL for in-app PDF viewers.
 *
 * By default pdf.js uses the authenticated preview API for CloudFront URLs
 * (avoids CORS until NEXT_PUBLIC_PDF_DIRECT_CDN=true). Set that env var once
 * CloudFront CORS + signed URLs are configured for direct browser fetch.
 */
export function shouldUseDirectCdnInViewer(): boolean {
  return process.env.NEXT_PUBLIC_PDF_DIRECT_CDN === 'true'
}

export function getDocumentFileUrlForViewer(
  doc?: DocumentUrlLike | null,
  options?: { preferEnvelopeFields?: boolean; usePreviewApi?: boolean },
): string {
  if (!doc) return ''
  if (options?.usePreviewApi) return getDocumentPreviewApiUrl(doc)

  const direct = getDirectDocumentFileUrl(doc, options)
  if (direct && isExternalDocumentUrl(direct) && !shouldUseDirectCdnInViewer()) {
    return getDocumentPreviewApiUrl(doc)
  }
  if (direct) return direct

  return getDocumentPreviewApiUrl(doc)
}

/** Whether a direct CDN fetch failed and callers should retry via preview API. */
export function shouldFallbackToPreviewApi(
  directUrl: string,
  usePreviewFallback: boolean,
  docId?: string,
): boolean {
  return Boolean(docId && isExternalDocumentUrl(directUrl) && !usePreviewFallback)
}

export type PdfJsDocumentOptions = {
  password?: string
  httpHeaders?: Record<string, string>
  withCredentials?: boolean
  disableRange?: boolean
  disableStream?: boolean
  useWorkerFetch?: boolean
}

/**
 * pdf.js load options for a resolved document URL.
 *
 * External CDN URLs must not receive app JWT headers. Range requests trigger
 * CORS preflight against CloudFront, so they are disabled; streaming stays on
 * so pdf.js can render while the full GET download progresses.
 */
export function getPdfJsDocumentOptions(
  documentUrl: string | undefined,
  options?: { password?: string; accessToken?: string },
): PdfJsDocumentOptions | undefined {
  const opts: PdfJsDocumentOptions = {}

  if (options?.password) {
    opts.password = options.password
  }

  if (documentUrl && documentUrlNeedsAuth(documentUrl) && options?.accessToken) {
    opts.httpHeaders = { Authorization: `Bearer ${options.accessToken}` }
  }

  if (documentUrl && isExternalDocumentUrl(documentUrl)) {
    opts.withCredentials = false
    opts.disableRange = true
    opts.disableStream = false
    opts.useWorkerFetch = false
  }

  return Object.keys(opts).length > 0 ? opts : undefined
}

/** Stable identity for resetting PDF viewer state (excludes volatile signed URL query params). */
export function getDocumentViewerRevisionKey(doc?: DocumentUrlLike | null): string {
  if (!doc?.id) return ''
  return `${doc.id}:${doc.updated_at ?? ''}`
}
