'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import toast from 'react-hot-toast'
import apiClient from '@/lib/axios'
import { getUserById, type User } from '@/lib/api/users'
import { useSession } from 'next-auth/react'
import { useAuthReady, shouldRetryAuthQuery } from '@/hooks/useAuthReady'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getEnvelopeDocuments, type EnvelopeDocumentResponse } from '@/lib/api/envelopes'
import { listUserSignatures, type ReusableSignature } from '@/lib/api/signatures'
import { getApiBaseUrl } from '@/lib/env'
import Link from 'next/link'
import { usePdfPasswordDialog } from '@/components/pdf/usePdfPasswordDialog'

type ReactPdfModule = typeof import('react-pdf')
type PdfComponents = Pick<ReactPdfModule, 'Document' | 'Page'> & { pdfjs: ReactPdfModule['pdfjs'] }

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

interface SignerDocumentPositionEntry {
  signer_id: string;
  position: Position;
  document_id: string; // Add document_id to the interface
}

interface EnvelopeResponse {
  id: string
  name?: string
  status: string
  signing_order: Array<{
    signer_id: string;
    order: number;
    signed_at?: string;
    status?: 'pending' | 'signed' | 'rejected';
  }>;
}

export default function SignEnvelopePage() {
  const params = useParams<{ id: string }>()
  const envelopeId = params?.id
  const router = useRouter()
  const { data: session } = useSession()
  const { isReady } = useAuthReady()
  const currentUserId = session?.user?.id
  const accessToken = (session as any)?.accessToken as string | undefined
  const queryClient = useQueryClient()

  const [pdf, setPdf] = useState<PdfComponents | null>(null)
  const password = usePdfPasswordDialog()
  const [numPages, setNumPages] = useState(0)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selected, setSelected] = useState<SignerDocumentPositionEntry | null>(null)
  const [signedFor, setSignedFor] = useState<Record<string, boolean>>({}) // Key: `${documentId}-${signerId}`, Value: true if signed
  const [previewSignerId, setPreviewSignerId] = useState<string | null>(null)
  const [draftPlacement, setDraftPlacement] = useState<Position | null>(null)
  const [isDraggingDraft, setIsDraggingDraft] = useState(false)
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [pageDims, setPageDims] = useState<Record<string, Record<number, { widthPt: number; heightPt: number; widthPx: number; heightPx: number } & {numPages?: number}>>>({}) // docId -> pageNo -> dims
  const pageContainersRef = React.useRef<Record<string, Record<number, HTMLDivElement | null>>>({})
  const setPageContainerRef = useCallback((docId: string, pageNo: number) => (el: HTMLDivElement | null) => {
    if (!pageContainersRef.current[docId]) pageContainersRef.current[docId] = {}
    pageContainersRef.current[docId][pageNo] = el
  }, [])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const mod = (await import('react-pdf')) as ReactPdfModule

        // Keep PDF rendering libs out of SSR.
        // `pdfjs-dist` can crash when evaluated server-side under Webpack.
        mod.pdfjs.GlobalWorkerOptions.workerSrc = `${window.location.origin}/pdf.worker.min.mjs`

        if (!cancelled) {
          setPdf({ Document: mod.Document, Page: mod.Page, pdfjs: mod.pdfjs })
        }
      } catch (e) {
        console.error('[Sign Page] Failed to load PDF renderer:', e)
        toast.error('Failed to initialize PDF preview')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])
  const measurePageCanvas = useCallback((docId: string, pageNo: number) => {
    const container = pageContainersRef.current[docId]?.[pageNo]
    if (!container) return
    requestAnimationFrame(() => {
      const canvas = container.querySelector('canvas') as HTMLCanvasElement | null
      if (!canvas) return
      const widthPx = canvas.clientWidth || 0
      const heightPx = canvas.clientHeight || 0
      setPageDims(prev => {
        const prevDoc = prev[docId] || {}
        const prevPage = prevDoc[pageNo] || { widthPt: 0, heightPt: 0, widthPx: 0, heightPx: 0 }
        return {
          ...prev,
          [docId]: {
            ...prevDoc,
            [pageNo]: { ...prevPage, widthPx, heightPx }
          }
        }
      })
    })
  }, [])
  const [envelopeDocuments, setEnvelopeDocuments] = useState<EnvelopeDocumentResponse[]>([])
  const [signerDetails, setSignerDetails] = useState<Record<string, User>>({})
  const [selectedSignature, setSelectedSignature] = useState<any>(null)
  const [isDeclineDialogOpen, setIsDeclineDialogOpen] = useState(false)
  const [declineMessage, setDeclineMessage] = useState('')
  const [activeFieldPreview, setActiveFieldPreview] = useState<string | null>(null)
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})

  // Resolve possibly relative URLs to backend origin
  const resolveUrl = useCallback((url?: string | null | any) => {
    if (!url) return ''
    if (typeof url !== 'string') {
      console.error('[resolveUrl] Expected string but got:', typeof url, url)
      return ''
    }
    if (/^https?:\/\//i.test(url)) return url
    const apiBase = getApiBaseUrl()
    let backendOrigin = apiBase
    try { backendOrigin = new URL(apiBase).origin } catch {}
    const path = url.startsWith('/') ? url : `/${url}`
    return `${backendOrigin}${path}`
  }, [])

  // Prefer backend proxy endpoint for PDF bytes to avoid CORS/range issues on /media/*
  const getPreviewUrl = useCallback((documentId?: string | null) => {
    if (!documentId) return ''
    return resolveUrl(`/api/documents/${documentId}/preview/`)
  }, [resolveUrl])

  // Keep stable object identity for react-pdf `file` prop to avoid reload warnings
  const pdfFileCacheRef = useRef<Record<string, { url: string; httpHeaders?: Record<string, string> }>>({})

  const pdfFileByDocumentId = useMemo(() => {
    const nextMap: Record<string, { url: string; httpHeaders?: Record<string, string> }> = {}
    const prevMap = pdfFileCacheRef.current
    for (const d of envelopeDocuments) {
      const docId = d.document
      if (!docId) continue
      const url = getPreviewUrl(docId)
      if (!url) continue

      const nextHeaders = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
      const prev = prevMap[docId]
      if (prev && prev.url === url && prev.httpHeaders?.Authorization === nextHeaders?.Authorization) {
        nextMap[docId] = prev
      } else {
        nextMap[docId] = { url, ...(nextHeaders ? { httpHeaders: nextHeaders } : {}) }
      }
    }
    pdfFileCacheRef.current = nextMap
    return nextMap
  }, [accessToken, envelopeDocuments, getPreviewUrl])

  // Fetch envelope detail (raw to preserve signing_order positions)
  const { data: envelope, isLoading: loadingEnv } = useQuery<EnvelopeResponse>({
    queryKey: ['sign-envelope', envelopeId],
    enabled: isReady && !!envelopeId,
    retry: shouldRetryAuthQuery,
    queryFn: async () => {
      const res = await apiClient.get(`/envelopes/${envelopeId}/`)
      const envelope = (res.data?.data ?? res.data) as EnvelopeResponse
      console.log('[Sign Page] Envelope loaded:', envelope)
      console.log('[Sign Page] Signing order:', envelope?.signing_order)
      // No longer setting activeDocumentId here as all documents will be displayed.
      // The `signedFor` state should only track positions signed during the current session,
      // or be updated via a full re-fetch of the envelope if the backend provides granular status.
      // For now, we will rely on re-fetching the envelope data to update status.
      setSignedFor({}); // Initialize as empty, status will be reflected by re-fetching envelope
      return envelope
    },
  })

  // Fetch current user's reusable signatures via shared helper
  const { data: mySignatures } = useQuery<ReusableSignature[]>({
    queryKey: ['my-signatures'],
    enabled: isReady,
    retry: shouldRetryAuthQuery,
    queryFn: async () => {
      const sigs = await listUserSignatures()
      console.log('[Sign Page] Fetched reusable signatures:', sigs)
      return sigs
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


  // Get document URLs for the envelope
  useEffect(() => {
    if (!envelopeId || !isReady) return
    
    const fetchDocuments = async () => {
      try {
        console.log('[Sign Page] Fetching all documents for envelope:', envelopeId)
        const docs = await getEnvelopeDocuments(envelopeId)
        setEnvelopeDocuments(docs)
      } catch (error) {
        console.error('[Sign Page] Failed to fetch envelope documents:', error)
        toast.error('Failed to load documents for signing')
      }
    }
    fetchDocuments()
  }, [envelopeId, isReady])

  // Fetch signer details for all signers in the envelope
  useEffect(() => {
    if (!envelope?.signing_order || !isReady) return
    
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
  }, [envelope?.signing_order, isReady])

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

  const onPlaceholderClick = (entry: SignerDocumentPositionEntry) => {
    // We need the document ID here for the signedFor check
    const documentIdForEntry = entry.document_id || selected?.document_id; // Fallback for existing positions
    if (documentIdForEntry && signedFor[`${documentIdForEntry}-${entry.signer_id}`]) return
    
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
      if (!envelope) {
        throw new Error('Envelope data not loaded.');
      }
      if (!selected?.position) {
        throw new Error('No signature position selected.');
      }
      // Collect all current user's unsigned positions across all documents
      const allMyUnsignedPositions: Array<{
        document_id: string;
        signer_id: string;
        position: Position;
      }> = [];

      envelopeDocuments.forEach((docItem: EnvelopeDocumentResponse) => {
        const currentDocPositions = docItem.signer_document_positions;
        currentDocPositions.forEach((sDocPos) => {
          if (currentUserId && sDocPos.signer_id === currentUserId) {
            const isAlreadySigned = signedFor[`${docItem.id}-${sDocPos.signer_id}`];
            if (!isAlreadySigned) {
              allMyUnsignedPositions.push({
                document_id: docItem.id,
                signer_id: sDocPos.signer_id,
                position: sDocPos.position,
              });
            }
          }
        });
      });

      if (allMyUnsignedPositions.length === 0) {
        throw new Error('No unsigned positions found for you.');
      }

      // For each unsigned position, make a sign call.
      // Note: This assumes the backend can handle multiple sign calls for one envelope.
      // If the backend has a bulk signing endpoint, this would be refactored.
      const signPromises = allMyUnsignedPositions.map(async (unsignedPos) => {
        const body = {
          signature_id: mySignatureId,
          page: unsignedPos.position.page,
          x: Math.max(0, unsignedPos.position.x),
          y: Math.max(0, unsignedPos.position.y),
          width: Math.max(1, unsignedPos.position.width),
          height: Math.max(1, unsignedPos.position.height),
        };
        console.log(`[Sign Page] Signing document ${unsignedPos.document_id} with payload:`, body);
        // If the backend supports document-specific signing, this API call would change.
        // For now, using the envelope-level sign endpoint and implicitly hoping the backend processes based on payload.
        return apiClient.post(`/signatures/${envelopeId}/sign/`, body);
      });

      await Promise.all(signPromises);
      // After all promises resolve, return a generic success indicator
      return { success: true };
      
    },
    onSuccess: () => {
      toast.success('Signed successfully!')
      // Invalidate queries to re-fetch envelope status and documents from backend
      queryClient.invalidateQueries({ queryKey: ['sign-envelope', envelopeId] });
      queryClient.invalidateQueries({ queryKey: ['envelopeDocuments', envelopeId] });
      // For immediate UI feedback, clear selected and preview states.
      setSignedFor({}); // Clear signedFor to force re-evaluation from fresh envelope data
      
      setIsDialogOpen(false)
      setPreviewSignerId(null)
      setDraftPlacement(null)
      setSelected(null)
      // Redirect back to envelope details
      if (envelopeId) {
        router.push(`/dashboard/envelopes/${envelopeId}`)
      }
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || 'Error signing document'
      toast.error(msg)
    },
  })

  // Save non-signature values (for current user) before signing
  const saveValuesMutation = useMutation({
    mutationFn: async () => {
      if (!envelopeId || !currentUserId) return
      const allFields = (envelope as any)?.fields as Array<any> | undefined
      if (!allFields || allFields.length === 0) return
      // Build items
      const items: Array<{ id: string; value: string }> = []
      const todayFmt = (fmt?: string) => { const d=new Date(); const yyyy=d.getFullYear(); const mm=String(d.getMonth()+1).padStart(2,'0'); const dd=String(d.getDate()).padStart(2,'0'); const mmm=d.toLocaleString('en',{month:'short'}); switch(fmt){case 'MM/DD/YYYY':return `${mm}/${dd}/${yyyy}`;case 'DD/MM/YYYY':return `${dd}/${mm}/${yyyy}`;case 'YYYY/MM/DD':return `${yyyy}/${mm}/${dd}`;case 'DD-MMM-YYYY':return `${dd}-${mmm}-${yyyy}`;default:return `${yyyy}-${mm}-${dd}`}}
      const initialsOf = (name?: string) => { if(!name) return ''; const p=name.trim().split(/\s+/); if(p.length===1) return p[0].charAt(0).toUpperCase(); return (p[0].charAt(0)+p[p.length-1].charAt(0)).toUpperCase() }
      allFields.forEach((f:any)=>{
        if (f.assigned_signer !== currentUserId) return
        if (!f.id) return
        let value = ''
        if (f.type === 'text') value = (fieldValues[f.id] ?? f.prefill_value ?? '').toString()
        if (f.type === 'date') value = (f.prefill_value && f.prefill_value.trim()!=='') ? f.prefill_value : todayFmt(f.date_format)
        if (f.type === 'initials') value = (f.prefill_value && f.prefill_value.trim()!=='') ? f.prefill_value : initialsOf(signerDetails[currentUserId!]?.full_name)
        if (f.type === 'designation') value = (f.prefill_value ?? '').toString()
        if (value !== '') items.push({ id: f.id, value })
      })
      if (items.length === 0) return
      const body = { items }
      console.log('[Sign Page][Dashboard] Save values payload:', body)
      await apiClient.post(`/fields/signing/${envelopeId}/values/`, body)
    }
  })

  // Chain: save values then sign on Approve
  const approveAndSign = async () => {
    try {
      // Basic required check
      const myFields = ((envelope as any)?.fields as Array<any> | undefined)?.filter((f:any)=>f.assigned_signer===currentUserId) || []
      const emptyRequired = myFields.filter((f:any)=>{
        if(!f.required) return false
        let v=''
        if(f.type==='text') v=(fieldValues[f.id] ?? f.prefill_value ?? '').toString()
        if(f.type==='date') { const d=new Date(); const yyyy=d.getFullYear(); const mm=String(d.getMonth()+1).padStart(2,'0'); const dd=String(d.getDate()).padStart(2,'0'); const mmm=d.toLocaleString('en',{month:'short'}); const fallback = (():string=>{switch(f.date_format){case 'MM/DD/YYYY':return `${mm}/${dd}/${yyyy}`;case 'DD/MM/YYYY':return `${dd}/${mm}/${yyyy}`;case 'YYYY/MM/DD':return `${yyyy}/${mm}/${dd}`;case 'DD-MMM-YYYY':return `${dd}-${mmm}-${yyyy}`;default:return `${yyyy}-${mm}-${dd}`}})(); v=(f.prefill_value && f.prefill_value.trim()!=='')?f.prefill_value:fallback }
        if(f.type==='initials') { const name=signerDetails[currentUserId!]?.full_name; const init = (():string=>{ if(!name) return ''; const p=name.trim().split(/\s+/); return (p[0]?.[0]||'').toUpperCase() + (p[p.length-1]?.[0]||'').toUpperCase() })(); v=(f.prefill_value && f.prefill_value.trim()!=='')?f.prefill_value:init }
        if(f.type==='designation') v=(f.prefill_value ?? '').toString()
        return !v || v.trim()===''
      })
      if (emptyRequired.length>0) { toast.error('Please complete all required fields'); return }

      await saveValuesMutation.mutateAsync()
      await signMutation.mutateAsync()
    } catch (e:any) {
      console.error('[Sign Page][Dashboard] approveAndSign error:', e)
      toast.error(e?.response?.data?.detail || e?.message || 'Failed to approve and sign')
    }
  }
  
  // Decline mutation
  const declineMutation = useMutation({
    mutationFn: async (message?: string) => {
      const body = message ? { decline_message: message } : { decline_message: 'Declined without specific reason.' };
      const res = await apiClient.post(`/signatures/${envelopeId}/decline/`, body);
      return res.data
    },
    onSuccess: () => {
      toast.success('Envelope declined successfully.')
      setIsDeclineDialogOpen(false)
      // Redirect back to envelope details
      if (envelopeId) {
        router.push(`/dashboard/envelopes/${envelopeId}`)
      }
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || 'Error declining envelope'
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

  if (!isReady || loadingEnv || !envelope || !envelopeDocuments.length) return <div className="p-6">Loading envelope…</div>

  // Signing must not be available for completed envelopes (PDF is on S3; backend rejects signing by design).
  if ((envelope.status || '').toLowerCase() === 'completed') {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <h1 className="text-xl font-semibold">{envelope.name || 'Envelope'}</h1>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-800 font-medium">This envelope is completed.</p>
          <p className="text-sm text-gray-600 mt-1">
            Signing is no longer available. You can view the finalized document(s) from the envelope details page.
          </p>
          <div className="flex items-center gap-2 mt-4">
            <Button asChild variant="outline">
              <Link href={`/dashboard/envelopes/${envelopeId}`}>Back to envelope</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }
  
  console.log('[Sign Page Render] Current envelope:', envelope)
  console.log('[Sign Page Render] Signing order count:', envelope?.signing_order?.length)
  console.log('[Sign Page Render] Page dimensions:', pageDims)
  console.log('[Sign Page Render] currentUserId:', currentUserId);

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
        {envelopeDocuments.map((docItem) => (
          <div key={docItem.id} className="mb-8 border rounded-lg bg-gray-50">
            <h3 className="text-lg font-semibold p-4 border-b text-gray-800">
              Document: {docItem.file_name || `Document ${docItem.id}`}
            </h3>
            {password.dialog}
            {docItem.document_file_url && pdf && !password.cancelled ? (
              <pdf.Document
                file={pdfFileByDocumentId[docItem.document]}
                onLoadSuccess={(info: { numPages: number }) => {
                  console.log(`[Sign Page] PDF for ${docItem.id} loaded successfully, numPages:`, info.numPages);
                  // We need to store numPages per document to render all pages correctly
                  setPageDims(prev => ({
                    ...prev,
                    [docItem.id]: {
                      numPages: info.numPages, // Store numPages for this document
                      ...prev[docItem.id] // Keep existing page dimensions if any
                    }
                  }));
                }}
                onLoadError={(error: any) => {
                  console.error(`[Sign Page] PDF load error for ${docItem.id}:`, error);
                  toast.error(`Failed to load PDF for ${docItem.file_name || docItem.id}`);
                }}
                onPassword={password.onPassword as any}
                loading=""
              >
                {Array.from({ length: (pageDims[docItem.id] as any)?.numPages || 1 }, (_, i) => i + 1).map((pageNo) => {
                  console.log(`[Sign Page] Rendering page ${pageNo} for document ${docItem.id}`);
                  return (
                  <div
                    key={`${docItem.id}-${pageNo}`}
                    className="relative w-fit max-w-full mx-auto mb-8"
                    ref={setPageContainerRef(docItem.id, pageNo)}
                  >
                    <pdf.Page
                      pageNumber={pageNo}
                      renderAnnotationLayer={false}
                      renderTextLayer={false}
                      className="shadow w-fit max-w-full"
                      loading=""
                      data-page-key={`${docItem.id}-${pageNo}`}
                      onRenderSuccess={(page: any) => {
                        try {
                          const [x0, y0, x1, y1] = page.view || [0, 0, page.width, page.height];
                          const widthPt = Math.abs((x1 ?? page.width) - (x0 ?? 0)) || page.width || 0;
                          const heightPt = Math.abs((y1 ?? page.height) - (y0 ?? 0)) || page.height || 0;
                          // Prefer the canvas within this specific Page instance using a page key
                          const pageEl = document.querySelector(`[data-page-key="${docItem.id}-${pageNo}"]`) as HTMLElement | null;
                          const canvas = pageEl ? (pageEl.querySelector('canvas') as HTMLCanvasElement | null) : (page as any).canvas;
                          const widthPx = canvas?.clientWidth || 0;
                          const heightPx = canvas?.clientHeight || 0;
                          setPageDims(prev => ({
                            ...prev,
                            [docItem.id]: { 
                              ...(prev[docItem.id] || {}), 
                              [pageNo]: { widthPt, heightPt, widthPx: prev[docItem.id]?.[pageNo]?.widthPx || 0, heightPx: prev[docItem.id]?.[pageNo]?.heightPx || 0 } 
                            }
                          }));
                          // Defer canvas measurement
                          measurePageCanvas(docItem.id, pageNo)
                          console.log(`[Sign Page] Page ${pageNo} dims for doc ${docItem.id}:`, { widthPt, heightPt });
                        } catch (e) {
                          console.error('Error getting page dimensions:', e);
                        }
                      }}
                    />

                    {/* Overlay placeholders for this page */}
                    <div className="absolute inset-0">
                      {(() => {
                        const signerPositionsForThisDoc = docItem.signer_document_positions || [];
                        console.log(`[Sign Page] signerPositionsForThisDoc for doc ${docItem.id}:`, signerPositionsForThisDoc);

                        const myPositionsOnThisPage = signerPositionsForThisDoc
                          .filter(sp => {
                           console.log(`[Sign Page] Filtering position: currentUserId=${currentUserId}, sp.signer_id=${sp.signer_id}, match=${sp.signer_id === currentUserId}, page=${sp.position.page}, pageNo=${pageNo}, pageMatch=${sp.position.page === pageNo}`);
                           return currentUserId && sp.signer_id === currentUserId && sp.position.page === pageNo
                         });
                      
                        console.log(`[Sign Page] Document ${docItem.id}, Page ${pageNo} - Positions for current user:`, myPositionsOnThisPage);
                        return myPositionsOnThisPage.map((entry, idx) => {
                          const isMe = entry.signer_id === currentUserId;
                          const isSigned = signedFor[`${docItem.id}-${entry.signer_id}`];
                          const isPreview = previewSignerId === entry.signer_id && !isSigned;
                          const dims = pageDims[docItem.id]?.[pageNo];
                          
                          console.log(`[Sign Page] Rendering placeholder for signer ${entry.signer_id} on doc ${docItem.id} page ${pageNo}:`, {
                            position: entry.position,
                            dims,
                            isMe,
                            isSigned,
                            isPreview
                          });
                          
                          let commonStyle: React.CSSProperties = {};
                          if (dims && dims.widthPt > 0 && dims.heightPt > 0 && dims.widthPx > 0 && dims.heightPx > 0) {
                            const scaleX = dims.widthPx / (dims.widthPt || 1);
                            const scaleY = dims.heightPx / (dims.heightPt || 1);
                            const x = entry.position.x || 0;
                            const y = entry.position.y || 0;
                            const w = entry.position.width || 0;
                            const h = entry.position.height || 0;
                            // Heuristic: support both point (top-left Y) and legacy pixel storage
                            const looksLikePixels = x > dims.widthPt * 2 || y > dims.heightPt * 2 || w > dims.widthPt * 2 || h > dims.heightPt * 2;
                            const leftPx = looksLikePixels ? x : x * scaleX;
                            const topPx = looksLikePixels ? y : y * scaleY;
                            const widthPx = looksLikePixels ? w : w * scaleX;
                            const heightPx = looksLikePixels ? h : h * scaleY;
                            // Clamp into page bounds
                            const clampedLeft = Math.max(0, Math.min(leftPx, (dims.widthPx || 0) - widthPx));
                            const clampedTop = Math.max(0, Math.min(topPx, (dims.heightPx || 0) - heightPx));
                            commonStyle = { left: clampedLeft, top: clampedTop, width: widthPx, height: heightPx };
                            console.log(`[Sign Page] Computed style for placeholder:`, { commonStyle, looksLikePixels, dims });
                          } else {
                            console.warn(`[Sign Page] No dimensions available for doc ${docItem.id} page ${pageNo} yet`);
                          }
                          
                          if (!(commonStyle as any).width || !(commonStyle as any).height) {
                            return null
                          }
                          return (
                            <div key={`${docItem.id}-${entry.signer_id}-${idx}`} className="absolute" style={commonStyle}>
                              {!isSigned ? (
                                isPreview && selectedSignature ? (
                                  <div
                                    className="relative w-full h-full rounded-md border-2 border-green-500 bg-white shadow-lg cursor-pointer hover:border-green-600 transition group"
                                    onClick={() => (isMe ? onPlaceholderClick({ ...entry, document_id: docItem.id }) : undefined)}
                                    title="Click to confirm and sign"
                                  >
                                    <img
                                      src={selectedSignature.image || selectedSignature.image_url}
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
                                    onClick={() => onPlaceholderClick({ ...entry, document_id: docItem.id })}
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
                                ) : selectedSignature ? (
                                  <img
                                    src={selectedSignature.image || selectedSignature.image_url}
                                    alt="Signed"
                                    className="w-full h-full object-contain select-none"
                                  />
                                ) : (
                                  <div className="absolute inset-0 bg-green-100 border-2 border-green-400 rounded-md" />
                                )}
                              </div>
                          )
                        })
                      })()}

                      {/* Non-signature fields overlays for this page */}
                      {(() => {
                        const allFields = (envelope as any).fields as Array<any> | undefined
                        if (!allFields || allFields.length === 0) return null
                        const dims = pageDims[docItem.id]?.[pageNo]
                        const fieldsForPage = allFields.filter(f => (f?.page || 0) === pageNo)
                        console.log('[Sign Page][NonSig][Dashboard] doc', docItem.id, 'page', pageNo, 'fieldsForPage:', fieldsForPage)
                        return fieldsForPage.map((f, idx) => {
                          const key = (f as any).id || `${docItem.id}-${pageNo}-${idx}`
                          let style: React.CSSProperties = {}
                          if (dims && dims.widthPt > 0 && dims.heightPt > 0 && dims.widthPx > 0 && dims.heightPx > 0) {
                            const scaleX = dims.widthPx / (dims.widthPt || 1)
                            const scaleY = dims.heightPx / (dims.heightPt || 1)
                            const x = f.x || 0
                            const y = f.y || 0
                            const w = f.width || 0
                            const h = f.height || 0
                            const looksLikePixels = x > dims.widthPt * 2 || y > dims.heightPt * 2 || w > dims.widthPt * 2 || h > dims.widthPt * 2
                            const leftPx = looksLikePixels ? x : x * scaleX
                            const topPx = looksLikePixels ? y : y * scaleY
                            const widthPx = looksLikePixels ? w : w * scaleX
                            const heightPx = looksLikePixels ? h : h * scaleY
                            const clampedLeft = Math.max(0, Math.min(leftPx, (dims.widthPx || 0) - widthPx))
                            const clampedTop = Math.max(0, Math.min(topPx, (dims.heightPx || 0) - heightPx))
                            style = { left: clampedLeft, top: clampedTop, width: widthPx, height: heightPx }
                          }
                          const isMine = !currentUserId || !f.assigned_signer || f.assigned_signer === currentUserId
                          const borderColor = isMine ? 'border-blue-500' : 'border-gray-400'
                          const bgColor = isMine ? 'bg-blue-50/40' : 'bg-gray-100/40'
                          const isActive = activeFieldPreview === key
                          const interactiveCls = 'group absolute inset-0 border-2 border-blue-500 bg-blue-100/40 rounded-md cursor-pointer hover:bg-blue-200/60 transition flex flex-col items-center justify-center p-2'
                          const disabledCls = 'absolute inset-0 border border-gray-300 bg-gray-200/30 rounded-md cursor-not-allowed flex items-center justify-center p-2'
                          const fontFamily = f.font_family || 'Helvetica'
                          const fontSize = f.font_size || 12
                          const requiredMark = f.required ? ' *' : ''

                          // Helper: initials and date
                          const myName = currentUserId ? signerDetails[currentUserId]?.full_name : undefined
                          const initials = (() => {
                            if (!myName) return ''
                            const parts = myName.trim().split(/\s+/)
                            if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
                            return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
                          })()
                          const today = (() => {
                            const d = new Date()
                            const yyyy = d.getFullYear()
                            const mm = String(d.getMonth() + 1).padStart(2, '0')
                            const dd = String(d.getDate()).padStart(2, '0')
                            const mmm = d.toLocaleString('en', { month: 'short' })
                            switch (f.date_format) {
                              case 'MM/DD/YYYY': return `${mm}/${dd}/${yyyy}`
                              case 'DD/MM/YYYY': return `${dd}/${mm}/${yyyy}`
                              case 'YYYY/MM/DD': return `${yyyy}/${mm}/${dd}`
                              case 'DD-MMM-YYYY': return `${dd}-${mmm}-${yyyy}`
                              case 'YYYY-MM-DD':
                              default: return `${yyyy}-${mm}-${dd}`
                            }
                          })()

                          console.log('[Sign Page][NonSig][Dashboard] field calc', {
                            key,
                            type: f.type,
                            assigned_signer: f.assigned_signer,
                            recipientName: signerDetails[f.assigned_signer || '']?.full_name,
                            isMine,
                            prefill_value: f.prefill_value,
                            date_format: f.date_format,
                            today,
                            initials,
                            style
                          })

                          const header = (
                            <div className="absolute top-0 left-0 right-0 text-[10px] leading-none px-1 pt-0.5 text-blue-900/90 flex items-center justify-between">
                              <span className="truncate max-w-[70%]">{isMine ? (signerDetails[f.assigned_signer || '']?.full_name || 'You') : 'Recipient'}</span>
                              <span className="uppercase opacity-80">{f.type}</span>
                            </div>
                          )

                          const handleClick = () => {
                            if (!isMine) return
                            setActiveFieldPreview(prev => {
                              const next = prev === key ? null : key
                              console.log('[Sign Page][NonSig][Dashboard] click toggle', { key, next })
                              return next
                            })
                          }

                          if (!(style as any).width || !(style as any).height) return null
                          if (f.type === 'date') {
                            const value = (f.prefill_value && f.prefill_value.trim() !== '') ? f.prefill_value : today
                            console.log('[Sign Page][NonSig][Dashboard] date value', { key, value })
                            return (
                              <div key={`nf-${docItem.id}-${idx}`} className="absolute" style={style}>
                                <div
                                  className={isMine ? interactiveCls : disabledCls}
                                  title={`Date${requiredMark}`}
                                  role={isMine ? 'button' : undefined}
                                  onClick={handleClick}
                                >
                                  {header}
                                  <div style={{ fontFamily, fontSize }} className="w-full h-full flex items-center justify-center text-gray-900">
                                    {value}
                                  </div>
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
                            console.log('[Sign Page][NonSig][Dashboard] initials value', { key, value })
                            return (
                              <div key={`nf-${docItem.id}-${idx}`} className="absolute" style={style}>
                                <div
                                  className={isMine ? interactiveCls : disabledCls}
                                  title={`Initials${requiredMark}`}
                                  role={isMine ? 'button' : undefined}
                                  onClick={handleClick}
                                >
                                  {header}
                                  <div style={{ fontFamily, fontSize }} className="w-full h-full flex items-center justify-center text-gray-900">
                                    {value || '—'}
                                  </div>
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
                              <div key={`nf-${docItem.id}-${idx}`} className="absolute" style={style}>
                                <div
                                  className={isMine ? interactiveCls : disabledCls}
                                  title={`Designation${requiredMark}`}
                                  role={isMine ? 'button' : undefined}
                                  onClick={handleClick}
                                >
                                  {header}
                                  <div style={{ fontFamily, fontSize }} className="w-full truncate text-gray-900 px-2">
                                    {value}
                                  </div>
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
                            <div key={`nf-${docItem.id}-${idx}`} className="absolute" style={style}>
                              <div
                                className={isMine ? interactiveCls : disabledCls}
                                title={`Text${requiredMark}`}
                                role={isMine ? 'button' : undefined}
                                onClick={handleClick}
                              >
                                {header}
                                <input
                                  type="text"
                                  defaultValue={f.prefill_value || fieldValues[(f as any).id || ''] || ''}
                                  placeholder={f.placeholder || ''}
                                  maxLength={f.max_length || undefined}
                                  readOnly={!isMine}
                                  className="w-full h-full bg-transparent outline-none text-gray-900"
                                  style={{ fontFamily, fontSize }}
                                  autoFocus={isActive}
                                  onChange={(e) => {
                                    const id = (f as any).id
                                    if (!id) return
                                    setFieldValues(prev => ({ ...prev, [id]: e.target.value }))
                                  }}
                                />
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
                        const mySignerDocPosition = docItem.signer_document_positions?.find(s => s.signer_id === currentUserId);
                        const canPlace = (!mySignerDocPosition || !mySignerDocPosition.position) && previewSignerId && currentUserId && previewSignerId === currentUserId && docItem.document_file_url;
                        if (!canPlace) return null;
                        // Ensure draft placement is for the current document being rendered
                        const isThisDocAndPage = draftPlacement?.page === pageNo && selected?.document_id === docItem.id; 
                        const defaultW = 180;
                        const defaultH = 50;
                        return (
                          <div
                            className="absolute inset-0"
                            onClick={(e) => {
                              if (!selectedSignature) return;
                              const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                              const x = e.clientX - rect.left - defaultW / 2;
                              const y = e.clientY - rect.top - defaultH / 2;
                              // Set draft placement for the specific document and page
                              setSelected({ ...selected!, document_id: docItem.id });
                              setDraftPlacement({ page: pageNo, x: Math.max(0, x), y: Math.max(0, y), width: defaultW, height: defaultH });
                            }}
                          >
                            {isThisDocAndPage && draftPlacement && selectedSignature && (
                              <div
                                className="absolute border-2 border-blue-500 bg-white/90 cursor-move rounded-md shadow"
                                style={{ left: draftPlacement.x, top: draftPlacement.y, width: draftPlacement.width, height: draftPlacement.height }}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  setIsDraggingDraft(true);
                                  const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                                  setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                                }}
                                onMouseUp={() => setIsDraggingDraft(false)}
                                onMouseLeave={() => setIsDraggingDraft(false)}
                                onMouseMove={(e) => {
                                  if (!isDraggingDraft || !draftPlacement) return;
                                  const parentRect = (e.currentTarget.parentElement as HTMLDivElement).getBoundingClientRect();
                                  const newX = Math.max(0, Math.min(e.clientX - parentRect.left - dragOffset.x, parentRect.width - draftPlacement.width));
                                  const newY = Math.max(0, Math.min(e.clientY - parentRect.top - dragOffset.y, parentRect.height - draftPlacement.height));
                                  setDraftPlacement({ ...draftPlacement, x: newX, y: newY });
                                }}
                                >
                                  <img
                                    src={selectedSignature.image || selectedSignature.image_url}
                                    alt="Signature preview"
                                    className="w-full h-full object-contain select-none pointer-events-none"
                                  />
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </pdf.Document>
            ) : password.cancelled ? (
              <div className="min-h-[200px] flex items-center justify-center text-gray-500">
                PDF preview cancelled.
              </div>
          ) : docItem.document_file_url ? (
            <div className="min-h-[200px] flex items-center justify-center text-gray-500">
              Loading PDF preview…
            </div>
          ) : (
            <div className="min-h-[200px] flex items-center justify-center text-gray-500">
              No PDF preview available for this document.
            </div>
          )}
        </div>
        ))}
      </div>

      {/* Decline to Sign Button */}
      <div className="flex justify-end mt-4 mb-4">
        <Button 
          variant="destructive"
          onClick={() => setIsDeclineDialogOpen(true)}
          disabled={declineMutation.isPending}
        >
          Decline to Sign
        </Button>
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
              const isSelected =
                selectedSignature && (selectedSignature.id || selectedSignature.signature_id) === sigId
              const isDefault = sig.is_default
              const imageSrc = sig.image || sig.image_url
              
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
                    {imageSrc ? (
                      <img
                        src={imageSrc}
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
                src={selectedSignature.image || selectedSignature.image_url}
                alt="Signature preview"
                className="w-[200px] h-[60px] object-contain border border-gray-200 rounded-md"
              />
            ) : (
              <p className="text-sm text-gray-600">No signature selected</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={approveAndSign} disabled={signMutation.isPending || saveValuesMutation.isPending}>
              {(signMutation.isPending || saveValuesMutation.isPending) ? 'Processing…' : 'Approve & Sign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeclineDialogOpen} onOpenChange={setIsDeclineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline to Sign</DialogTitle>
            <DialogDescription>
              Please provide a reason for declining this envelope (optional).
            </DialogDescription>
          </DialogHeader>
          <div className="my-4">
            <label htmlFor="decline-message" className="sr-only">Decline Message</label>
            <Textarea
              id="decline-message"
              placeholder="e.g., Document terms are not acceptable."
              value={declineMessage}
              onChange={(e) => setDeclineMessage(e.target.value)}
              className="w-full min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeclineDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive"
              onClick={() => declineMutation.mutate(declineMessage)}
              disabled={declineMutation.isPending}
            >
              {declineMutation.isPending ? 'Declining…' : 'Decline Envelope'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
