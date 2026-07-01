'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Document as PDFDocument, Page, pdfjs } from 'react-pdf'
import { useDroppable } from '@dnd-kit/core'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getApiBaseUrl } from '@/lib/env'
import { cn } from '@/lib/utils'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { FieldBox } from './FieldBox'
import { FieldPosition, RecipientInput } from '@/types/envelope'
import { Document as DocumentType } from '@/lib/api/documents'
import { useSession } from 'next-auth/react'
import { usePdfPasswordDialog } from '@/components/pdf/usePdfPasswordDialog'
import { PdfLoadingIndicator } from '@/components/pdf/PdfLoadingIndicator'
import { MaterialIcon } from '@/components/ui/material-icon'

// Configure PDF.js worker
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

interface VerticalPDFViewerProps {
  documents: DocumentType[]
  fieldPositions: Record<string, Record<string, FieldPosition>>
  recipients: RecipientInput[]
  activeFieldId: string | null
  onFieldSelect: (fieldId: string) => void
  onFieldPositionChange: (fieldId: string, position: Partial<FieldPosition>) => void
  onFieldDelete: (fieldId: string) => void
  onFieldDrop: (fieldType: string, documentId: string, page: number, x: number, y: number) => void
  onPageMetricsChange?: (pageKey: string, metrics: { baseWidthPxAtScale1: number; baseHeightPxAtScale1: number; scale: number }) => void
  /**
   * Optional password for opening password-protected PDFs when previewing documents.
   * Typically provided from the envelope's pdf_lock_password once completed.
   */
  pdfPassword?: string
  /** Full-height layout for wizard editor — constrains scroll to the canvas area. */
  editorLayout?: boolean
  /** Multiplier applied on top of the editor base scale (1.0 = 100%). */
  viewerScale?: number
  /** Called when the resolved page list changes (after PDF metadata loads). */
  onPagesChange?: (pages: DocumentPageInfo[]) => void
  /** Scroll the canvas to this page key (`documentId-pageNumber`). */
  scrollToPageKey?: string | null
  /** Currently visible page in the canvas (for thumbnail highlighting). */
  activePageKey?: string | null
  onActivePageKeyChange?: (pageKey: string) => void
  /** View-only mode — no drop zones or field placement affordances. */
  readOnly?: boolean
}

interface DocumentPageInfo {
  documentId: string
  pageNumber: number
  totalPages: number
  documentName: string
}

export type { DocumentPageInfo }

export function VerticalPDFViewer({
  documents,
  fieldPositions,
  recipients,
  activeFieldId,
  onFieldSelect,
  onFieldPositionChange,
  onFieldDelete,
  onFieldDrop,
  onPageMetricsChange,
  pdfPassword,
  editorLayout = false,
  viewerScale = 1,
  onPagesChange,
  scrollToPageKey,
  activePageKey,
  onActivePageKeyChange,
  readOnly = false,
}: VerticalPDFViewerProps) {
  const { data: session } = useSession()
  const password = usePdfPasswordDialog()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [documentPages, setDocumentPages] = useState<Record<string, number>>({})
  const [pageDimensions, setPageDimensions] = useState<Record<string, { width: number; height: number }>>({})
  const [actualPDFDimensions, setActualPDFDimensions] = useState<Record<string, { width: number; height: number }>>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const scale = (editorLayout ? 1.2 : 1) * viewerScale

  const accessToken = session?.accessToken as string | undefined

  const pdfOptions = useMemo(() => {
    const opts: { password?: string; httpHeaders?: Record<string, string> } = {}
    if (pdfPassword) opts.password = pdfPassword
    if (accessToken) opts.httpHeaders = { Authorization: `Bearer ${accessToken}` }
    return Object.keys(opts).length > 0 ? opts : undefined
  }, [pdfPassword, accessToken])

  useEffect(() => {
    // If the caller supplies a password (e.g. completed envelope lock), we should not show prompts.
    // When documents change, reset any previous cancel state.
    password.reset()
  }, [documents.length])

  const validDocuments = useMemo(
    () => documents.filter((doc) => Boolean(doc?.id)),
    [documents],
  )

  // Calculate all pages to render
  const allPages: DocumentPageInfo[] = useMemo(
    () =>
      validDocuments.flatMap((doc) => {
        const totalPages = documentPages[doc.id] || 1
        return Array.from({ length: totalPages }, (_, i) => ({
          documentId: doc.id,
          pageNumber: i + 1,
          totalPages,
          documentName: doc.file_name,
        }))
      }),
    [validDocuments, documentPages],
  )

  useEffect(() => {
    onPagesChange?.(allPages)
  }, [allPages, onPagesChange])

  useEffect(() => {
    if (!scrollToPageKey || !containerRef.current) return
    const target = containerRef.current.querySelector(
      `[data-scroll-page-key="${scrollToPageKey}"]`,
    )
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [scrollToPageKey])

  useEffect(() => {
    if (!editorLayout || !onActivePageKeyChange || !containerRef.current) return

    const root = containerRef.current
    const pageElements = Array.from(
      root.querySelectorAll<HTMLElement>('[data-scroll-page-key]'),
    )
    if (pageElements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        const top = visible[0]?.target.getAttribute('data-scroll-page-key')
        if (top) onActivePageKeyChange(top)
      },
      { root, threshold: [0.25, 0.5, 0.75] },
    )

    pageElements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [allPages.length, editorLayout, onActivePageKeyChange])

  const onDocumentLoadSuccess = useCallback((documentId: string, numPages: number) => {
    setDocumentPages(prev => ({ ...prev, [documentId]: numPages }))
    setIsLoading(false)
  }, [])

  const getActualPDFDimensions = useCallback((documentId: string, pageNumber: number) => {
    const pageKey = `${documentId}-${pageNumber}`
    const pdfElement = document.querySelector(`[data-page-key="${pageKey}"]`)
    if (pdfElement) {
      const rect = pdfElement.getBoundingClientRect()
      setActualPDFDimensions(prev => ({
        ...prev,
        [pageKey]: { width: rect.width, height: rect.height }
      }))
    }
  }, [])

  const onPageLoadSuccess = useCallback((documentId: string, pageNumber: number, page: any) => {
    if (page) {
      const { width, height } = page.getViewport({ scale })
      setPageDimensions(prev => ({
        ...prev,
        [`${documentId}-${pageNumber}`]: { width, height }
      }))
      try {
        onPageMetricsChange?.(`${documentId}-${pageNumber}`, { baseWidthPxAtScale1: width / scale, baseHeightPxAtScale1: height / scale, scale })
      } catch {}

      setTimeout(() => {
        getActualPDFDimensions(documentId, pageNumber)
      }, 100)
    }
  }, [scale, getActualPDFDimensions, onPageMetricsChange])

  // Recalculate dimensions when new documents are added
  useEffect(() => {
    if (documents.length > 0) {
      // Small delay to ensure new documents are rendered
      const timer = setTimeout(() => {
        documents.forEach(doc => {
          const totalPages = documentPages[doc.id] || 1
          for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
            getActualPDFDimensions(doc.id, pageNumber)
          }
        })
      }, 300)
      
      return () => clearTimeout(timer)
    }
  }, [documents, documentPages, getActualPDFDimensions])

  // Force recalculation when documents change (upload/remove)
  useEffect(() => {
    if (documents.length > 0) {
      const timer = setTimeout(() => {
        documents.forEach(doc => {
          const totalPages = documentPages[doc.id] || 1
          for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
            getActualPDFDimensions(doc.id, pageNumber)
          }
        })
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [documents.length, getActualPDFDimensions, documentPages])

  const handlePageClick = useCallback((documentId: string, pageNumber: number, event: React.MouseEvent) => {
    // Only handle clicks if we're in drop mode (when dragging from palette)
    // This will be handled by the drop zone
  }, [])

  const goToTop = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goToBottom = () => {
    containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' })
  }

  if (validDocuments.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center bg-surface-container-low p-8">
        <div className="inline-flex flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest px-8 py-10 shadow-sm">
          <MaterialIcon name="description" size={48} className="mb-3 text-muted" />
          <h3 className="mb-1 font-headline-lg text-headline-lg text-primary">No document loaded</h3>
          <p className="max-w-xs text-center font-body-sm text-body-sm text-muted">
            Upload a document or return to the upload step to get started.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`relative z-0 flex min-h-0 flex-col ${
        editorLayout
          ? 'h-full flex-1 bg-surface-container-low'
          : 'flex-1 rounded-xl border border-border bg-surface-container-low shadow-sm'
      }`}
    >
      {!editorLayout && (
        <div className="flex shrink-0 items-center justify-between border-b bg-white/80 px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-on-surface">Document Preview</h3>
            <span className="text-sm text-muted">
              {documents.length} document{documents.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToTop}
              className="flex items-center gap-1"
            >
              <ChevronUp className="h-4 w-4" />
              Top
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToBottom}
              className="flex items-center gap-1"
            >
              <ChevronDown className="h-4 w-4" />
              Bottom
            </Button>
          </div>
        </div>
      )}

      {/* PDF Pages */}
      <div
        ref={containerRef}
        className={cn(
          'relative',
          editorLayout ? 'pdf-canvas-scroll-area-editor' : 'pdf-canvas-scroll-area px-4 py-4',
          !editorLayout && 'bg-surface-container-low',
        )}
      >
        {password.dialog}
        {isLoading && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-surface-container-low/80">
            <PdfLoadingIndicator label="Loading document…" />
          </div>
        )}
        {error && editorLayout && (
          <div className="absolute left-4 right-4 top-4 z-20 flex items-center gap-2 rounded-lg border border-error/20 bg-error-light px-4 py-3 font-body-sm text-body-sm text-error md:left-8 md:right-8">
            <MaterialIcon name="error_outline" size={18} />
            <span>{error}</span>
          </div>
        )}
        <div className="flex flex-col items-center gap-6">
        {allPages.map((pageInfo) => {
          const document = validDocuments.find((d) => d.id === pageInfo.documentId)
          if (!document || !pageInfo.documentId) return null

          // Always go through authenticated backend preview endpoint so we avoid direct S3 CORS issues
          const apiBase = getApiBaseUrl().replace(/\/$/, '')
          const documentUrl = `${apiBase}/documents/${pageInfo.documentId}/preview/`
          const pageKey = `${pageInfo.documentId}-${pageInfo.pageNumber}`
          const currentPageDimensions = pageDimensions[pageKey]
          const pageWidth = actualPDFDimensions[pageKey]?.width || currentPageDimensions?.width || 595 * scale
          const pageHeight = actualPDFDimensions[pageKey]?.height || currentPageDimensions?.height || 842 * scale
          const fieldsForPage = Object.values(fieldPositions[pageInfo.documentId] || {})
            .filter(field => Number(field.page) === pageInfo.pageNumber)

          return (
            <div
              key={pageKey}
              data-scroll-page-key={pageKey}
              className={cn(
                'relative w-full scroll-mt-4',
                editorLayout ? 'max-w-[850px]' : 'max-w-4xl',
              )}
            >
              {/* Document Header */}
              {pageInfo.pageNumber === 1 && !editorLayout && (
                <Card className="mb-3 shadow-none border border-border bg-white/90">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-on-surface">
                      {pageInfo.documentName}
                    </CardTitle>
                  </CardHeader>
                </Card>
              )}

              {/* Page Container */}
              <div className="relative inline-flex w-full justify-center z-0">
                <div
                  className={cn(
                    editorLayout && readOnly && 'pdf-page-frame-readonly',
                    editorLayout && !readOnly && 'pdf-page-frame',
                    !editorLayout && 'relative flex min-h-[420px] items-center justify-center overflow-hidden rounded-lg border border-border bg-white shadow',
                  )}
                >
                  {readOnly && editorLayout && (
                    <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center overflow-hidden opacity-[0.03]">
                      <div className="rotate-[-45deg] scale-150 whitespace-nowrap text-[64px] font-black uppercase text-primary">
                        Preview Only
                      </div>
                    </div>
                  )}
                  <PageShell
                    readOnly={readOnly}
                    documentId={pageInfo.documentId}
                    pageNumber={pageInfo.pageNumber}
                    onFieldDrop={onFieldDrop}
                    width={pageWidth}
                    height={pageHeight}
                  >
                    <div
                      className="relative"
                      style={{ width: pageWidth, height: pageHeight }}
                    >
                      {/* PDF Content (fills wrapper) */}
                      <div className="absolute inset-0">
                        {!error && !password.cancelled && (
                          <PDFDocument
                            file={documentUrl}
                            onLoadSuccess={(pdf) => onDocumentLoadSuccess(pageInfo.documentId, pdf.numPages)}
                            onLoadError={(error) => {
                              console.error('PDF load error:', error)
                              setError(`Failed to load PDF: ${error.message}`)
                            }}
                            onPassword={password.onPassword as any}
                            loading=""
                            options={pdfOptions}
                          >
                            <Page
                              pageNumber={pageInfo.pageNumber}
                              scale={scale}
                              renderTextLayer={false}
                              renderAnnotationLayer={false}
                              onLoadSuccess={(page) => onPageLoadSuccess(pageInfo.documentId, pageInfo.pageNumber, page)}
                              className="block"
                              data-page-key={`${pageInfo.documentId}-${pageInfo.pageNumber}`}
                            />
                          </PDFDocument>
                        )}
                        {password.cancelled && (
                          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted bg-white/70">
                            PDF preview cancelled.
                          </div>
                        )}
                      </div>

                      {/* Field Overlays - fills the same wrapper */}
                      {!readOnly && (
                        <div className="absolute inset-0 pointer-events-none z-[999]">
                          {fieldsForPage.map(field => (
                            <FieldBox
                              key={field.id}
                              field={field}
                              recipients={recipients}
                              isActive={activeFieldId === field.id}
                              onPositionChange={onFieldPositionChange}
                              onSelect={onFieldSelect}
                              onDelete={onFieldDelete}
                              maxWidth={pageWidth}
                              maxHeight={pageHeight}
                              variant={editorLayout ? 'editor' : 'default'}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </PageShell>
                </div>
              </div>

              {/* Page Footer */}
              <div className={editorLayout ? 'pdf-page-footer' : 'mt-2 text-center'}>
                <span
                  className={cn(
                    editorLayout
                      ? 'font-caption-xs text-caption-xs italic text-muted'
                      : 'text-xs text-muted',
                  )}
                >
                  {editorLayout
                    ? pageInfo.pageNumber === pageInfo.totalPages
                      ? `End of page ${pageInfo.pageNumber}`
                      : `Page ${pageInfo.pageNumber} of ${pageInfo.totalPages}`
                    : `Page ${pageInfo.pageNumber} of ${pageInfo.totalPages}`}
                </span>
              </div>
            </div>
          )
        })}
        </div>
      </div>
    </div>
  )
}

interface PageShellProps {
  readOnly: boolean
  documentId: string
  pageNumber: number
  onFieldDrop: (fieldType: string, documentId: string, page: number, x: number, y: number) => void
  width?: number
  height?: number
  children: React.ReactNode
}

function PageShell({ readOnly, documentId, pageNumber, onFieldDrop, width, height, children }: PageShellProps) {
  if (readOnly) {
    return (
      <div className="relative z-0 inline-block" style={{ width, height }}>
        {children}
      </div>
    )
  }

  return (
    <PageDropZone
      documentId={documentId}
      pageNumber={pageNumber}
      onFieldDrop={onFieldDrop}
      width={width}
      height={height}
    >
      {children}
    </PageDropZone>
  )
}

interface PageDropZoneProps {
  documentId: string
  pageNumber: number
  onFieldDrop: (fieldType: string, documentId: string, page: number, x: number, y: number) => void
  width?: number
  height?: number
  children: React.ReactNode
}

function PageDropZone({ documentId, pageNumber, onFieldDrop, width, height, children }: PageDropZoneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `page-${documentId}-${pageNumber}`,
    data: {
      type: 'page',
      documentId,
      pageNumber,
    },
  })

  return (
    <div
      ref={setNodeRef}
      className={`relative z-0 inline-block ${isOver ? 'ring-2 ring-status-your-turn ring-opacity-50' : ''}`}
      style={{ width, height }}
    >
      {children}
    </div>
  )
}