'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Document as PDFDocument, Page, pdfjs } from 'react-pdf'
import { useDroppable } from '@dnd-kit/core'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getApiBaseUrl } from '@/lib/env'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { FieldBox } from './FieldBox'
import { FieldPosition, RecipientInput } from '@/types/envelope'
import { Document as DocumentType } from '@/lib/api/documents'
import { useSession } from 'next-auth/react'
import { usePdfPasswordDialog } from '@/components/pdf/usePdfPasswordDialog'

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
}

interface DocumentPageInfo {
  documentId: string
  pageNumber: number
  totalPages: number
  documentName: string
}

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
}: VerticalPDFViewerProps) {
  const { data: session } = useSession()
  const password = usePdfPasswordDialog()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [documentPages, setDocumentPages] = useState<Record<string, number>>({})
  const [pageDimensions, setPageDimensions] = useState<Record<string, { width: number; height: number }>>({})
  const [actualPDFDimensions, setActualPDFDimensions] = useState<Record<string, { width: number; height: number }>>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const scale = 1

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

  // Calculate all pages to render
  const allPages: DocumentPageInfo[] = documents.flatMap(doc => {
    const totalPages = documentPages[doc.id] || 1
    return Array.from({ length: totalPages }, (_, i) => ({
      documentId: doc.id,
      pageNumber: i + 1,
      totalPages,
      documentName: doc.file_name,
    }))
  })

  const onDocumentLoadSuccess = useCallback((documentId: string, numPages: number) => {
    setDocumentPages(prev => ({ ...prev, [documentId]: numPages }))
    setIsLoading(false)
  }, [])

  const onPageLoadSuccess = useCallback((documentId: string, pageNumber: number, page: any) => {
    if (page) {
      const { width, height } = page.getViewport({ scale: 1.0 })
      console.log('PDF page loaded with dimensions:', { width, height, scale, documentId, pageNumber })
      setPageDimensions(prev => ({
        ...prev,
        [`${documentId}-${pageNumber}`]: { width, height }
      }))
      // Notify consumer with base metrics
      try {
        onPageMetricsChange?.(`${documentId}-${pageNumber}`, { baseWidthPxAtScale1: width, baseHeightPxAtScale1: height, scale })
      } catch {}
      
      // Get actual rendered dimensions after a short delay to ensure PDF is rendered
      setTimeout(() => {
        getActualPDFDimensions(documentId, pageNumber)
      }, 100)
    }
  }, [])

  // Function to get actual PDF dimensions
  const getActualPDFDimensions = useCallback((documentId: string, pageNumber: number) => {
    const pageKey = `${documentId}-${pageNumber}`
    const pdfElement = document.querySelector(`[data-page-key="${pageKey}"]`)
    if (pdfElement) {
      const rect = pdfElement.getBoundingClientRect()
      console.log('Actual PDF rendered dimensions:', { width: rect.width, height: rect.height, documentId, pageNumber })
      setActualPDFDimensions(prev => ({
        ...prev,
        [pageKey]: { width: rect.width, height: rect.height }
      }))
    }
  }, [])

  // Update actual dimensions when scale changes
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
      console.log('Documents changed, recalculating dimensions for:', documents.map(d => d.file_name))
      const timer = setTimeout(() => {
        documents.forEach(doc => {
          const totalPages = documentPages[doc.id] || 1
          for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
            getActualPDFDimensions(doc.id, pageNumber)
          }
        })
      }, 500) // Longer delay for new document uploads
      
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

  if (documents.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="inline-flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white/60 px-8 py-10 shadow-sm">
          <div className="text-5xl mb-3">📄</div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">No document loaded</h3>
          <p className="text-sm text-gray-600 text-center max-w-xs">
            Use the panel on the left to upload or choose a document to start placing fields.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 rounded-xl border border-gray-200 shadow-sm relative z-0">
      {/* Controls */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white/80">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">Document Preview</h3>
          <span className="text-sm text-gray-500">
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

      {/* PDF Pages */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        {password.dialog}
        <div className="flex flex-col items-center gap-4">
        {allPages.map((pageInfo, index) => {
          const document = documents.find(d => d.id === pageInfo.documentId)
          if (!document) return null

          // Always go through authenticated backend preview endpoint so we avoid direct S3 CORS issues
          const apiBase = getApiBaseUrl().replace(/\/$/, '')
          const documentUrl = `${apiBase}/documents/${pageInfo.documentId}/preview/`
          const pageKey = `${pageInfo.documentId}-${pageInfo.pageNumber}`
          const currentPageDimensions = pageDimensions[pageKey]
          const pageWidth = actualPDFDimensions[pageKey]?.width || currentPageDimensions?.width || 595
          const pageHeight = actualPDFDimensions[pageKey]?.height || currentPageDimensions?.height || 842
          const fieldsForPage = Object.values(fieldPositions[pageInfo.documentId] || {})
            .filter(field => field.page === pageInfo.pageNumber)

          return (
            <div key={pageKey} className="relative w-full max-w-4xl">
              {/* Document Header */}
              {pageInfo.pageNumber === 1 && (
                <Card className="mb-3 shadow-none border border-gray-200 bg-white/90">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-900">
                      {pageInfo.documentName}
                    </CardTitle>
                  </CardHeader>
                </Card>
              )}

              {/* Page Container */}
              <div className="relative inline-flex justify-center w-full z-0">
                <div className="relative border border-gray-200 rounded-lg overflow-hidden shadow bg-white flex items-center justify-center min-h-[420px]">
                  {/* Make the sized wrapper the actual droppable so over.rect matches overlay coords */}
                  <PageDropZone
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
                          <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-600 bg-white/70">
                            PDF preview cancelled.
                          </div>
                        )}
                      </div>

                      {/* Field Overlays - fills the same wrapper */}
                      {currentPageDimensions && (
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
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </PageDropZone>
                </div>
              </div>

              {/* Page Footer */}
              <div className="text-center text-xs text-gray-500 mt-2">
                Page {pageInfo.pageNumber} of {pageInfo.totalPages}
              </div>
            </div>
          )
        })}
        </div>
      </div>
    </div>
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
      className={`relative z-0 inline-block ${isOver ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
      style={{ width, height }}
    >
      {children}
    </div>
  )
}