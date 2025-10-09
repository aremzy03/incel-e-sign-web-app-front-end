'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Document, Page, pdfjs } from 'react-pdf'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import toast from 'react-hot-toast'
import apiClient from '@/lib/axios'
import { getUserById, type User } from '@/lib/api/users'
import { useSession } from 'next-auth/react'

// Configure PDF.js worker (same as envelope creation page)
if (typeof window !== 'undefined') {
  const origin = window.location.origin
  pdfjs.GlobalWorkerOptions.workerSrc = `${origin}/pdf.worker.min.mjs`
  console.log('[Sign Page] Setting PDF.js worker to:', pdfjs.GlobalWorkerOptions.workerSrc)
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

export default function SignEnvelopePage() {
  const params = useParams<{ id: string }>()
  const envelopeId = params?.id
  const { data: session } = useSession()
  const currentUserId = session?.user?.id

  const [numPages, setNumPages] = useState(0)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selected, setSelected] = useState<SigningOrderEntry | null>(null)
  const [signedFor, setSignedFor] = useState<Record<string, boolean>>({})
  const [previewSignerId, setPreviewSignerId] = useState<string | null>(null)
  const [draftPlacement, setDraftPlacement] = useState<Position | null>(null)
  const [isDraggingDraft, setIsDraggingDraft] = useState(false)
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [pageDims, setPageDims] = useState<Record<number, { widthPt: number; heightPt: number; widthPx: number; heightPx: number }>>({})
  const [documentUrl, setDocumentUrl] = useState<string>('')
  const [signerDetails, setSignerDetails] = useState<Record<string, User>>({})
  const [selectedSignature, setSelectedSignature] = useState<any>(null)

  // Resolve possibly relative URLs to backend origin
  const resolveUrl = useCallback((url?: string | null | any) => {
    if (!url) return ''
    if (typeof url !== 'string') {
      console.error('[resolveUrl] Expected string but got:', typeof url, url)
      return ''
    }
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

  // Fetch current user's signatures
  const { data: mySignatures } = useQuery<any[]>({
    queryKey: ['my-signatures'],
    queryFn: async () => {
      const res = await apiClient.get(`/signatures/user/`)
      const raw = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
      console.log('[Sign Page] Fetched signatures:', raw)
      return raw
    },
  })

  // Auto-select default signature when signatures load
  useEffect(() => {
    if (mySignatures && mySignatures.length > 0 && !selectedSignature) {
      const defaultSig = mySignatures.find((s: any) => s.is_default) || mySignatures[0]
      console.log('[Sign Page] Auto-selecting signature:', defaultSig)
      setSelectedSignature(defaultSig)
    }
  }, [mySignatures, selectedSignature])

  const mySignatureId: string | undefined = useMemo(() => {
    // try common keys from backend
    const raw: any = selectedSignature || {}
    return raw.id || raw.signature_id || undefined
  }, [selectedSignature])


  // Get document URL from envelope data
  useEffect(() => {
    if (!envelope) return
    
    const fetchDocumentUrl = async () => {
      try {
        console.log('[Sign Page] Fetching document URL for envelope:', envelope.id)
        
        // Get the document info from the API
        const response = await apiClient.get(`/envelopes/${envelope.id}/document/`)
        console.log('[Sign Page] Document response:', response.data)
        
        const responseData = response.data.data || response.data
        const fileUrl = responseData.file_url || responseData.signed_file_url || responseData.url || responseData.document_url
        
        if (fileUrl) {
          const resolved = resolveUrl(fileUrl)
          console.log('[Sign Page] Resolved document URL:', resolved)
          setDocumentUrl(resolved)
    } else {
          console.error('[Sign Page] No file URL found in response:', responseData)
          toast.error('Document URL not found')
        }
      } catch (error) {
        console.error('[Sign Page] Failed to fetch document URL:', error)
        toast.error('Failed to load document')
      }
    }
    
    fetchDocumentUrl()
  }, [envelope, resolveUrl])

  // Fetch signer details for all signers in the envelope
  useEffect(() => {
    if (!envelope?.signing_order) return
    
    const fetchSignerDetails = async () => {
      const details: Record<string, User> = {}
      
      for (const entry of envelope.signing_order) {
        if (entry.signer_id) {
          try {
            console.log('[Sign Page] Fetching user details for signer:', entry.signer_id)
            const user = await getUserById(entry.signer_id)
            details[entry.signer_id] = user
          } catch (error) {
            console.error(`[Sign Page] Failed to fetch user ${entry.signer_id}:`, error)
          }
        }
      }
      
      if (Object.keys(details).length > 0) {
        console.log('[Sign Page] Signer details fetched:', details)
        setSignerDetails(details)
      }
    }
    
    fetchSignerDetails()
  }, [envelope?.signing_order])

  const handleSignatureSelect = (signature: any) => {
    console.log('[Sign Page] Selected signature:', signature)
    setSelectedSignature(signature)
    // If a preview is already showing, update it
    if (previewSignerId) {
      // Force re-render by clearing and setting again
      const currentPreview = previewSignerId
      setPreviewSignerId(null)
      setTimeout(() => setPreviewSignerId(currentPreview), 0)
    }
  }

  const onPlaceholderClick = (entry: SigningOrderEntry) => {
    if (signedFor[entry.signer_id]) return
    
    // Check if user has selected a signature
    if (!selectedSignature) {
      toast.error('Please select a signature first')
      return
    }
    
    // First click: Show signature preview in the placeholder
    if (previewSignerId !== entry.signer_id) {
      console.log('[Sign Page] Showing signature preview for:', entry.signer_id)
      setPreviewSignerId(entry.signer_id)
      setSelected(entry)
      // if this entry has no position, enable placement mode
      if (!entry.position) {
        setDraftPlacement(null)
      }
      return
    }
    
    // Second click (on preview): Open confirmation dialog
    console.log('[Sign Page] Opening confirmation dialog')
    setIsDialogOpen(true)
  }

  const signMutation = useMutation({
    mutationFn: async () => {
      if (!mySignatureId) {
        throw new Error('No signature on file. Please create/upload your signature first.')
      }
      const myEntry = (envelope?.signing_order || []).find((e) => currentUserId && e.signer_id === currentUserId)
      const hasExistingPosition = Boolean(myEntry?.position)
      const body: any = { signature_id: mySignatureId }
      if (!hasExistingPosition && draftPlacement) {
        body.page = draftPlacement.page
        body.x = Math.max(0, draftPlacement.x)
        body.y = Math.max(0, draftPlacement.y)
        body.width = Math.max(1, draftPlacement.width)
        body.height = Math.max(1, draftPlacement.height)
      }
      console.log('[Sign Page] Signing with payload:', body)
      const res = await apiClient.post(`/signatures/${envelopeId}/sign/`, body)
      return res.data
    },
    onSuccess: () => {
      toast.success('Signed successfully!')
      if (selected) setSignedFor((prev) => ({ ...prev, [selected.signer_id]: true }))
      setIsDialogOpen(false)
      setPreviewSignerId(null)
      setDraftPlacement(null)
      setSelected(null)
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || 'Error signing document'
      toast.error(msg)
    },
  })
  
  // Clear preview when clicking outside
  const handleClearPreview = () => {
    if (previewSignerId && !isDialogOpen) {
      console.log('[Sign Page] Clearing signature preview')
      setPreviewSignerId(null)
      setSelected(null)
    }
  }

  if (loadingEnv || !envelope) return <div className="p-6">Loading envelope…</div>
  if (!documentUrl) return <div className="p-6">Loading document…</div>
  
  // Check if current user has any signature positions in this envelope
  const currentUserEntries = (envelope.signing_order || []).filter((entry) => 
    currentUserId && entry.signer_id === currentUserId
  )
  
  if (currentUserId && currentUserEntries.length === 0) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="text-center py-12">
          <h1 className="text-xl font-semibold mb-4">{envelope.name || 'Sign Document'}</h1>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="text-yellow-800">
              <h2 className="text-lg font-medium mb-2">No Signature Required</h2>
              <p className="text-sm">
                You are not listed as a signer for this document, or no signature positions have been defined for you.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  console.log('[Sign Page Render] Current envelope:', envelope)
  console.log('[Sign Page Render] Signing order count:', envelope?.signing_order?.length)
  console.log('[Sign Page Render] Page dimensions:', pageDims)

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">{envelope.name || 'Sign Document'}</h1>

      <div 
        className="border rounded-lg overflow-auto max-h-[85vh] bg-gray-50"
        onClick={(e) => {
          // Clear preview if clicking on the background (not on signature elements)
          if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('react-pdf__Page__canvas')) {
            handleClearPreview()
          }
        }}
      >
        {documentUrl && (
          <Document 
            file={documentUrl}
            onLoadSuccess={(info: any) => {
              console.log('[Sign Page] PDF loaded successfully:', info)
              setNumPages(info.numPages)
            }}
            onLoadError={(error: any) => {
              console.error('[Sign Page] PDF load error:', error)
              toast.error('Failed to load PDF file')
            }}
            loading=""
          >
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
                    const entries = (envelope.signing_order || [])
                      .filter((s) => s.position?.page === pageNo)
                      .filter((s) => currentUserId && s.signer_id === currentUserId) // Only show highlights for current user
                    console.log(`[Sign Page] Page ${pageNo} - Entries with position for current user:`, entries)
                    return entries.map((entry, idx) => {
                      const isMe = entry.signer_id === currentUserId
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
                        // The backend stores coordinates in PDF points with top-left origin (already CSS-style)
                        // Just scale from points to pixels
                        const scaleX = dims.widthPx / (dims.widthPt || 1)
                        const scaleY = dims.heightPx / (dims.heightPt || 1)
                        const leftPx = (entry.position.x || 0) * scaleX
                        const topPx = (entry.position.y || 0) * scaleY
                        const widthPx = (entry.position.width || 0) * scaleX
                        const heightPx = (entry.position.height || 0) * scaleY
                        commonStyle = { left: leftPx, top: topPx, width: widthPx, height: heightPx }
                        console.log(`[Sign Page] Computed style for placeholder:`, commonStyle)
                      } else {
                        console.warn(`[Sign Page] No dimensions available for page ${pageNo} yet`)
                      }
                      
                      return (
                        <div key={`${entry.signer_id}-${idx}`} className="absolute" style={commonStyle}>
                          {!isSigned ? (
                            isPreview && selectedSignature ? (
                              <div
                                className="relative w-full h-full rounded-md border-2 border-green-500 bg-white shadow-lg cursor-pointer hover:border-green-600 transition group"
                                onClick={() => (isMe ? onPlaceholderClick(entry) : undefined)}
                                title="Click to confirm and sign"
                              >
                                <img
                                  src={selectedSignature.image}
                                  alt="Signature preview"
                                  className="w-full h-full object-contain select-none p-1"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                                  <span className="text-xs font-semibold text-green-700 bg-white/90 px-2 py-1 rounded">
                                    Click to confirm
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div
                                role="button"
                                onClick={() => onPlaceholderClick(entry)}
                                className="group absolute inset-0 border-2 border-blue-500 bg-blue-100/40 rounded-md cursor-pointer hover:bg-blue-200/60 transition flex flex-col items-center justify-center p-2"
                                title="Click to place your signature"
                              >
                                <div className="text-center">
                                  <div className="text-xs font-semibold text-blue-900 mb-1">
                                    {signerDetails[entry.signer_id]?.full_name || 'Your Signature'}
                                  </div>
                                  <div className="text-[10px] text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                    Click to sign here
                                  </div>
                                </div>
                              </div>
                            )
                          ) : (
                            selectedSignature ? (
                              <img
                                src={selectedSignature.image}
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
                    const myEntry = (envelope.signing_order || []).find((e) => currentUserId && e.signer_id === currentUserId)
                    const canPlace = (!myEntry || !myEntry.position) && previewSignerId && currentUserId && previewSignerId === currentUserId
                    if (!canPlace) return null
                    const isThisPage = (draftPlacement?.page || pageNo) === pageNo
                    const defaultW = 180
                    const defaultH = 50
                    return (
                      <div
                        className="absolute inset-0"
                        onClick={(e) => {
                          // click to set initial placement centered at click
                          if (!selectedSignature) return
                          const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
                          const x = e.clientX - rect.left - defaultW / 2
                          const y = e.clientY - rect.top - defaultH / 2
                          setDraftPlacement({ page: pageNo, x: Math.max(0, x), y: Math.max(0, y), width: defaultW, height: defaultH })
                        }}
                      >
                        {isThisPage && draftPlacement && selectedSignature && (
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
                            <img src={selectedSignature.image} alt="Signature preview" className="w-full h-full object-contain select-none pointer-events-none" />
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

      {/* Signature Selector */}
      {mySignatures && mySignatures.length > 0 && (
        <div className="border rounded-lg bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold mb-3">Select Your Signature</h3>
          <p className="text-sm text-gray-600 mb-4">
            Choose which signature to use for signing this document
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {mySignatures.map((sig: any) => {
              const sigId = sig.id || sig.signature_id
              const isSelected = selectedSignature && (selectedSignature.id || selectedSignature.signature_id) === sigId
              const isDefault = sig.is_default
              
              return (
                <div
                  key={sigId}
                  onClick={() => handleSignatureSelect(sig)}
                  className={`
                    relative border-2 rounded-lg p-3 cursor-pointer transition-all hover:shadow-md
                    ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}
                  `}
                >
                  {isDefault && (
                    <span className="absolute top-1 right-1 text-xs bg-green-500 text-white px-2 py-0.5 rounded">
                      Default
                    </span>
                  )}
                  {isSelected && (
                    <div className="absolute top-1 left-1">
                      <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <div className="flex items-center justify-center h-20 bg-gray-50 rounded">
                    {sig.image ? (
                      <img
                        src={sig.image}
                        alt="Signature"
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <div className="text-xs text-gray-400">No preview</div>
                    )}
                  </div>
                </div>
              )
            })}
                </div>
              </div>
              )}

      <Dialog 
        open={isDialogOpen} 
        onOpenChange={(open) => { 
          setIsDialogOpen(open)
          if (!open) {
            // Clear preview when dialog is closed
            setPreviewSignerId(null)
            setSelected(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Signature Placement</DialogTitle>
            <DialogDescription>
              This is where your signature will appear. A live preview is visible on the document. Approve to finalize signing.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center my-4">
            {selectedSignature ? (
              <img
                src={selectedSignature.image}
                alt="Signature preview"
                className="w-[200px] h-[60px] object-contain border border-gray-200 rounded-md"
              />
            ) : (
              <p className="text-sm text-gray-600">No signature selected</p>
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
