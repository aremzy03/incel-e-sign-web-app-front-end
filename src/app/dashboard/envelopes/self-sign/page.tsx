'use client'

import React, { Suspense, useState, useCallback, useMemo, useEffect } from 'react'
import { DndContext, DragOverlay } from '@dnd-kit/core'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { SelfSignEditorHeader } from '@/components/signing/self-sign-editor-header'
import { SelfSignNavSidebar } from '@/components/signing/self-sign-nav-sidebar'
import { SelfSignToolsSidebar } from '@/components/signing/self-sign-tools-sidebar'
import { SigningShell } from '@/components/signing/signing-shell'
import { SelfSignStart } from '@/components/signing/self-sign-start'
import {
  SIGNING_ZOOM_DEFAULT,
  SIGNING_ZOOM_MAX,
  SIGNING_ZOOM_MIN,
  SIGNING_ZOOM_STEP,
} from '@/components/signing/signing-toolbar'
import { useProfile } from '@/hooks/useProfile'
import { useSelfSignEnvelope } from '@/hooks/useEnvelopes'
import { Document, getDocument, mergeDocuments, normalizeDocument } from '@/lib/api/documents'
import { listUserSignatures } from '@/lib/api/signatures'
import type { SelfSignRequest } from '@/lib/api/signatures'
import { FrozenEnvelopeError } from '@/lib/api/signing-errors'
import { saveSigningJob } from '@/lib/signing/signing-job-storage'
import { SigningFrozenEnvelopeAlert } from '@/components/signing/signing-frozen-envelope-alert'
import {
  CREATE_EDITOR_VIEWPORT_SCALE,
  fieldPositionToBackendPdfPoints,
  WIZARD_SIGNATURE_HEIGHT,
  WIZARD_SIGNATURE_WIDTH,
} from '@/lib/utils/field-geometry'
import type { DocumentPageInfo } from '@/components/envelope/VerticalPDFViewer'
import { FieldPosition, FieldPositions, RecipientInput, RECIPIENT_COLORS } from '@/types/envelope'

const SELF_RECIPIENT_ID = 1

function SelfSignPageInner() {
  const VerticalPDFViewer = useMemo(
    () => dynamic(() => import('@/components/envelope/VerticalPDFViewer').then((m) => m.VerticalPDFViewer), { ssr: false }),
    []
  )
  const router = useRouter()
  const searchParams = useSearchParams()
  const step = searchParams?.get('step')
  const documentIdParam = searchParams?.get('documentId')
  const { data: session } = useSession()
  const { data: profile } = useProfile()
  const { mutateAsync: selfSignAsync, isPending: signing } = useSelfSignEnvelope()

  const isSigningInFlight = signing

  const selfRecipient: RecipientInput = useMemo(
    () => ({
      id: SELF_RECIPIENT_ID,
      name: session?.user?.full_name || 'You',
      email: session?.user?.email || '',
      order: 1,
      color: RECIPIENT_COLORS[0],
    }),
    [session?.user?.email, session?.user?.full_name]
  )
  const recipients = useMemo(() => [selfRecipient], [selfRecipient])

  const [uploadedDocuments, setUploadedDocuments] = useState<Document[]>([])
  const [fieldPositions, setFieldPositions] = useState<FieldPositions>({})
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null)
  const [nextFieldId, setNextFieldId] = useState(1)
  const [envelopeName, setEnvelopeName] = useState('')
  const [description, setDescription] = useState('')
  const [pdfPasswordProtectionEnabled, setPdfPasswordProtectionEnabled] = useState(false)
  const [selectedSignatureId, setSelectedSignatureId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [frozenEnvelopeMessage, setFrozenEnvelopeMessage] = useState<string | null>(null)
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  const [activeDragFieldType, setActiveDragFieldType] = useState<string | null>(null)
  const [pageMetrics, setPageMetrics] = useState<
    Record<string, { baseWidthPxAtScale1: number; baseHeightPxAtScale1: number; scale: number }>
  >({})
  const [isMerging, setIsMerging] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [zoom, setZoom] = useState(SIGNING_ZOOM_DEFAULT)
  const [documentPages, setDocumentPages] = useState<DocumentPageInfo[]>([])
  const [activePageKey, setActivePageKey] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!documentIdParam || uploadedDocuments.some((d) => d.id === documentIdParam)) return
    getDocument(documentIdParam)
      .then((doc) => {
        setUploadedDocuments([doc])
        router.replace('/dashboard/envelopes/self-sign?step=editor')
      })
      .catch(() => toast.error('Failed to load document'))
  }, [documentIdParam, router, uploadedDocuments])

  const showEditor = step === 'editor' || uploadedDocuments.length > 0

  const shellUser = session?.user
    ? {
        id: session.user.id,
        name: session.user.full_name || 'User',
        email: session.user.email || '',
        profilePhotoUrl: profile?.profile_photo_url,
        initials: (session.user.full_name || 'U')
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase(),
      }
    : undefined

  const { data: signatures = [], isLoading: loadingSignatures } = useQuery({
    queryKey: ['signatures', 'user'],
    queryFn: listUserSignatures,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (selectedSignatureId || signatures.length === 0) return
    const defaultSig = signatures.find((s) => s.is_default) ?? signatures[0]
    if (defaultSig) setSelectedSignatureId(defaultSig.id)
  }, [signatures, selectedSignatureId])

  const addDocument = useCallback((document: Document) => {
    const normalized = normalizeDocument(document)
    if (!normalized.id) {
      toast.error('Could not load document: missing document ID')
      return
    }
    setUploadedDocuments((prev) => {
      if (prev.some((d) => d.id === normalized.id)) return prev
      return [...prev, normalized]
    })
  }, [])

  const removeDocument = useCallback((documentId: string) => {
    setUploadedDocuments((prev) => prev.filter((d) => d.id !== documentId))
    setFieldPositions((prev) => {
      const next = { ...prev }
      delete next[documentId]
      return next
    })
    toast.success('Document removed')
  }, [])

  const handleFieldDrop = useCallback((fieldType: string, documentId: string, page: number, x: number, y: number) => {
    const fieldId = `field-${nextFieldId}`
    const newField: FieldPosition = {
      id: fieldId,
      type: fieldType as FieldPosition['type'],
      page,
      x,
      y,
      width: fieldType === 'signature' ? WIZARD_SIGNATURE_WIDTH : 160,
      height: fieldType === 'signature' ? WIZARD_SIGNATURE_HEIGHT : 36,
      assignedTo: String(SELF_RECIPIENT_ID),
      documentId,
      ...(fieldType !== 'signature'
        ? {
            required: false,
            font_family: 'Helvetica',
            font_size: 12,
            prefill_value: '',
            ...(fieldType === 'date' ? { date_format: 'YYYY-MM-DD' } : {}),
            ...(fieldType === 'text' ? { placeholder: '', max_length: 100 } : {}),
            ...(fieldType === 'designation' ? { max_length: 100 } : {}),
          }
        : {}),
    }

    setFieldPositions((prev) => ({
      ...prev,
      [documentId]: {
        ...(prev[documentId] || {}),
        [fieldId]: newField,
      },
    }))
    setNextFieldId((id) => id + 1)
    setActiveFieldId(fieldId)
    toast.success(`${fieldType} field added`)
  }, [nextFieldId])

  const handleAddFieldClick = useCallback(
    (fieldType: string) => {
      if (uploadedDocuments.length === 0) {
        toast.error('Upload a document first')
        return
      }
      const doc = uploadedDocuments[0]
      const pageKey = `${doc.id}-1`
      const metrics = pageMetrics[pageKey]
      const fieldWidth = fieldType === 'signature' ? WIZARD_SIGNATURE_WIDTH : 160
      const fieldHeight = fieldType === 'signature' ? WIZARD_SIGNATURE_HEIGHT : 36
      let x = 120
      let y = 320
      if (metrics) {
        const pageWidth = metrics.baseWidthPxAtScale1 * metrics.scale
        const pageHeight = metrics.baseHeightPxAtScale1 * metrics.scale
        x = Math.max(0, pageWidth / 2 - fieldWidth / 2)
        y = Math.max(0, pageHeight * 0.65 - fieldHeight / 2)
      }
      handleFieldDrop(fieldType, doc.id, 1, x, y)
    },
    [uploadedDocuments, pageMetrics, handleFieldDrop],
  )

  const pageIndicator = useMemo(() => {
    if (documentPages.length === 0) return 'Page 1 of 1'
    const active = activePageKey
      ? documentPages.find((p) => `${p.documentId}-${p.pageNumber}` === activePageKey)
      : documentPages[0]
    if (!active) return 'Page 1 of 1'
    return `Page ${active.pageNumber} of ${active.totalPages}`
  }, [documentPages, activePageKey])

  const documentDisplayTitle = useMemo(() => {
    if (uploadedDocuments.length === 0) return 'No document loaded'
    return uploadedDocuments[0].file_name || 'Document'
  }, [uploadedDocuments])

  const selfSignActiveStep = useMemo(() => {
    if (success) return 'complete' as const
    const hasSignature = Object.values(fieldPositions).some((docFields) =>
      Object.values(docFields).some((f) => f.type === 'signature'),
    )
    if (hasSignature) return 'sign' as const
    return 'upload' as const
  }, [success, fieldPositions])

  const handleDragStart = useCallback((event: any) => {
    const data = event.active?.data?.current
    if (data?.type === 'field-palette-item') {
      setActiveDragFieldType(data.fieldType as string)
    }
  }, [])

  const handleDragCancel = useCallback(() => {
    setActiveDragFieldType(null)
  }, [])

  const handleDragEnd = useCallback(
    (event: any) => {
      const activeData = event.active?.data?.current
      const over = event.over
      const overData = over?.data?.current
      setActiveDragFieldType(null)

      if (activeData?.type === 'field-palette-item' && overData?.type === 'page') {
        const fieldType = activeData.fieldType as string
        const { documentId, pageNumber } = overData
        const overRect = over.rect
        const activeRect = event.active?.rect?.current
        const translated = activeRect?.translated || activeRect?.initial
        const pointerX = translated ? translated.left + (translated.width || 0) / 2 : overRect.left + overRect.width / 2
        const pointerY = translated ? translated.top + (translated.height || 0) / 2 : overRect.top + overRect.height / 2
        const fieldWidth = 200
        const fieldHeight = 50
        let x = pointerX - overRect.left - fieldWidth / 2
        let y = pointerY - overRect.top - fieldHeight / 2
        x = Math.max(0, Math.min(x, overRect.width - fieldWidth))
        y = Math.max(0, Math.min(y, overRect.height - fieldHeight))
        handleFieldDrop(fieldType, documentId, pageNumber, x, y)
      }
    },
    [handleFieldDrop]
  )

  const handleFieldPositionChange = useCallback((fieldId: string, position: Partial<FieldPosition>) => {
    setFieldPositions((prev) => {
      const next = { ...prev }
      Object.keys(next).forEach((docId) => {
        if (next[docId][fieldId]) {
          const current = next[docId][fieldId]
          next[docId][fieldId] = {
            ...current,
            ...position,
            x: position.x !== undefined ? position.x : current.x,
            y: position.y !== undefined ? position.y : current.y,
            page: position.page !== undefined ? position.page : current.page,
          }
        }
      })
      return next
    })
  }, [])

  const handleFieldDelete = useCallback(
    (fieldId: string) => {
      setFieldPositions((prev) => {
        const next = { ...prev }
        Object.keys(next).forEach((docId) => {
          if (next[docId][fieldId]) delete next[docId][fieldId]
        })
        return next
      })
      if (activeFieldId === fieldId) setActiveFieldId(null)
      toast.success('Field removed')
    },
    [activeFieldId]
  )

  const handleMergeDocuments = useCallback(async () => {
    if (uploadedDocuments.length < 2) {
      toast.error('Select at least two documents to merge')
      return
    }
    try {
      setIsMerging(true)
      const merged = await mergeDocuments(uploadedDocuments.map((d) => d.id), 'merged.pdf')
      setUploadedDocuments([merged])
      setFieldPositions({})
      toast.success('Documents merged successfully')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || 'Failed to merge documents')
    } finally {
      setIsMerging(false)
    }
  }, [uploadedDocuments])

  const activeField: FieldPosition | null = useMemo(() => {
    if (!activeFieldId) return null
    for (const docFields of Object.values(fieldPositions)) {
      if (docFields[activeFieldId]) return docFields[activeFieldId]
    }
    return null
  }, [activeFieldId, fieldPositions])

  const validationErrors = useMemo(() => {
    const errors: string[] = []
    if (uploadedDocuments.length === 0) {
      errors.push('At least one document is required')
    }

    const signatureFields = Object.values(fieldPositions).flatMap((docFields) =>
      Object.values(docFields).filter((field) => field.type === 'signature')
    )
    if (signatureFields.length === 0) {
      errors.push('At least one signature field is required')
    }

    const incomplete: string[] = []
    Object.values(fieldPositions).forEach((docFields) => {
      Object.values(docFields).forEach((field) => {
        if (field.type === 'signature') return
        const hasRequired = typeof field.required === 'boolean'
        const hasFont = !!field.font_family && typeof field.font_size === 'number'
        if (!hasRequired || !hasFont) {
          incomplete.push(field.id)
          return
        }
        if (field.required && !(field.prefill_value ?? '').trim()) {
          incomplete.push(field.id)
          return
        }
        if (field.type === 'date' && !field.date_format) incomplete.push(field.id)
        if (field.type === 'text' && (field.placeholder === undefined || field.max_length === undefined)) {
          incomplete.push(field.id)
        }
        if (field.type === 'designation' && field.max_length === undefined) incomplete.push(field.id)
      })
    })
    if (incomplete.length > 0) {
      errors.push('Required fields must have values and complete settings')
    }

    return errors
  }, [uploadedDocuments, fieldPositions])

  const validationSummary =
    validationErrors.length > 0 ? validationErrors.join(' · ') : null

  const buildPayload = useCallback((): SelfSignRequest | null => {
    setError(null)
    const convertFieldGeometry = (docId: string, field: FieldPosition) => {
      const pageKey = `${docId}-${field.page}`
      const metrics = pageMetrics[pageKey]
      const renderScale = metrics?.scale ?? CREATE_EDITOR_VIEWPORT_SCALE
      return fieldPositionToBackendPdfPoints(field, renderScale)
    }

    const documents_with_positions = Object.entries(fieldPositions)
      .map(([docId, docFields]) => {
        const signer_document_positions = Object.values(docFields)
          .filter((field) => field.type === 'signature')
          .map((field) => {
            const geom = convertFieldGeometry(docId, field)
            return {
              position: {
                page: field.page,
                x: geom.x,
                y: geom.y,
                width: geom.width,
                height: geom.height,
              },
            }
          })
        return { document_id: docId, signer_document_positions }
      })
      .filter((entry) => entry.signer_document_positions.length > 0)

    const fields: Array<Record<string, unknown>> = []
    Object.entries(fieldPositions).forEach(([docId, docFields]) => {
      Object.values(docFields).forEach((field) => {
        if (field.type === 'signature') return
        const geom = convertFieldGeometry(docId, field)
        const value = field.prefill_value ?? null
        const base = {
          document_id: docId,
          page: Math.max(1, field.page),
          x: Math.max(0, geom.x),
          y: Math.max(0, geom.y),
          width: Math.max(20, geom.width),
          height: Math.max(20, geom.height),
          required: !!field.required,
          font_family: field.font_family,
          font_size: field.font_size,
          value,
          prefill_value: value,
        }
        if (field.type === 'initials') {
          fields.push({ ...base, type: 'initials' })
        } else if (field.type === 'date') {
          fields.push({ ...base, type: 'date', date_format: field.date_format })
        } else if (field.type === 'text') {
          fields.push({ ...base, type: 'text', placeholder: field.placeholder, max_length: field.max_length })
        } else if (field.type === 'designation') {
          fields.push({ ...base, type: 'designation', max_length: field.max_length })
        }
      })
    })

    const trimmedDescription = description.trim()
    const payload: SelfSignRequest = {
      document_ids: uploadedDocuments.map((d) => d.id),
      documents_with_positions,
      pdf_password_protection_enabled: pdfPasswordProtectionEnabled,
      ...(envelopeName ? { name: envelopeName } : {}),
      ...(trimmedDescription ? { description: trimmedDescription } : {}),
      ...(fields.length > 0 ? { fields } : {}),
      ...(selectedSignatureId ? { signature_id: selectedSignatureId } : {}),
    }
    return payload
  }, [
    uploadedDocuments,
    fieldPositions,
    envelopeName,
    description,
    pdfPasswordProtectionEnabled,
    pageMetrics,
    selectedSignatureId,
  ])

  const handleSignComplete = useCallback(async () => {
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '))
      return
    }
    try {
      setError(null)
      setFrozenEnvelopeMessage(null)
      const payload = buildPayload()
      if (!payload) return
      const result = await selfSignAsync(payload)
      if (result.kind === 'queued') {
        saveSigningJob(result.data.envelope_id, result.data.job_id)
        router.push(`/dashboard/envelopes/${result.data.envelope_id}`)
      }
    } catch (err: unknown) {
      if (err instanceof FrozenEnvelopeError) {
        setFrozenEnvelopeMessage(err.message)
        return
      }
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        'Failed to self-sign document. Please check console for details.'
      setError(msg)
    }
  }, [validationErrors, buildPayload, selfSignAsync, router])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' && activeFieldId) {
        handleFieldDelete(activeFieldId)
        return
      }
      if (event.key === 'Escape') {
        setActiveFieldId(null)
        return
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault()
        handleSignComplete()
        return
      }
      if (event.key === '?' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault()
        setShowKeyboardShortcuts(true)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [activeFieldId, handleFieldDelete, handleSignComplete])

  if (!showEditor) {
    return (
      <SigningShell
        documentTitle="Self-sign"
        user={shellUser}
        onClose={() => router.push('/dashboard/envelopes')}
        closeLabel="Exit"
      >
        <SelfSignStart
          hasDocuments={uploadedDocuments.length > 0}
          onDocumentSelected={addDocument}
          onContinue={() => router.push('/dashboard/envelopes/self-sign?step=editor')}
        />
      </SigningShell>
    )
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-surface text-on-surface">
      <SelfSignEditorHeader
        documentTitle={documentDisplayTitle}
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(SIGNING_ZOOM_MAX, z + SIGNING_ZOOM_STEP))}
        onZoomOut={() => setZoom((z) => Math.max(SIGNING_ZOOM_MIN, z - SIGNING_ZOOM_STEP))}
        pageIndicator={pageIndicator}
        onExit={() => router.push('/dashboard/envelopes')}
      />

      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="hidden md:flex">
            <SelfSignNavSidebar
              activeStep={selfSignActiveStep}
              onUploadClick={() => router.push('/dashboard/envelopes/self-sign')}
            />
          </div>

          <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-surface-container-low">
            {error ? (
              <Alert variant="destructive" className="absolute left-4 right-4 top-4 z-10 md:left-8 md:right-8">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            {mounted ? (
              <VerticalPDFViewer
                documents={uploadedDocuments}
                fieldPositions={fieldPositions}
                recipients={recipients}
                activeFieldId={activeFieldId}
                onFieldSelect={setActiveFieldId}
                onFieldPositionChange={handleFieldPositionChange}
                onFieldDelete={handleFieldDelete}
                onFieldDrop={handleFieldDrop}
                onPageMetricsChange={(pageKey, metrics) =>
                  setPageMetrics((prev) => ({ ...prev, [pageKey]: metrics }))
                }
                editorLayout
                viewerScale={zoom / 100}
                onPagesChange={setDocumentPages}
                activePageKey={activePageKey}
                onActivePageKeyChange={setActivePageKey}
              />
            ) : null}
          </main>

          <div className="hidden md:flex">
            <SelfSignToolsSidebar
              hasDocuments={uploadedDocuments.length > 0}
              signing={isSigningInFlight}
              hasValidationErrors={validationErrors.length > 0}
              validationMessage={validationSummary}
              onSignComplete={handleSignComplete}
              onAddField={handleAddFieldClick}
              activeField={activeField}
              onFieldSettingsChange={handleFieldPositionChange}
              onClearActiveField={() => setActiveFieldId(null)}
            />
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeDragFieldType ? (
            <div className="pointer-events-none z-[9999] rounded-md border bg-white px-3 py-2 text-xs shadow-lg">
              {activeDragFieldType}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {showKeyboardShortcuts ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-on-surface">Keyboard shortcuts</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowKeyboardShortcuts(false)}>
                ✕
              </Button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-body">Delete selected field</span>
                <kbd className="rounded bg-surface-container-low px-2 py-1 text-xs">Delete</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-body">Sign and complete</span>
                <kbd className="rounded bg-surface-container-low px-2 py-1 text-xs">Ctrl+Enter</kbd>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {frozenEnvelopeMessage ? (
        <SigningFrozenEnvelopeAlert
          message={frozenEnvelopeMessage}
          onDismiss={() => setFrozenEnvelopeMessage(null)}
        />
      ) : null}
    </div>
  )
}

export default function SelfSignPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted">Loading…</div>}>
      <SelfSignPageInner />
    </Suspense>
  )
}
