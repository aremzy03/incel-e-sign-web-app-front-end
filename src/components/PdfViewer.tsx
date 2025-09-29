'use client'

import { useEffect, useMemo, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { Button } from '@/components/ui/button'
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

// Configure pdf.js worker to load from local module path matching installed version
// Use the ESM worker shipped by pdfjs-dist@5.3.93
pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

interface PdfViewerProps {
  url: string
  className?: string
}

export default function PdfViewer({ url, className }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.2)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Resolve relative URLs to backend origin (e.g., when file_url is '/media/...')
  const resolvedUrl = useMemo(() => {
    if (!url) return url
    if (/^https?:\/\//i.test(url)) return url
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
    let backendOrigin = 'http://localhost:8000'
    try {
      backendOrigin = new URL(apiBase).origin
    } catch (_) {
      // fallback kept
    }
    const path = url.startsWith('/') ? url : `/${url}`
    return `${backendOrigin}${path}`
  }, [url])

  const onDocumentLoadSuccess = ({ numPages: nextNumPages }: { numPages: number }) => {
    setNumPages(nextNumPages)
    setPageNumber(1)
    setLoading(false)
    setError(null)
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
  }, [resolvedUrl])

  return (
    <div className={className}>
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

      <div className="border border-t-0 rounded-b-md bg-gray-50 flex items-center justify-center min-h-[640px] overflow-auto">
        {loading && !error && (
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading PDF...
          </div>
        )}
        {error && (
          <div className="text-sm text-red-600 px-4 py-2">{error}</div>
        )}
        {!error && (
          <Document file={resolvedUrl} onLoadSuccess={onDocumentLoadSuccess} onLoadError={onDocumentLoadError} loading="">
            <Page pageNumber={pageNumber} scale={scale} renderTextLayer={false} renderAnnotationLayer={false} />
          </Document>
        )}
      </div>
    </div>
  )
}


