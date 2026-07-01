'use client'

import { useMemo } from 'react'
import { Document as PDFDocument, Page, pdfjs } from 'react-pdf'
import { useSession } from 'next-auth/react'
import { getApiBaseUrl } from '@/lib/env'
import { cn } from '@/lib/utils'

if (typeof window !== 'undefined') {
  const origin = window.location.origin
  try {
    pdfjs.GlobalWorkerOptions.workerSrc = `${origin}/pdf.worker.min.mjs`
  } catch {
    pdfjs.GlobalWorkerOptions.workerSrc = `${origin}/pdf.worker.min.js`
  }
}

interface PdfPageThumbnailProps {
  documentId: string
  pageNumber: number
  isActive?: boolean
  onClick?: () => void
  label?: string
}

export function PdfPageThumbnail({
  documentId,
  pageNumber,
  isActive = false,
  onClick,
  label,
}: PdfPageThumbnailProps) {
  const { data: session } = useSession()
  const accessToken = session?.accessToken as string | undefined

  const documentUrl = useMemo(() => {
    const apiBase = getApiBaseUrl().replace(/\/$/, '')
    return `${apiBase}/documents/${documentId}/preview/`
  }, [documentId])

  const pdfOptions = useMemo(() => {
    if (!accessToken) return undefined
    return { httpHeaders: { Authorization: `Bearer ${accessToken}` } }
  }, [accessToken])

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
          file={documentUrl}
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
