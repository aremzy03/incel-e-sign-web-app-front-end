'use client'

import { useEffect, useMemo, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { getApiBaseUrl } from '@/lib/env'
import { cn } from '@/lib/utils'
import { usePdfPasswordDialog } from '@/components/pdf/usePdfPasswordDialog'
import { PdfLoadingIndicator } from '@/components/pdf/PdfLoadingIndicator'
import { MaterialIcon } from '@/components/ui/material-icon'
import {
  SIGNING_ZOOM_DEFAULT,
  SIGNING_ZOOM_MAX,
  SIGNING_ZOOM_MIN,
  SIGNING_ZOOM_STEP,
  SigningToolbar,
} from '@/components/signing/signing-toolbar'

if (typeof window !== 'undefined') {
  const origin = window.location.origin
  try {
    pdfjs.GlobalWorkerOptions.workerSrc = `${origin}/pdf.worker.min.mjs`
  } catch {
    pdfjs.GlobalWorkerOptions.workerSrc = `${origin}/pdf.worker.min.js`
  }
} else {
  pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`
}

interface PdfViewerProps {
  url: string
  className?: string
  showControls?: boolean
  pageNumber?: number
  onPageChange?: (page: number) => void
  onDocumentLoad?: (numPages: number) => void
  onPageRender?: (info: { widthPt: number; heightPt: number; widthPx: number; heightPx: number }) => void
  pdfPassword?: string
  httpHeaders?: Record<string, string>
  /** Design-system canvas layout with dot grid background. */
  editorStyle?: boolean
}

export default function PdfViewer({
  url,
  className,
  showControls = true,
  pageNumber: controlledPageNumber,
  onPageChange,
  onDocumentLoad,
  onPageRender,
  pdfPassword,
  httpHeaders,
  editorStyle = true,
}: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const isControlled = typeof controlledPageNumber === 'number'
  const [uncontrolledPage, setUncontrolledPage] = useState<number>(1)
  const pageNumber = isControlled ? (controlledPageNumber as number) : uncontrolledPage
  const setPageNumber = (updater: number | ((p: number) => number)) => {
    const next = typeof updater === 'function' ? (updater as (p: number) => number)(pageNumber) : updater
    if (!isControlled) {
      setUncontrolledPage(next)
    }
    onPageChange?.(next)
  }
  const [zoom, setZoom] = useState(SIGNING_ZOOM_DEFAULT)
  const scale = (editorStyle ? 1.2 : 1) * (zoom / 100)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const password = usePdfPasswordDialog()

  const pdfOptions = useMemo(() => {
    const opts: { password?: string; httpHeaders?: Record<string, string> } = {}
    if (pdfPassword) opts.password = pdfPassword
    if (httpHeaders) opts.httpHeaders = httpHeaders
    return Object.keys(opts).length > 0 ? opts : undefined
  }, [pdfPassword, httpHeaders])

  const resolvedUrl = useMemo(() => {
    if (!url) return url
    if (/^blob:/i.test(url)) return url
    if (/^https?:\/\//i.test(url)) return url
    const apiBase = getApiBaseUrl()
    let backendOrigin = apiBase
    try {
      backendOrigin = new URL(apiBase).origin
    } catch {
      // keep apiBase as-is
    }
    const path = url.startsWith('/') ? url : `/${url}`
    return `${backendOrigin}${path}`
  }, [url])

  const onDocumentLoadSuccess = ({ numPages: nextNumPages }: { numPages: number }) => {
    setNumPages(nextNumPages)
    setPageNumber(1)
    setLoading(false)
    setError(null)
    onDocumentLoad?.(nextNumPages)
  }

  const onDocumentLoadError = (err: { message?: string }) => {
    setError(err?.message || 'Failed to load PDF')
    setLoading(false)
  }

  const canPrev = pageNumber > 1
  const canNext = pageNumber < numPages

  useEffect(() => {
    setLoading(true)
    setError(null)
    setPageNumber(1)
    password.reset()
  }, [resolvedUrl])

  const pageIndicator =
    numPages > 0 ? `Page ${pageNumber} of ${numPages}` : `Page ${pageNumber} of ?`

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      {showControls && (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-container-lowest px-4 py-3">
          <SigningToolbar
            zoom={zoom}
            onZoomIn={() => setZoom((z) => Math.min(SIGNING_ZOOM_MAX, z + SIGNING_ZOOM_STEP))}
            onZoomOut={() => setZoom((z) => Math.max(SIGNING_ZOOM_MIN, z - SIGNING_ZOOM_STEP))}
            pageIndicator={pageIndicator}
            className="bg-surface-container"
          />
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="flex items-center justify-center rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => canPrev && setPageNumber((p) => p - 1)}
              disabled={!canPrev}
              aria-label="Previous page"
            >
              <MaterialIcon name="chevron_left" size={20} />
            </button>
            <button
              type="button"
              className="flex items-center justify-center rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => canNext && setPageNumber((p) => p + 1)}
              disabled={!canNext}
              aria-label="Next page"
            >
              <MaterialIcon name="chevron_right" size={20} />
            </button>
          </div>
        </div>
      )}

      <div
        className={cn(
          'relative flex min-h-[400px] flex-1 flex-col items-center overflow-auto',
          editorStyle ? 'pdf-canvas-scroll-area p-6' : 'rounded-md border border-border bg-surface-container-low py-4',
        )}
      >
        {loading && !error && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface-container-low/80">
            <PdfLoadingIndicator label="Loading PDF..." />
          </div>
        )}
        {error && (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <MaterialIcon name="error_outline" size={32} className="text-error" />
            <p className="font-body-sm text-body-sm text-error">{error}</p>
          </div>
        )}
        {password.dialog}
        {!error && !password.cancelled && (
          <div className="flex w-full max-w-[850px] flex-col items-center">
            <div className="pdf-page-frame-readonly relative w-full">
              <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center overflow-hidden opacity-[0.03]">
                <div className="rotate-[-45deg] scale-150 whitespace-nowrap text-[64px] font-black uppercase text-primary">
                  Preview Only
                </div>
              </div>
              <Document
                file={resolvedUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                onPassword={password.onPassword as (callback: (password: string) => void, reason: number) => void}
                loading=""
                options={pdfOptions}
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  onRenderSuccess={(page: { view?: number[]; width?: number; height?: number }) => {
                    try {
                      const widthPt = page.view?.[2] ?? page.width ?? 0
                      const heightPt = page.view?.[3] ?? page.height ?? 0
                      const canvases = document.querySelectorAll('canvas')
                      const lastCanvas = canvases[canvases.length - 1] as HTMLCanvasElement | undefined
                      const widthPx = lastCanvas?.clientWidth || lastCanvas?.width || 0
                      const heightPx = lastCanvas?.clientHeight || lastCanvas?.height || 0
                      onPageRender?.({ widthPt, heightPt, widthPx, heightPx })
                    } catch {
                      // ignore
                    }
                  }}
                />
              </Document>
            </div>
            {numPages > 0 && (
              <div className="pdf-page-footer w-full">
                <span className="font-caption-xs text-caption-xs italic text-muted">
                  End of page {pageNumber}
                </span>
              </div>
            )}
          </div>
        )}
        {password.cancelled && (
          <p className="px-4 py-2 font-body-sm text-body-sm text-muted">PDF preview cancelled.</p>
        )}
      </div>
    </div>
  )
}
