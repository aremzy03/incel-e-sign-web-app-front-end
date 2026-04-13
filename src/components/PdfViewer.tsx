'use client'

import { useEffect, useMemo, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { getApiBaseUrl } from '@/lib/env'
import { Button } from '@/components/ui/button'
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { usePdfPasswordDialog } from '@/components/pdf/usePdfPasswordDialog'

// Configure pdf.js worker to bundled file to avoid network fetch issues
// Prefer a locally bundled worker to avoid network fetch issues
// Try v5 ESM worker first, then fallback to classic .js worker, finally CDN as last resort
// Use classic worker filename bundled locally; avoid ESM worker to keep Next 14 happy
// Use locally served worker with correct origin/port; fallback to CDN
// Robust worker resolution without bundling import: use local public file on client, CDN on server
if (typeof window !== 'undefined') {
  const origin = window.location.origin
  // Prefer ESM worker if the browser supports module workers, else classic
  try {
    // Use module worker path when available
    // @ts-ignore
    pdfjs.GlobalWorkerOptions.workerSrc = `${origin}/pdf.worker.min.mjs`
  } catch {
    pdfjs.GlobalWorkerOptions.workerSrc = `${origin}/pdf.worker.min.js`
  }
} else {
  // During SSR, provide a placeholder; client replaces on hydrate
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
  /**
   * Optional password for opening password-protected PDFs.
   * When provided, it will be passed directly to pdf.js to avoid in-viewer prompts.
   */
  pdfPassword?: string
  /**
   * Optional HTTP headers (e.g. Authorization) for authenticated backend URLs.
   * Passed to react-pdf's Document when loading PDFs from URLs that require auth.
   */
  httpHeaders?: Record<string, string>
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
    onPageChange && onPageChange(next)
  }
  const [scale, setScale] = useState<number>(1.2)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useState<HTMLDivElement | null>(null)[0]
  const password = usePdfPasswordDialog()

  const pdfOptions = useMemo(
    () => {
      const opts: { password?: string; httpHeaders?: Record<string, string> } = {}
      if (pdfPassword) opts.password = pdfPassword
      if (httpHeaders) opts.httpHeaders = httpHeaders
      return Object.keys(opts).length > 0 ? opts : undefined
    },
    [pdfPassword, httpHeaders]
  )

  // Resolve relative URLs to backend origin (e.g., when file_url is '/media/...')
  const resolvedUrl = useMemo(() => {
    if (!url) return url
    // For blob: URLs created on the frontend, use as-is so the browser
    // looks them up on the correct origin instead of rewriting to backend.
    if (/^blob:/i.test(url)) return url
    if (/^https?:\/\//i.test(url)) return url
    const apiBase = getApiBaseUrl()
    let backendOrigin = apiBase
    try {
      backendOrigin = new URL(apiBase).origin
    } catch (_) {
      // keep apiBase as-is if URL parsing fails
    }
    const path = url.startsWith('/') ? url : `/${url}`
    return `${backendOrigin}${path}`
  }, [url])

  const onDocumentLoadSuccess = ({ numPages: nextNumPages, _page }: { numPages: number; _page?: any }) => {
    setNumPages(nextNumPages)
    setPageNumber(1)
    setLoading(false)
    setError(null)
    onDocumentLoad && onDocumentLoad(nextNumPages)
  }

  const onDocumentLoadError = (err: any) => {
    setError(err?.message || 'Failed to load PDF')
    setLoading(false)
  }

  const canPrev = pageNumber > 1
  const canNext = pageNumber < numPages

  const handlePrev = () => canPrev && setPageNumber(p => p - 1)
  const handleNext = () => canNext && setPageNumber(p => p + 1)
  const handleZoomIn = () => setScale(s => Math.min(2.5, s + 0.1))
  const handleZoomOut = () => setScale(s => Math.max(0.5, s - 0.1))

  // Reset when URL changes
  useEffect(() => {
    setLoading(true)
    setError(null)
    setPageNumber(1)
    password.reset()
  }, [resolvedUrl])

  return (
    <div className={className}>
      {showControls && (
      <div className="flex items-center justify-between px-3 py-2 border rounded-t-md bg-white">
        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" onClick={handleZoomOut} aria-label="Zoom out">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <div className="text-sm text-gray-700">{Math.round(scale * 100)}%</div>
          <Button size="icon" variant="outline" onClick={handleZoomIn} aria-label="Zoom in">
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" onClick={handlePrev} disabled={!canPrev} aria-label="Previous page">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm text-gray-700">Page {pageNumber} of {numPages || '?'}</div>
          <Button size="icon" variant="outline" onClick={handleNext} disabled={!canNext} aria-label="Next page">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      )}

      <div className={`border ${showControls ? 'border-t-0 rounded-b-md' : 'rounded-md'} bg-gray-50 flex flex-col items-center min-h-[400px] overflow-auto py-4`}>
        {loading && !error && (
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading PDF...
          </div>
        )}
        {error && (
          <div className="text-sm text-red-600 px-4 py-2">{error}</div>
        )}
        {password.dialog}
        {!error && !password.cancelled && (
          <Document
            file={resolvedUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            onPassword={password.onPassword as any}
            loading=""
            options={pdfOptions}
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              onRenderSuccess={(page: any) => {
                try {
                  const widthPt = page.view?.[2] ?? page.width ?? 0
                  const heightPt = page.view?.[3] ?? page.height ?? 0
                  const canvases = document.querySelectorAll('canvas')
                  // Use the last canvas (current page) to approximate rendered px size
                  const lastCanvas = canvases[canvases.length - 1] as HTMLCanvasElement | undefined
                  const widthPx = lastCanvas?.clientWidth || lastCanvas?.width || 0
                  const heightPx = lastCanvas?.clientHeight || lastCanvas?.height || 0
                  onPageRender && onPageRender({ widthPt, heightPt, widthPx, heightPx })
                } catch (_) {
                  // ignore
                }
              }}
            />
          </Document>
        )}
        {password.cancelled && (
          <div className="text-sm text-gray-600 px-4 py-2">PDF preview cancelled.</div>
        )}
      </div>
    </div>
  )
}


