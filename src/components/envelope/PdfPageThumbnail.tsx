'use client'

import { useEffect, useMemo, useState } from 'react'
import { Document as PDFDocument, Page, pdfjs } from 'react-pdf'
import { useSession } from 'next-auth/react'
import { getCachedAccessToken } from '@/lib/auth-session-cache'
import { cn } from '@/lib/utils'
import type { DocumentUrlLike } from '@/lib/url'
import {
  getDirectDocumentFileUrl,
  getDocumentFileUrlForViewer,
  getDocumentViewerRevisionKey,
  getPdfJsDocumentOptions,
  shouldFallbackToPreviewApi,
} from '@/lib/url'

if (typeof window !== 'undefined') {
  const origin = window.location.origin
  try {
    pdfjs.GlobalWorkerOptions.workerSrc = `${origin}/pdf.worker.min.mjs`
  } catch {
    pdfjs.GlobalWorkerOptions.workerSrc = `${origin}/pdf.worker.min.js`
  }
}

interface PdfPageThumbnailProps {
  document?: DocumentUrlLike | null
  pageNumber: number
  isActive?: boolean
  onClick?: () => void
  label?: string
}

export function PdfPageThumbnail({
  document,
  pageNumber,
  isActive = false,
  onClick,
  label,
}: PdfPageThumbnailProps) {
  const { data: session } = useSession()
  const accessToken =
    (session?.accessToken as string | undefined) ?? getCachedAccessToken() ?? undefined
  const [usePreviewFallback, setUsePreviewFallback] = useState(false)

  const documentRevisionKey = getDocumentViewerRevisionKey(document)

  useEffect(() => {
    setUsePreviewFallback(false)
  }, [documentRevisionKey])

  const documentUrl = useMemo(
    () => getDocumentFileUrlForViewer(document, { usePreviewApi: usePreviewFallback }),
    [document, usePreviewFallback],
  )

  const pdfOptions = useMemo(
    () => getPdfJsDocumentOptions(documentUrl, { accessToken }),
    [accessToken, documentUrl],
  )

  if (!documentUrl) {
    return (
      <div className="flex aspect-[3/4] w-full items-center justify-center rounded-lg border border-border bg-surface-container text-caption-xs text-muted">
        Preview unavailable
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full flex-col items-center gap-2 text-left transition-opacity hover:opacity-100',
        !isActive && 'opacity-60',
      )}
    >
      <div
        className={cn(
          'relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm',
          isActive ? 'border-2 border-secondary' : 'border border-border',
        )}
      >
        <PDFDocument
          key={`${document?.id ?? 'doc'}-${pageNumber}-${usePreviewFallback ? 'preview' : 'direct'}`}
          file={documentUrl}
          onLoadError={() => {
            const directUrl = getDirectDocumentFileUrl(document)
            if (shouldFallbackToPreviewApi(directUrl, usePreviewFallback, document?.id)) {
              setUsePreviewFallback(true)
            }
          }}
          loading={
            <div className="flex h-full w-full items-center justify-center bg-surface-container text-caption-xs text-muted">
              …
            </div>
          }
          error={
            <div className="flex h-full w-full items-center justify-center bg-surface-container p-2 text-center text-[10px] text-muted">
              Preview unavailable
            </div>
          }
          options={pdfOptions}
        >
          <Page
            pageNumber={pageNumber}
            width={160}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </PDFDocument>
      </div>
      <span
        className={cn(
          'text-caption-xs',
          isActive ? 'font-bold text-secondary' : 'text-muted',
        )}
      >
        {label ?? `Page ${pageNumber}`}
      </span>
    </button>
  )
}
