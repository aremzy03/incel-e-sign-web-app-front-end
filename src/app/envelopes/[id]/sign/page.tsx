'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Document, Page, pdfjs } from 'react-pdf'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import toast from 'react-hot-toast'
import apiClient from '@/lib/axios'
import { getApiBaseUrl } from '@/lib/env'

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
  // Optional from backend: non-signature fields
  fields?: Array<{
    document_id?: string
    page: number
    x: number
    y: number
    width: number
    height: number
    type: 'initials' | 'date' | 'text' | 'designation'
    assigned_signer?: string
    required?: boolean
    prefill_value?: string | null
    font_family?: string
    font_size?: number
    date_format?: string
    placeholder?: string
    max_length?: number
  }>
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
  const pageContainersRef = React.useRef<Record<string, HTMLDivElement | null>>({})
  const setPageContainerRef = useCallback((key: string) => (el: HTMLDivElement | null) => {
    pageContainersRef.current[key] = el
  }, [])
  const measurePageCanvas = useCallback((key: string) => {
    const container = pageContainersRef.current[key]
    if (!container) return
    requestAnimationFrame(() => {
      const canvas = container.querySelector('canvas') as HTMLCanvasElement | null
      if (!canvas) return
      const widthPx = canvas.clientWidth || 0
      const heightPx = canvas.clientHeight || 0
      const pageNo = Number(key)
      if (!pageNo) return
      setPageDims(prev => ({ ...prev, [pageNo]: { ...(prev[pageNo] || { widthPt: 0, heightPt: 0, widthPx: 0, heightPx: 0 }), widthPx, heightPx } }))
    })
  }, [])
  const [activeFieldPreview, setActiveFieldPreview] = useState<string | null>(null)

  // Resolve possibly relative URLs to backend origin
  const resolveUrl = useCallback((url?: string | null) => {
    if (!url) return ''
    if (/^https?:\/\//i.test(url)) return url
    const apiBase = getApiBaseUrl()
    let backendOrigin = apiBase
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

  const currentUserFullName: string | undefined = useMemo(() => {
    try {
      return (window as any).__CURRENT_USER_NAME__ || undefined
    } catch { return undefined }
  }, [])

  const formatDate = useCallback((d: Date, pattern?: string) => {
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const mmm = d.toLocaleString('en', { month: 'short' })
    switch (pattern) {
      case 'MM/DD/YYYY': return `${mm}/${dd}/${yyyy}`
      case 'DD/MM/YYYY': return `${dd}/${mm}/${yyyy}`
      case 'YYYY/MM/DD': return `${yyyy}/${mm}/${dd}`
      case 'DD-MMM-YYYY': return `${dd}-${mmm}-${yyyy}`
      case 'YYYY-MM-DD':
      default: return `${yyyy}-${mm}-${dd}`
    }
  }, [])

  const getInitials = useCallback((full?: string) => {
    if (!full) return ''
    const parts = full.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  }, [])

  const documentUrl = useMemo(() => {
    const doc = envelope?.document
    const raw = typeof doc === 'string' ? doc : (doc?.file_url || '')
    return resolveUrl(raw)
  }, [envelope, resolveUrl])

  // Map signer id to name if backend provides it on public sign page
  const signerIdToName = useMemo(() => {
    const map: Record<string, string> = {}
    try {
      const anyEnv: any = envelope as any
      const sigs: Array<any> = anyEnv?.signatures || []
      sigs.forEach((s) => {
        if (s?.signer && s?.signer_name) map[s.signer] = s.signer_name
      })
    } catch {}
    return map
  }, [envelope])

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
        // Convert from on-screen pixels back to PDF points to reduce flattening offset
        const dims = pageDims[draftPlacement.page]
        if (dims && dims.widthPt && dims.heightPt && dims.widthPx && dims.heightPx) {
          const scaleX = (dims.widthPt || 1) / (dims.widthPx || 1)
          const scaleY = (dims.heightPt || 1) / (dims.heightPx || 1)
          const xPt = Math.max(0, draftPlacement.x) * scaleX
          const yTopPx = Math.max(0, draftPlacement.y)
          const hPx = Math.max(1, draftPlacement.height)
          const yBottomPt = (dims.heightPt - (yTopPx + hPx) * scaleY)
          const wPt = Math.max(1, draftPlacement.width) * scaleX
          const hPt = hPx * scaleY
          body.page = draftPlacement.page
          body.x = xPt
          body.y = yBottomPt
          body.width = wPt
          body.height = hPt
        } else {
          // Fallback to raw pixels if dims missing
          body.page = draftPlacement.page
          body.x = Math.max(0, draftPlacement.x)
          body.y = Math.max(0, draftPlacement.y)
          body.width = Math.max(1, draftPlacement.width)
          body.height = Math.max(1, draftPlacement.height)
        }
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
              <div key={pageNo} className="relative" ref={setPageContainerRef(`${pageNo}`)}>
                <Page
                  pageNumber={pageNo}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                  className="shadow"
                  loading=""
                  data-page-key={`public-${pageNo}`}
                  onRenderSuccess={(page: any) => {
                    try {
                      const [x0, y0, x1, y1] = page.view || [0, 0, page.width, page.height]
                      const widthPt = Math.abs((x1 ?? page.width) - (x0 ?? 0)) || page.width || 0
                      const heightPt = Math.abs((y1 ?? page.height) - (y0 ?? 0)) || page.height || 0
                      setPageDims((prev) => ({ ...prev, [pageNo]: { widthPt, heightPt, widthPx: prev[pageNo]?.widthPx || 0, heightPx: prev[pageNo]?.heightPx || 0 } }))
                      measurePageCanvas(`${pageNo}`)
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
                      if (dims && dims.widthPt > 0 && dims.heightPt > 0 && dims.widthPx > 0 && dims.heightPx > 0) {
                        // Convert stored top-left Y to CSS top using page height
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
                      
                      if (!(commonStyle as any).width || !(commonStyle as any).height) {
                        return null
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

                  {/* Non-signature fields overlays */}
                  {(() => {
                    const allFields = (envelope as any).fields as EnvelopeResponse['fields'] | undefined
                    if (!allFields || allFields.length === 0) return null
                    const fieldsForPage = allFields.filter(f => (f?.page || 0) === pageNo)
                    console.log('[Sign Page][NonSig] page', pageNo, 'fieldsForPage:', fieldsForPage)
                    const dims = pageDims[pageNo]
                    return fieldsForPage.map((f, idx) => {
                      const key = (f as any).id || `${pageNo}-${idx}`
                      let style: React.CSSProperties = {}
                      if (dims && dims.widthPt > 0 && dims.heightPt > 0 && dims.widthPx > 0 && dims.heightPx > 0) {
                        const scaleX = dims.widthPx / (dims.widthPt || 1)
                        const scaleY = dims.heightPx / (dims.heightPt || 1)
                        const x = f.x || 0
                        const y = f.y || 0
                        const w = f.width || 0
                        const h = f.height || 0
                        const looksPixels = x > dims.widthPt * 2 || y > dims.heightPt * 2 || w > dims.widthPt * 2 || h > dims.widthPt * 2
                        const leftPx = looksPixels ? x : x * scaleX
                        const topPx = looksPixels ? y : y * scaleY
                        const widthPx = looksPixels ? w : w * scaleX
                        const heightPx = looksPixels ? h : h * scaleY
                        const clampedLeft = Math.max(0, Math.min(leftPx, (dims.widthPx || 0) - widthPx))
                        const clampedTop = Math.max(0, Math.min(topPx, (dims.heightPx || 0) - heightPx))
                        style = { left: clampedLeft, top: clampedTop, width: widthPx, height: heightPx }
                      }
                      const isMine = !currentUserId || !f.assigned_signer || f.assigned_signer === currentUserId
                      const interactiveCls = 'group absolute inset-0 border-2 border-blue-500 bg-blue-100/40 rounded-md cursor-pointer hover:bg-blue-200/60 transition flex flex-col items-center justify-center p-2'
                      const disabledCls = 'absolute inset-0 border border-gray-300 bg-gray-200/30 rounded-md cursor-not-allowed flex items-center justify-center p-2'
                      const fontFamily = f.font_family || 'Helvetica'
                      const fontSize = f.font_size || 12
                      const requiredMark = f.required ? ' *' : ''
                      const today = formatDate(new Date(), f.date_format || 'YYYY-MM-DD')
                      const recipientName = f.assigned_signer ? (signerIdToName?.[f.assigned_signer] || currentUserFullName) : currentUserFullName
                      const initials = getInitials(recipientName)
                      console.log('[Sign Page][NonSig] field calc', {
                        key,
                        type: f.type,
                        assigned_signer: f.assigned_signer,
                        recipientName,
                        isMine,
                        prefill_value: f.prefill_value,
                        date_format: f.date_format,
                        today,
                        initials,
                        style
                      })
                      const header = (
                        <div className="absolute top-0 left-0 right-0 text-[10px] leading-none px-1 pt-0.5 text-blue-900/90 flex items-center justify-between">
                          <span className="truncate max-w-[70%]">{isMine ? (recipientName || 'You') : (recipientName || 'Recipient')}</span>
                          <span className="uppercase opacity-80">{f.type}</span>
                        </div>
                      )
                      const isActive = activeFieldPreview === key
                      const handleClick = () => {
                        if (!isMine) return
                        setActiveFieldPreview(prev => {
                          const next = prev === key ? null : key
                          console.log('[Sign Page][NonSig] click toggle', { key, next })
                          return next
                        })
                      }

                      if (!(style as any).width || !(style as any).height) return null
                      if (f.type === 'date') {
                        const value = (f.prefill_value && f.prefill_value.trim() !== '') ? f.prefill_value : today
                        console.log('[Sign Page][NonSig] date value', { key, value })
                        return (
                          <div key={`nf-${idx}`} className="absolute" style={style}>
                            <div className={isMine ? interactiveCls : disabledCls} title={`Date${requiredMark}`} role={isMine ? 'button' : undefined} onClick={handleClick}>
                              {header}
                              <div style={{ fontFamily, fontSize }} className="w-full h-full flex items-center justify-center text-gray-900">
                                {value}
                              </div>
                              {isActive && (
                                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/95 border-2 border-blue-500 rounded-md shadow-lg">
                                  <div style={{ fontFamily, fontSize: Math.max(fontSize * 1.5, 14) }} className="px-2 text-blue-900 font-semibold">
                                    {value}
                                  </div>
                                </div>
                              )}
                              {isMine && (
                                <div className="absolute bottom-0.5 left-0 right-0 text-[10px] text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity text-center">
                                  Click to preview
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      }
                      if (f.type === 'initials') {
                        const value = (f.prefill_value && f.prefill_value.trim() !== '') ? f.prefill_value : initials
                        console.log('[Sign Page][NonSig] initials value', { key, value })
                        return (
                          <div key={`nf-${idx}`} className="absolute" style={style}>
                            <div className={isMine ? interactiveCls : disabledCls} title={`Initials${requiredMark}`} role={isMine ? 'button' : undefined} onClick={handleClick}>
                              {header}
                              <div style={{ fontFamily, fontSize }} className="w-full h-full flex items-center justify-center text-gray-900">
                                {value || '—'}
                              </div>
                              {isActive && (
                                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/95 border-2 border-blue-500 rounded-md shadow-lg">
                                  <div style={{ fontFamily, fontSize: Math.max(fontSize * 1.5, 14) }} className="px-2 text-blue-900 font-semibold">
                                    {value || '—'}
                                  </div>
                                </div>
                              )}
                              {isMine && (
                                <div className="absolute bottom-0.5 left-0 right-0 text-[10px] text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity text-center">
                                  Click to preview
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      }
                      if (f.type === 'designation') {
                        const value = f.prefill_value ?? 'Designation not set'
                        return (
                          <div key={`nf-${idx}`} className="absolute" style={style}>
                            <div className={isMine ? interactiveCls : disabledCls} title={`Designation${requiredMark}`} role={isMine ? 'button' : undefined} onClick={handleClick}>
                              {header}
                              <div style={{ fontFamily, fontSize }} className="px-2 w-full truncate text-gray-900">
                                {value}
                              </div>
                              {isActive && (
                                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/95 border-2 border-blue-500 rounded-md shadow-lg">
                                  <div style={{ fontFamily, fontSize: Math.max(fontSize * 1.5, 14) }} className="px-2 text-blue-900 font-semibold truncate max-w-full">
                                    {value}
                                  </div>
                                </div>
                              )}
                              {isMine && (
                                <div className="absolute bottom-0.5 left-0 right-0 text-[10px] text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity text-center">
                                  Click to preview
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      }
                      // text input
                      return (
                        <div key={`nf-${idx}`} className="absolute" style={style}>
                          <div className={isMine ? interactiveCls : disabledCls} title={`Text${requiredMark}`} role={isMine ? 'button' : undefined} onClick={handleClick}>
                            {header}
                            <input
                              type="text"
                              defaultValue={f.prefill_value || ''}
                              placeholder={f.placeholder || ''}
                              maxLength={f.max_length || undefined}
                              readOnly={!isMine}
                              className="w-full h-full bg-transparent outline-none text-gray-900"
                              style={{ fontFamily, fontSize }}
                              autoFocus={isActive}
                            />
                            {isActive && !isMine && (
                              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/95 border-2 border-blue-500 rounded-md shadow-lg">
                                <div style={{ fontFamily, fontSize: Math.max(fontSize * 1.5, 14) }} className="px-2 text-blue-900 font-semibold truncate max-w-full">
                                  {f.prefill_value || ''}
                                </div>
                              </div>
                            )}
                            {isMine && (
                              <div className="absolute bottom-0.5 left-0 right-0 text-[10px] text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity text-center">
                                Click to type
                              </div>
                            )}
                          </div>
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


