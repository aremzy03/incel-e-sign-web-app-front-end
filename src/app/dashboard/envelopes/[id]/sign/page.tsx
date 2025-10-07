'use client'

import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'
import SignaturePad from 'react-signature-canvas'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  declineEnvelope,
  listUserSignatures,
  signEnvelopeWithInline,
  signEnvelopeWithReusableSignature,
  type ReusableSignature,
} from '@/lib/api/signatures'
import { getEnvelopeDetail, getEnvelopePdfUrl } from '@/lib/api/envelopes'
import PdfViewer from '@/components/PdfViewer'

type SourceType = 'reusable' | 'draw'

interface Placement {
  page: number
  x: number
  y: number
  width: number
  height: number
}

export default function EnvelopeSignPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const envelopeId = params?.id

  const [source, setSource] = useState<SourceType>('reusable')
  const [selectedSignature, setSelectedSignature] = useState<ReusableSignature | null>(null)
  const sigPadRef = useRef<SignaturePad | null>(null)
  const [drawnDataUrl, setDrawnDataUrl] = useState<string | null>(null)

  const [pdfUrl, setPdfUrl] = useState<string>('')
  const [numPages, setNumPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const pageContainerRef = useRef<HTMLDivElement | null>(null)
  const [pageSizePx, setPageSizePx] = useState<{ w: number; h: number }>({ w: 0, h: 0 })
  const [pageSizePt, setPageSizePt] = useState<{ w: number; h: number }>({ w: 0, h: 0 })

  const [overlayImage, setOverlayImage] = useState<string | null>(null)
  const [placement, setPlacement] = useState<Placement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  // Resolve possibly relative asset URLs to backend origin
  const resolveAssetUrl = useCallback((url?: string | null) => {
    if (!url) return null
    if (/^https?:\/\//i.test(url)) return url
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
    let backendOrigin = 'http://localhost:8000'
    try {
      backendOrigin = new URL(apiBase).origin
    } catch {
      // ignore
    }
    const path = url.startsWith('/') ? url : `/${url}`
    return `${backendOrigin}${path}`
  }, [])

  useEffect(() => {
    if (!envelopeId) return
    getEnvelopePdfUrl(envelopeId).then(setPdfUrl).catch(() => toast.error('Failed to load PDF'))
  }, [envelopeId])

  const { data: envelope } = useQuery({
    queryKey: ['envelope', envelopeId],
    queryFn: () => getEnvelopeDetail(envelopeId as string),
    enabled: !!envelopeId,
  })

  const { data: signatures } = useQuery<ReusableSignature[]>({
    queryKey: ['signatures', 'user'],
    queryFn: listUserSignatures,
    staleTime: 30_000,
  })

  // When signature source changes, set overlay image
  useEffect(() => {
    if (source === 'draw') {
      setOverlayImage(drawnDataUrl)
    } else {
      setOverlayImage(selectedSignature ? resolveAssetUrl(selectedSignature.image_url) : null)
    }
  }, [source, drawnDataUrl, selectedSignature, resolveAssetUrl])

  const onDocumentLoad = useCallback((pages: number) => {
    setNumPages(pages)
    setCurrentPage(1)
  }, [])

  const pxPerPt = useMemo(() => {
    if (pageSizePt.w === 0) return 1
    return pageSizePx.w / pageSizePt.w
  }, [pageSizePx.w, pageSizePt.w])

  // Initialize default placement when overlay becomes available
  useEffect(() => {
    if (!overlayImage || !pageSizePt.w || !pageSizePt.h) return
    const defaultWidthPt = Math.min(200, pageSizePt.w * 0.4)
    const aspect = 3 // width:height approx for signatures
    const defaultHeightPt = Math.max(40, defaultWidthPt / aspect)
    setPlacement({
      page: currentPage,
      x: (pageSizePt.w - defaultWidthPt) / 2,
      y: (pageSizePt.h - defaultHeightPt) / 2,
      width: defaultWidthPt,
      height: defaultHeightPt,
    })
  }, [overlayImage, pageSizePt.w, pageSizePt.h, currentPage])

  // Mouse handlers for drag/resize in pixel space, then convert back to points
  const toPx = useCallback(
    (pt: { x: number; y: number; w: number; h: number }) => ({
      x: pt.x * pxPerPt,
      y: (pageSizePt.h - pt.y - pt.h) * pxPerPt,
      w: pt.w * pxPerPt,
      h: pt.h * pxPerPt,
    }),
    [pxPerPt, pageSizePt.h]
  )

  const toPt = useCallback(
    (px: { x: number; y: number; w: number; h: number }) => ({
      x: px.x / pxPerPt,
      y: pageSizePt.h - (px.y / pxPerPt + px.h / pxPerPt),
      w: px.w / pxPerPt,
      h: px.h / pxPerPt,
    }),
    [pxPerPt, pageSizePt.h]
  )

  const onDragStart = (e: React.MouseEvent) => {
    if (!placement) return
    setIsDragging(true)
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  const onDrag = (e: React.MouseEvent) => {
    if (!isDragging || !placement || !pageContainerRef.current) return
    const containerRect = pageContainerRef.current.getBoundingClientRect()
    const placementPx = toPx({ x: placement.x, y: placement.y, w: placement.width, h: placement.height })
    const newLeft = Math.max(0, Math.min(e.clientX - containerRect.left - dragOffset.x, containerRect.width - placementPx.w))
    const newTop = Math.max(0, Math.min(e.clientY - containerRect.top - dragOffset.y, containerRect.height - placementPx.h))
    const nextPx = { x: newLeft, y: newTop, w: placementPx.w, h: placementPx.h }
    const nextPt = toPt(nextPx)
    setPlacement({ ...placement, x: nextPt.x, y: nextPt.y, width: nextPt.w, height: nextPt.h })
  }

  const onDragEnd = () => setIsDragging(false)

  const onResize = (dx: number, dy: number) => {
    if (!placement) return
    const curPx = toPx({ x: placement.x, y: placement.y, w: placement.width, h: placement.height })
    const nextPx = { ...curPx, w: Math.max(30, curPx.w + dx), h: Math.max(20, curPx.h + dy) }
    const nextPt = toPt(nextPx)
    setPlacement({ ...placement, width: nextPt.w, height: nextPt.h })
  }

  // PDF Navigation helpers
  const canPrevPage = currentPage > 1
  const canNextPage = currentPage < numPages
  const handlePrevPage = () => {
    if (canPrevPage) {
      setCurrentPage(currentPage - 1)
      // Update placement to new page if signature is placed
      if (placement) {
        setPlacement({ ...placement, page: currentPage - 1 })
      }
    }
  }
  const handleNextPage = () => {
    if (canNextPage) {
      setCurrentPage(currentPage + 1)
      // Update placement to new page if signature is placed
      if (placement) {
        setPlacement({ ...placement, page: currentPage + 1 })
      }
    }
  }

  const canConfirm = Boolean(placement && ((source === 'reusable' && selectedSignature) || (source === 'draw' && drawnDataUrl)))

  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!envelopeId || !placement) throw new Error('Missing placement')
      if (source === 'reusable') {
        if (!selectedSignature) throw new Error('Select a reusable signature')
        // Validate payload shape (exactly one of signature_id/signature_image)
        const payloadPreview = {
          signature_id: String(selectedSignature.id),
          page: placement.page,
          x: Number(placement.x),
          y: Number(placement.y),
          width: Number(placement.width),
          height: Number(placement.height),
        }
        console.debug('[Sign Debug] Reusable payload', payloadPreview)
        return signEnvelopeWithReusableSignature(envelopeId, selectedSignature.id, placement)
      } else {
        const pad = sigPadRef.current
        const dataUrl = drawnDataUrl || (pad && !pad.isEmpty() ? pad.getTrimmedCanvas().toDataURL('image/png') : null)
        if (!dataUrl) throw new Error('Please draw your signature')
        if (!/^data:image\/(png|jpeg);base64,/.test(dataUrl)) {
          throw new Error('Signature image must be a base64 data URL')
        }
        const payloadPreview = {
          signature_image: `${dataUrl.substring(0, 32)}...`,
          page: placement.page,
          x: Number(placement.x),
          y: Number(placement.y),
          width: Number(placement.width),
          height: Number(placement.height),
        }
        console.debug('[Sign Debug] Inline payload', payloadPreview)
        return signEnvelopeWithInline(envelopeId, dataUrl, placement)
      }
    },
    onSuccess: () => {
      toast.success('Document signed successfully')
      router.push('/dashboard/envelopes')
    },
    onError: () => toast.error('Failed to sign document'),
  })

  const declineMutation = useMutation({
    mutationFn: async () => {
      if (!envelopeId) throw new Error('Invalid envelope')
      return declineEnvelope(envelopeId)
    },
    onSuccess: () => {
      toast.success('You declined to sign this envelope')
      router.push('/dashboard/envelopes')
    },
    onError: () => toast.error('Failed to decline'),
  })

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sign Envelope</h1>
          <p className="text-gray-600 mt-1">Place your signature on the document and confirm</p>
        </div>
        <div className="flex gap-2">
          <Button variant="destructive" onClick={() => declineMutation.mutate()} disabled={declineMutation.isPending}>
            {declineMutation.isPending ? 'Declining...' : 'Decline'}
          </Button>
          <Button onClick={() => confirmMutation.mutate()} disabled={!canConfirm || confirmMutation.isPending}>
            {confirmMutation.isPending ? 'Saving...' : 'Confirm Sign'}
          </Button>
        </div>
      </div>

      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Document</CardTitle>
          <CardDescription>{envelope?.name || envelope?.document?.name || 'PDF preview'} · Page {currentPage} of {numPages || '?'}</CardDescription>
        </CardHeader>
        <CardContent>
          {pdfUrl ? (
            <div className="w-full flex flex-col items-center gap-3">
              {/* PDF Navigation Controls */}
              {numPages > 1 && (
                <div className="flex items-center justify-center w-full max-w-3xl px-3 py-2 border rounded-md bg-white">
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={handlePrevPage} disabled={!canPrevPage} aria-label="Previous page">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm text-gray-700 px-2">Page {currentPage} of {numPages}</div>
                    <Button size="sm" variant="outline" onClick={handleNextPage} disabled={!canNextPage} aria-label="Next page">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="relative w-full max-w-3xl border rounded-md bg-gray-50" ref={pageContainerRef} onMouseMove={onDrag} onMouseUp={onDragEnd} onMouseLeave={onDragEnd}>
                <PdfViewer
                  url={pdfUrl}
                  className="w-full"
                  showControls={false}
                  pageNumber={currentPage}
                  onPageChange={(p) => setCurrentPage(p)}
                  onDocumentLoad={onDocumentLoad}
                  onPageRender={({ widthPt, heightPt, widthPx, heightPx }) => {
                    setPageSizePt({ w: widthPt, h: heightPt })
                    setPageSizePx({ w: widthPx, h: heightPx })
                  }}
                />
                {overlayImage && placement && placement.page === currentPage && (
                  <div
                    className="absolute border-2 border-blue-500 bg-white/90 cursor-move"
                    style={{
                      left: `${toPx({ x: placement.x, y: placement.y, w: placement.width, h: placement.height }).x}px`,
                      top: `${toPx({ x: placement.x, y: placement.y, w: placement.width, h: placement.height }).y}px`,
                      width: `${toPx({ x: placement.x, y: placement.y, w: placement.width, h: placement.height }).w}px`,
                      height: `${toPx({ x: placement.x, y: placement.y, w: placement.width, h: placement.height }).h}px`,
                    }}
                    onMouseDown={onDragStart}
                  >
                    <img src={overlayImage} alt="signature" className="w-full h-full object-contain pointer-events-none select-none" />
                    <div
                      className="absolute right-0 bottom-0 w-3 h-3 bg-blue-500 cursor-se-resize"
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        const startX = e.clientX
                        const startY = e.clientY
                        const move = (me: MouseEvent) => onResize(me.clientX - startX, me.clientY - startY)
                        const up = () => {
                          window.removeEventListener('mousemove', move)
                          window.removeEventListener('mouseup', up)
                        }
                        window.addEventListener('mousemove', move)
                        window.addEventListener('mouseup', up)
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-600">Loading PDF…</div>
          )}
        </CardContent>
      </Card>

      <div className="h-px w-full bg-gray-200" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Signature Source</CardTitle>
            <CardDescription>Choose reusable or draw a new signature</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button variant={source === 'reusable' ? 'default' : 'secondary'} onClick={() => setSource('reusable')}>Reusable</Button>
              <Button variant={source === 'draw' ? 'default' : 'secondary'} onClick={() => setSource('draw')}>Draw New</Button>
            </div>

              {source === 'reusable' ? (
                signatures && signatures.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {signatures.map((s) => {
                      const img = resolveAssetUrl(s.image_url)
                      return (
                        <button
                          key={s.id}
                          onClick={() => setSelectedSignature(s)}
                          className={`border rounded-lg p-3 text-left hover:shadow transition ${selectedSignature?.id === s.id ? 'ring-2 ring-blue-500' : 'border-gray-200'}`}
                        >
                          <div className="w-full aspect-[3/1] bg-gray-50 border rounded mb-2 overflow-hidden flex items-center justify-center">
                            {img ? (
                              <img
                                src={img}
                                alt={s.name}
                                className="max-h-16 object-contain"
                                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                              />
                            ) : (
                              <div className="text-xs text-gray-400">No preview</div>
                            )}
                          </div>
                          <div className="text-sm font-medium text-gray-900">{s.name}</div>
                          <div className="text-xs text-gray-500">Uploaded {new Date(s.uploaded_at).toLocaleDateString()}</div>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">No reusable signatures found. Upload one in Signatures.</div>
                )
              ) : (
              <div className="space-y-3">
                <div className="border rounded-md p-2 bg-gray-50">
                  <SignaturePad ref={sigPadRef as any} canvasProps={{ className: 'w-full h-48 bg-white rounded' }} />
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => { sigPadRef.current?.clear(); setDrawnDataUrl(null) }}>Clear</Button>
                  <Button onClick={() => setDrawnDataUrl(sigPadRef.current?.getTrimmedCanvas().toDataURL('image/png') || null)}>Use This</Button>
                </div>
              </div>
              )}

            <div className="text-xs text-gray-600">Drag the signature onto the PDF above. Resize using the corner handle.</div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Placement Details</CardTitle>
            <CardDescription>Coordinates are in PDF points (bottom-left origin)</CardDescription>
          </CardHeader>
          <CardContent>
            {placement ? (
              <div className="text-sm grid grid-cols-2 gap-y-2">
                <div className="text-gray-500">Page</div><div>{placement.page}</div>
                <div className="text-gray-500">X</div><div>{placement.x.toFixed(1)}</div>
                <div className="text-gray-500">Y</div><div>{placement.y.toFixed(1)}</div>
                <div className="text-gray-500">Width</div><div>{placement.width.toFixed(1)}</div>
                <div className="text-gray-500">Height</div><div>{placement.height.toFixed(1)}</div>
              </div>
            ) : (
              <div className="text-sm text-gray-600">No placement yet. Select a signature and drag onto the PDF.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}



