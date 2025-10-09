'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Document, Page, pdfjs } from 'react-pdf'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import toast from 'react-hot-toast'
import apiClient from '@/lib/axios'

// Configure pdf.js worker (uses the worker copied to /public during postinstall)
if (typeof window !== 'undefined') {
  const origin = window.location.origin
  try {
    // Prefer ESM worker if available
    pdfjs.GlobalWorkerOptions.workerSrc = `${origin}/pdf.worker.min.mjs`
  } catch {
    pdfjs.GlobalWorkerOptions.workerSrc = `${origin}/pdf.worker.min.js`
  }
} else {
  pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`
}

interface Position {
  page: number
  x: number
  y: number
  width: number
  height: number
}

interface SigningOrderEntry {
  signer_id: string
  order: number
  position: Position
}

interface EnvelopeResponse {
  id: string
  name?: string
  document: string | { file_url: string }
  status: string
  signing_order: SigningOrderEntry[]
}

interface MySignatureResponse {
  signature_image?: string
  status?: string
}

export default function SignEnvelopePage() {
  const params = useParams<{ id: string }>()
  const envelopeId = params?.id

  const [numPages, setNumPages] = useState(0)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selected, setSelected] = useState<SigningOrderEntry | null>(null)
  const [signedFor, setSignedFor] = useState<Record<string, boolean>>({})
  const [previewSignerId, setPreviewSignerId] = useState<string | null>(null)
  const [draftPlacement, setDraftPlacement] = useState<Position | null>(null)
  const [isDraggingDraft, setIsDraggingDraft] = useState(false)
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [pageDims, setPageDims] = useState<Record<number, { widthPt: number; heightPt: number; widthPx: number; heightPx: number }>>({})

  // Resolve possibly relative URLs to backend origin
  const resolveUrl = useCallback((url?: string | null) => {
    if (!url) return ''
    if (/^https?:\/\//i.test(url)) return url
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
    let backendOrigin = 'http://localhost:8000'
    try { backendOrigin = new URL(apiBase).origin } catch {}
    const path = url.startsWith('/') ? url : `/${url}`
    return `${backendOrigin}${path}`
  }, [])

  // Fetch envelope detail (raw to preserve signing_order positions)
  const { data: envelope, isLoading: loadingEnv } = useQuery<EnvelopeResponse>({
    queryKey: ['sign-envelope', envelopeId],
    enabled: !!envelopeId,
    queryFn: async () => {
      const res = await apiClient.get(`/envelopes/${envelopeId}/`)
      const envelope = (res.data?.data ?? res.data) as EnvelopeResponse
      console.log('[Sign Page] Envelope loaded:', envelope)
      console.log('[Sign Page] Signing order:', envelope?.signing_order)
      return envelope
    },
  })

  // Fetch current user's signature (base64 preview)
  const { data: mySignature } = useQuery<MySignatureResponse>({
    queryKey: ['my-signature', envelopeId],
    enabled: !!envelopeId,
    queryFn: async () => {
      const res = await apiClient.get(`/signatures/me/`, { params: { envelope: envelopeId } })
      return (res.data?.data ?? res.data) as MySignatureResponse
    },
  })

  const mySignatureId: string | undefined = useMemo(() => {
    // try common keys from backend
    const raw: any = mySignature || {}
    return raw.id || raw.signature_id || undefined
  }, [mySignature])

  // Determine logged-in user id from token payload already attached server-side
  // We rely on backend to authorize clicks; on frontend we only style by id if provided in envelope
  const currentUserId = useMemo(() => {
    try {
      // Some backends include current user as 'me' entry; if not, leave undefined to allow server-side auth only
      return (window as any).__CURRENT_USER_ID__ || undefined
    } catch { return undefined }
  }, [])

  const documentUrl = useMemo(() => {
    const doc = envelope?.document
    const raw = typeof doc === 'string' ? doc : (doc?.file_url || '')
    return resolveUrl(raw)
  }, [envelope, resolveUrl])

  const onPlaceholderClick = (entry: SigningOrderEntry) => {
    // Only open for current user if user id is known; otherwise let server enforce later
    if (currentUserId && entry.signer_id !== currentUserId) return
    if (signedFor[entry.signer_id]) return
    setSelected(entry)
    setPreviewSignerId(entry.signer_id)
    setIsDialogOpen(true)
    // if this entry has no position, enable placement mode
    if (!entry.position) {
      setDraftPlacement(null)
    }
  }

  const signMutation = useMutation({
    mutationFn: async () => {
      if (!mySignatureId) {
        throw new Error('No signature on file. Please create/upload your signature first.')
      }
      const myEntry = (envelope?.signing_order || []).find((e) => !currentUserId || e.signer_id === currentUserId)
      const hasExistingPosition = Boolean(myEntry?.position)
      const body: any = { signature_id: mySignatureId }
      if (!hasExistingPosition && draftPlacement) {
        body.page = draftPlacement.page
        body.x = Math.max(0, draftPlacement.x)
        body.y = Math.max(0, draftPlacement.y)
        body.width = Math.max(1, draftPlacement.width)
        body.height = Math.max(1, draftPlacement.height)
      }
      const res = await apiClient.post(`/signatures/${envelopeId}/sign/`, body)
      return res.data
    },
    onSuccess: () => {
      toast.success('Signed successfully!')
      if (selected) setSignedFor((prev) => ({ ...prev, [selected.signer_id]: true }))
      setIsDialogOpen(false)
      setPreviewSignerId(null)
      setDraftPlacement(null)
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || 'Error signing document'
      toast.error(msg)
    },
  })

  if (loadingEnv || !envelope) return <div className="p-6">Loading…</div>

  console.log('[Sign Page Render] Current envelope:', envelope)
  console.log('[Sign Page Render] Signing order count:', envelope?.signing_order?.length)
  console.log('[Sign Page Render] Page dimensions:', pageDims)

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">{envelope.name || 'Sign Document'}</h1>

      <div className="border rounded-lg overflow-auto max-h-[85vh] bg-gray-50">
        {documentUrl && (
          <Document file={documentUrl} onLoadSuccess={(info: any) => setNumPages(info.numPages)} loading="">
            {Array.from({ length: numPages || 1 }, (_, i) => i + 1).map((pageNo) => (
              <div key={pageNo} className="relative">
                <Page
                  pageNumber={pageNo}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                  className="shadow"
                  loading=""
                  onRenderSuccess={(page: any) => {
                    try {
                      const [x0, y0, x1, y1] = page.view || [0, 0, page.width, page.height]
                      const widthPt = Math.abs((x1 ?? page.width) - (x0 ?? 0)) || page.width || 0
                      const heightPt = Math.abs((y1 ?? page.height) - (y0 ?? 0)) || page.height || 0
                      const canvas = (page as any).canvas || document.querySelector('.react-pdf__Page canvas')
                      const widthPx = (canvas && (canvas as HTMLCanvasElement).clientWidth) || 0
                      const heightPx = (canvas && (canvas as HTMLCanvasElement).clientHeight) || 0
                      setPageDims((prev) => ({ ...prev, [pageNo]: { widthPt, heightPt, widthPx, heightPx } }))
                    } catch {}
                  }}
                />

                {/* Overlay placeholders for this page */}
                <div className="absolute inset-0">
                  {(() => {
                    const entries = (envelope.signing_order || []).filter((s) => s.position?.page === pageNo)
                    console.log(`[Sign Page] Page ${pageNo} - Entries with position:`, entries)
                    return entries.map((entry, idx) => {
                      // For now, show all placeholders (will be styled differently for current user vs others)
                      const isMe = !currentUserId || entry.signer_id === currentUserId
                      const isSigned = signedFor[entry.signer_id]
                      const isPreview = previewSignerId === entry.signer_id && !isSigned
                      const dims = pageDims[pageNo]
                      
                      console.log(`[Sign Page] Rendering placeholder for signer ${entry.signer_id}:`, {
                        position: entry.position,
                        dims,
                        isMe,
                        isSigned,
                        isPreview
                      })
                      
                      let commonStyle: React.CSSProperties = {}
                      if (dims) {
                        // Convert PDF point coordinates (bottom-left origin) to CSS pixels (top-left origin)
                        const scaleX = dims.widthPx / (dims.widthPt || 1)
                        const scaleY = dims.heightPx / (dims.heightPt || 1)
                        const leftPx = (entry.position.x || 0) * scaleX
                        const widthPx = (entry.position.width || 0) * scaleX
                        const heightPx = (entry.position.height || 0) * scaleY
                        const topPx = (dims.heightPt - (entry.position.y || 0) - (entry.position.height || 0)) * scaleY
                        commonStyle = { left: leftPx, top: topPx, width: widthPx, height: heightPx }
                        console.log(`[Sign Page] Computed style for placeholder:`, commonStyle)
                      } else {
                        console.warn(`[Sign Page] No dimensions available for page ${pageNo} yet`)
                      }
                      
                      return (
                        <div key={`${entry.signer_id}-${idx}`} className="absolute" style={commonStyle}>
                          {!isSigned ? (
                            isPreview && mySignature?.signature_image ? (
                              <img
                                src={`data:image/png;base64,${mySignature.signature_image}`}
                                alt="Signature preview"
                                className="w-full h-full object-contain select-none rounded-md border-2 border-blue-500 bg-white/90 shadow"
                                onClick={() => (isMe ? onPlaceholderClick(entry) : undefined)}
                              />
                            ) : (
                              <div
                                role={isMe ? 'button' : undefined}
                                onClick={() => (isMe ? onPlaceholderClick(entry) : undefined)}
                                className={
                                  isMe
                                    ? 'absolute inset-0 border-2 border-blue-500 bg-blue-100/40 rounded-md cursor-pointer hover:bg-blue-200/60 transition'
                                    : 'absolute inset-0 border border-gray-300 bg-gray-200/30 rounded-md cursor-not-allowed'
                                }
                                title={`Signature position for signer ${entry.signer_id}`}
                              />
                            )
                          ) : (
                            mySignature?.signature_image ? (
                              <img
                                src={`data:image/png;base64,${mySignature.signature_image}`}
                                alt="Signed"
                                className="w-full h-full object-contain select-none"
                              />
                            ) : (
                              <div className="absolute inset-0 bg-green-100 border-2 border-green-400 rounded-md" />
                            )
                          )}
                        </div>
                      )
                    })
                  })()}

                  {/* If current signer has no predefined position, allow placing a draft preview */}
                  {(() => {
                    const myEntry = (envelope.signing_order || []).find((e) => !currentUserId || e.signer_id === currentUserId)
                    const canPlace = (!myEntry || !myEntry.position) && previewSignerId && (!currentUserId || previewSignerId === currentUserId)
                    if (!canPlace) return null
                    const isThisPage = (draftPlacement?.page || pageNo) === pageNo
                    const defaultW = 180
                    const defaultH = 50
                    return (
                      <div
                        className="absolute inset-0"
                        onClick={(e) => {
                          // click to set initial placement centered at click
                          if (!mySignature?.signature_image) return
                          const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
                          const x = e.clientX - rect.left - defaultW / 2
                          const y = e.clientY - rect.top - defaultH / 2
                          setDraftPlacement({ page: pageNo, x: Math.max(0, x), y: Math.max(0, y), width: defaultW, height: defaultH })
                        }}
                      >
                        {isThisPage && draftPlacement && mySignature?.signature_image && (
                          <div
                            className="absolute border-2 border-blue-500 bg-white/90 cursor-move rounded-md shadow"
                            style={{ left: draftPlacement.x, top: draftPlacement.y, width: draftPlacement.width, height: draftPlacement.height }}
                            onMouseDown={(e) => {
                              e.stopPropagation()
                              setIsDraggingDraft(true)
                              const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
                              setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top })
                            }}
                            onMouseUp={() => setIsDraggingDraft(false)}
                            onMouseLeave={() => setIsDraggingDraft(false)}
                            onMouseMove={(e) => {
                              if (!isDraggingDraft || !draftPlacement) return
                              const parentRect = (e.currentTarget.parentElement as HTMLDivElement).getBoundingClientRect()
                              const newX = Math.max(0, Math.min(e.clientX - parentRect.left - dragOffset.x, parentRect.width - draftPlacement.width))
                              const newY = Math.max(0, Math.min(e.clientY - parentRect.top - dragOffset.y, parentRect.height - draftPlacement.height))
                              setDraftPlacement({ ...draftPlacement, x: newX, y: newY })
                            }}
                          >
                            <img src={`data:image/png;base64,${mySignature.signature_image}`} alt="Signature preview" className="w-full h-full object-contain select-none pointer-events-none" />
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
              </div>
            ))}
          </Document>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setPreviewSignerId(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Signature Placement</DialogTitle>
            <DialogDescription>
              This is where your signature will appear. A live preview is visible on the document. Approve to finalize signing.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center my-4">
            {mySignature?.signature_image ? (
              <img
                src={`data:image/png;base64,${mySignature.signature_image}`}
                alt="Signature preview"
                className="w-[200px] h-[60px] object-contain border border-gray-200 rounded-md"
              />
            ) : (
              <p className="text-sm text-gray-600">No signature on file</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => signMutation.mutate()} disabled={signMutation.isPending}>
              {signMutation.isPending ? 'Signing…' : 'Approve & Sign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


