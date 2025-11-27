'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import { SignatureBox } from './SignatureBox'
import { toast } from 'react-hot-toast'
import { getApiBaseUrl } from '@/lib/env'

// Configure PDF.js worker (same as existing PdfViewer)
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

interface Signer {
  id: string
  name: string
  email: string
  order: number
}

interface SignaturePosition {
  page: number
  x: number
  y: number
  width: number
  height: number
}

interface PDFViewerWithSignaturesProps {
  documentUrl: string
  signers: Signer[]
  activeSigner: string | null
  onSignerSelect: (signerId: string) => void
  onPositionChange: (signerId: string, position: SignaturePosition) => void
  positions: Record<string, SignaturePosition>
}

const SIGNER_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
]

export function PDFViewerWithSignatures({
  documentUrl,
  signers,
  activeSigner,
  onSignerSelect,
  onPositionChange,
  positions,
}: PDFViewerWithSignaturesProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number } | null>(null)
  const overlayRef = useRef<HTMLDivElement | null>(null)

  // Resolve relative URLs to backend origin (same as existing PdfViewer)
  const resolvedUrl = React.useMemo(() => {
    if (!documentUrl) return documentUrl
    if (/^https?:\/\//i.test(documentUrl)) return documentUrl
    const apiBase = getApiBaseUrl()
    let backendOrigin = apiBase
    try {
      backendOrigin = new URL(apiBase).origin
    } catch (_) {
      // keep apiBase as-is if URL parsing fails
    }
    const path = documentUrl.startsWith('/') ? documentUrl : `/${documentUrl}`
    return `${backendOrigin}${path}`
  }, [documentUrl])

  // Reset when URL changes
  useEffect(() => {
    console.log('PDF Viewer: URL changed to:', resolvedUrl)
    console.log('PDF Viewer: Original URL:', documentUrl)
    setIsLoading(true)
    setError(null)
    setPageNumber(1)
    
    // Test if URL is accessible
    if (resolvedUrl) {
      fetch(resolvedUrl, { method: 'HEAD' })
        .then(response => {
          console.log('PDF Viewer: URL accessibility test:', response.status, response.statusText)
          if (!response.ok) {
            console.warn('PDF Viewer: URL is not accessible:', response.status)
          }
        })
        .catch(error => {
          console.error('PDF Viewer: URL accessibility test failed:', error)
        })
    }
  }, [resolvedUrl, documentUrl])

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log('PDF loaded successfully:', resolvedUrl, 'Pages:', numPages)
    setNumPages(numPages)
    setIsLoading(false)
    setError(null)
  }

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error)
    console.error('Failed URL:', resolvedUrl)
    console.error('Original URL:', documentUrl)
    setError(`Failed to load PDF document: ${error.message}`)
    setIsLoading(false)
    toast.error('Failed to load PDF document')
  }

  const handleZoomIn = () => {
    setPageDimensions(null) // Reset dimensions when zoom changes
    setScale(prev => Math.min(prev + 0.2, 3.0))
  }
  const handleZoomOut = () => {
    setPageDimensions(null) // Reset dimensions when zoom changes
    setScale(prev => Math.max(prev - 0.2, 0.5))
  }
  const handleResetZoom = () => {
    setPageDimensions(null) // Reset dimensions when zoom changes
    setScale(1.0)
  }

  const goToPrevPage = () => {
    setPageDimensions(null) // Reset dimensions when changing pages
    setPageNumber(prev => Math.max(prev - 1, 1))
  }
  const goToNextPage = () => {
    setPageDimensions(null) // Reset dimensions when changing pages
    setPageNumber(prev => Math.min(prev + 1, numPages))
  }

  const getSignerColor = (signerId: string) => {
    const index = signers.findIndex(s => s.id === signerId)
    return SIGNER_COLORS[index % SIGNER_COLORS.length]
  }

  const handleOverlayClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!activeSigner) {
        toast.error('Please select a signer first')
        return
      }

      // Get coordinates relative to the overlay that sits exactly over the PDF page
      const overlay = event.currentTarget
      const overlayRect = overlay.getBoundingClientRect()
      const clickX = event.clientX - overlayRect.left
      const clickY = event.clientY - overlayRect.top

      // Use actual overlay dimensions
      const maxWidth = overlayRect.width
      const maxHeight = overlayRect.height

      // Center the signature box on the click point and ensure it stays within bounds of overlay
      const signatureWidth = 200
      const signatureHeight = 50
      
      const relativeX = Math.max(0, Math.min(clickX - signatureWidth/2, maxWidth - signatureWidth))
      const relativeY = Math.max(0, Math.min(clickY - signatureHeight/2, maxHeight - signatureHeight))

      console.log('Page click details:', { 
        clickX, 
        clickY, 
        relativeX, 
        relativeY, 
        overlayWidth: overlayRect.width,
        overlayHeight: overlayRect.height,
        signatureWidth,
        signatureHeight,
        maxX: maxWidth - signatureWidth,
        maxY: maxHeight - signatureHeight
      })

      const newPosition: SignaturePosition = {
        page: pageNumber,
        x: relativeX,
        y: relativeY, 
        width: signatureWidth,
        height: signatureHeight,
      }

      console.log('New signature position:', newPosition)
      onPositionChange(activeSigner, newPosition)
      
      const action = positions[activeSigner] ? 'repositioned' : 'positioned'
      toast.success(`Signature ${action} for ${signers.find(s => s.id === activeSigner)?.name}`)
    },
    [activeSigner, pageNumber, onPositionChange, positions, signers]
  )

  const handleSignatureBoxSelect = (signerId: string) => {
    onSignerSelect(signerId)
  }

  const handleSignaturePositionChange = (signerId: string, newPosition: Omit<SignaturePosition, 'page'>) => {
    const currentPosition = positions[signerId]
    if (currentPosition) {
      onPositionChange(signerId, {
        ...newPosition,
        page: currentPosition.page,
      })
    }
  }

  // Get signature boxes for current page
  const currentPageSignatures = Object.entries(positions)
    .filter(([_, pos]) => pos.page === pageNumber)
    .map(([signerId, pos]) => ({
      signerId,
      position: pos,
      signer: signers.find(s => s.id === signerId)!,
    }))
    .filter(item => item.signer) // Filter out signers that don't exist

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-8 text-center">
          <div className="text-red-600 mb-4">
            <div className="text-lg font-semibold">Error Loading Document</div>
            <div className="text-sm">{error}</div>
          </div>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleResetZoom}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
          >
            Previous
          </Button>
          <span className="text-sm font-medium min-w-[100px] text-center">
            Page {pageNumber} of {numPages}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="text-sm text-blue-800">
          <strong>Instructions:</strong> Select a signer from the dropdown above, then click anywhere on the document to place their signature field. 
          You can drag and resize signature fields after placing them.
        </div>
      </div>

      {/* PDF Viewer */}
      <Card className="w-full">
        <CardContent className="p-0">
          <div className="relative overflow-auto bg-gray-100" style={{ maxHeight: '80vh' }}>
            {isLoading && (
              <div className="flex items-center justify-center h-96">
                <div className="text-gray-500">Loading PDF...</div>
              </div>
            )}
            
            <Document
              file={resolvedUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading=""
              className="flex justify-center"
            >
              <div className="relative inline-block">
                <Page
                    pageNumber={pageNumber}
                    scale={scale}
                    loading=""
                    className="shadow-lg max-w-full"
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    onRenderSuccess={(page: any) => {
                      try {
                      // Measure via overlay or nearest canvas after render
                      requestAnimationFrame(() => {
                        const overlayEl = overlayRef.current
                        const canvas = overlayEl?.parentElement?.querySelector('canvas') as HTMLCanvasElement | null
                        const width = overlayEl?.clientWidth || canvas?.clientWidth || 0
                        const height = overlayEl?.clientHeight || canvas?.clientHeight || 0
                        if (width && height) {
                          setPageDimensions({ width, height })
                        }
                          console.log('Page rendered with dimensions:', {
                          width,
                          height,
                            scale
                          })
                      })
                      } catch (error) {
                        console.warn('Failed to get page dimensions:', error)
                      }
                    }}
                  />

                {/* Absolute overlay that matches the PDF page area */}
                <div
                  ref={overlayRef}
                  className="absolute inset-0 z-10"
                  onClick={handleOverlayClick}
                  style={{ cursor: 'crosshair' }}
                >
                  {currentPageSignatures.map(({ signerId, position, signer }) => (
                    <SignatureBox
                      key={signerId}
                      signer={signer}
                      position={position}
                      isActive={activeSigner === signerId}
                      pageNumber={pageNumber}
                      onPositionChange={(newPos) => 
                        handleSignaturePositionChange(signerId, newPos)
                      }
                      onSelect={() => handleSignatureBoxSelect(signerId)}
                      color={getSignerColor(signerId)}
                      maxWidth={pageDimensions?.width}
                      maxHeight={pageDimensions?.height}
                    />
                  ))}
                </div>
              </div>
            </Document>
          </div>
        </CardContent>
      </Card>

      {/* Page Summary */}
      {currentPageSignatures.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="text-sm font-semibold mb-2">Signatures on Page {pageNumber}:</h4>
            <div className="space-y-1">
              {currentPageSignatures.map(({ signer, signerId }) => (
                <div key={signerId} className="flex items-center gap-2 text-sm">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: getSignerColor(signerId) }}
                  />
                  <span>{signer.name} ({signer.email})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
