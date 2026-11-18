'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { MaterialIcon } from '@/components/ui/material-icon'
import { AsyncStatePanel } from '@/components/library'
import { SelfSignEditorHeader } from '@/components/signing/self-sign-editor-header'
import { SigningFrozenEnvelopeAlert } from '@/components/signing/signing-frozen-envelope-alert'
import { SigningPageTextLayer } from '@/components/signing/signing-page-text-layer'
import {
  SIGNING_ZOOM_DEFAULT,
  SIGNING_ZOOM_MAX,
  SIGNING_ZOOM_MIN,
  SIGNING_ZOOM_STEP,
} from '@/components/signing/signing-toolbar'
import {
  EditorToolsSidebar,
  primaryActionClass,
  type EditorToolsSidebarProps,
} from '@/components/document-editor/editor-tools-sidebar'
import { FIELD_TYPE_LABELS } from '@/components/envelope/field-editor-themes'
import type { DocumentPageInfo, PageOverlayInfo } from '@/components/envelope/VerticalPDFViewer'
import { useTextEditSession } from '@/components/pdf-edit/use-text-edit-session'
import { useAuthReady } from '@/hooks/useAuthReady'
import { useSelfSignEnvelope } from '@/hooks/useEnvelopes'
import { useInitialsChoice } from '@/hooks/signing/useInitialsChoice'
import {
  SELF_RECIPIENT_ID,
  buildSelfSignPayload,
  useSelfSignFields,
  type FieldMap,
} from '@/hooks/useSelfSignFields'
import { getDocument, type AddTextOp } from '@/lib/api/documents'
import { listUserSignatures } from '@/lib/api/signatures'
import { FrozenEnvelopeError } from '@/lib/api/signing-errors'
import { classifyError } from '@/lib/errors'
import { isSavedText, textIsDrawable } from '@/lib/pdf-edit/fonts'
import { patchWizardResumeDocument, readWizardTextEditResume } from '@/lib/pdf-edit/wizard-resume'
import { saveSigningJob } from '@/lib/signing/signing-job-storage'
import { RECIPIENT_COLORS, type CreatableFieldType, type RecipientInput } from '@/types/envelope'

const VerticalPDFViewer = dynamic(
  () => import('@/components/envelope/VerticalPDFViewer').then((mod) => mod.VerticalPDFViewer),
  { ssr: false },
)

const HISTORY_LIMIT = 50
/** Keystrokes in the same box (or setting) within this window undo as one step. */
const COALESCE_MS = 800

type Snapshot = { ops: AddTextOp[]; fields: FieldMap }
type Phase = 'saving-text' | 'signing' | null

function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)
  )
}

function DocumentEditor() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const documentId = params?.id as string
  const fromWizard = searchParams?.get('from') === 'wizard'
  const { status: authStatus } = useAuthReady()
  const { data: session } = useSession()

  const { data: documentData, isLoading, error, refetch } = useQuery({
    queryKey: ['document', documentId],
    queryFn: () => getDocument(documentId),
    enabled: !!documentId && authStatus !== 'loading',
  })

  const text = useTextEditSession(documentId)
  const fieldState = useSelfSignFields(documentId)
  const [initialsChoice, setInitialsChoice] = useInitialsChoice()
  const { mutateAsync: selfSignAsync } = useSelfSignEnvelope()
  const { data: signatures = [] } = useQuery({
    queryKey: ['signatures', 'user'],
    queryFn: listUserSignatures,
    staleTime: 30_000,
    enabled: !fromWizard && authStatus !== 'loading',
  })
  const signatureId = (signatures.find((s) => s.is_default) ?? signatures[0])?.id ?? null

  const [zoom, setZoom] = useState(SIGNING_ZOOM_DEFAULT)
  /** Page sizes in PDF points (the viewer reports px at scale 1, which is points). */
  const [pageMetrics, setPageMetrics] = useState<Record<string, { baseWidthPxAtScale1: number; baseHeightPxAtScale1: number }>>({})
  /** Rendered CSS px per PDF point; the page fills the canvas width, then zoom applies. */
  const [renderScale, setRenderScale] = useState(1.2)
  const [documentPages, setDocumentPages] = useState<DocumentPageInfo[]>([])
  const [activePageKey, setActivePageKey] = useState<string | null>(null)
  const [placingText, setPlacingText] = useState(false)
  const [phase, setPhase] = useState<Phase>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [frozenMessage, setFrozenMessage] = useState<string | null>(null)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [draggingType, setDraggingType] = useState<string | null>(null)
  // A drag starts after 6px of movement, so a plain click on a tool still adds it.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  )

  const { ops, setOps, selectedId: selectedTextId, setSelectedId: setSelectedTextId } = text
  const { fields, setFields, setActiveFieldId } = fieldState
  const editAvailable = !!text.session
  const showSignTools = !fromWizard

  // --- One undo history for text and fields --------------------------------------
  const past = useRef<Snapshot[]>([])
  const future = useRef<Snapshot[]>([])
  const lastChange = useRef<{ key: string; at: number } | null>(null)
  const current = useRef<Snapshot>({ ops, fields })
  current.current = { ops, fields }

  const record = useCallback((coalesceKey?: string) => {
    const now = Date.now()
    const last = lastChange.current
    lastChange.current = coalesceKey ? { key: coalesceKey, at: now } : null
    if (coalesceKey && last && last.key === coalesceKey && now - last.at < COALESCE_MS) return
    past.current = [...past.current, current.current].slice(-HISTORY_LIMIT)
    future.current = []
  }, [])

  const restore = useCallback(
    (snapshot: Snapshot) => {
      setOps(snapshot.ops, false)
      setFields(snapshot.fields)
      lastChange.current = null
    },
    [setOps, setFields],
  )

  const undo = useCallback(() => {
    const previous = past.current.pop()
    if (!previous) return
    future.current.push(current.current)
    restore(previous)
  }, [restore])

  const redo = useCallback(() => {
    const next = future.current.pop()
    if (!next) return
    past.current.push(current.current)
    restore(next)
  }, [restore])

  // --- Text ------------------------------------------------------------------------
  const createText = useCallback(
    (op: AddTextOp) => {
      record()
      setOps((list) => [...list, op], false)
      setSelectedTextId(op.opId)
      setActiveFieldId(null)
      setPlacingText(false)
    },
    [record, setOps, setSelectedTextId, setActiveFieldId],
  )

  const changeText = useCallback(
    (opId: string, patch: Partial<AddTextOp>) => {
      record(`text:${opId}`)
      setOps((list) => list.map((op) => (op.opId === opId ? { ...op, ...patch } : op)), false)
    },
    [record, setOps],
  )

  const deleteText = useCallback(
    (opId: string) => {
      record()
      setOps((list) => list.filter((op) => op.opId !== opId), false)
      setSelectedTextId(null)
    },
    [record, setOps, setSelectedTextId],
  )

  // --- Fields ----------------------------------------------------------------------
  const pageSizePt = useCallback(
    (page: number) => {
      const metrics = pageMetrics[`${documentId}-${page}`]
      return metrics
        ? { width: metrics.baseWidthPxAtScale1, height: metrics.baseHeightPxAtScale1 }
        : { width: 595, height: 842 }
    },
    [pageMetrics, documentId],
  )

  const currentPage = useMemo(() => {
    const active = activePageKey ? documentPages.find((p) => `${p.documentId}-${p.pageNumber}` === activePageKey) : null
    return active?.pageNumber ?? 1
  }, [activePageKey, documentPages])

  /** Add a field centred on a point given in PDF points. */
  const addFieldAtPt = useCallback(
    (type: CreatableFieldType, page: number, centerX: number, centerY: number) => {
      const size = pageSizePt(page)
      record()
      fieldState.addField(type, page, centerX, centerY, size.width, size.height)
      setSelectedTextId(null)
      setPlacingText(false)
    },
    [fieldState, pageSizePt, record, setSelectedTextId],
  )

  /**
   * Click a tool: add it to the page being viewed, a little below the middle,
   * stepping down for each field already there so they don't stack.
   */
  const addFieldToCurrentPage = useCallback(
    (type: CreatableFieldType) => {
      const size = pageSizePt(currentPage)
      const onPage = Object.values(fields).filter((f) => f.page === currentPage).length
      const centerY = size.height * 0.55 + (onPage % 8) * 46
      addFieldAtPt(type, currentPage, size.width / 2, Math.min(centerY, size.height - 34))
      toast.success(`${FIELD_TYPE_LABELS[type]} added to page ${currentPage}`)
    },
    [addFieldAtPt, currentPage, pageSizePt, fields],
  )

  /** The viewer reports geometry in screen px; fields are stored in points. */
  const changeField = useCallback(
    (fieldId: string, patchPx: Record<string, unknown>) => {
      const existing = fields[fieldId] as unknown as Record<string, unknown> | undefined
      if (!existing) return
      const patch: Record<string, unknown> = { ...patchPx }
      for (const key of ['x', 'y', 'width', 'height']) {
        if (typeof patch[key] === 'number') patch[key] = (patch[key] as number) / renderScale
      }
      // Selecting a field reports a "move" to where it already is; that isn't an edit.
      const unchanged = Object.entries(patch).every(([key, value]) =>
        typeof value === 'number' && typeof existing[key] === 'number'
          ? Math.abs((existing[key] as number) - value) < 0.01
          : existing[key] === value,
      )
      if (unchanged) return
      record(`field:${fieldId}:${Object.keys(patch).sort().join(',')}`)
      fieldState.updateField(fieldId, patch)
    },
    [fieldState, record, fields, renderScale],
  )

  const deleteField = useCallback(
    (fieldId: string) => {
      record()
      fieldState.deleteField(fieldId)
    },
    [fieldState, record],
  )

  const selectField = useCallback(
    (fieldId: string) => {
      setActiveFieldId(fieldId)
      setSelectedTextId(null)
    },
    [setActiveFieldId, setSelectedTextId],
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current
    if (data?.type === 'field-palette-item') setDraggingType(String(data.fieldType))
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setDraggingType(null)
      const activeData = event.active.data.current
      const overData = event.over?.data.current
      if (activeData?.type !== 'field-palette-item' || overData?.type !== 'page' || !event.over) return
      const overRect = event.over.rect
      const dragged = event.active.rect.current.translated ?? event.active.rect.current.initial
      const centerX = dragged ? dragged.left + dragged.width / 2 - overRect.left : overRect.width / 2
      const centerY = dragged ? dragged.top + dragged.height / 2 - overRect.top : overRect.height / 2
      addFieldAtPt(
        activeData.fieldType as CreatableFieldType,
        Number(overData.pageNumber),
        centerX / renderScale,
        centerY / renderScale,
      )
    },
    [addFieldAtPt, renderScale],
  )

  // --- Saving and signing ----------------------------------------------------------
  // Text autosaves as a server draft but is only in the PDF once committed (which clears ops).
  const hasUnsavedText = ops.some((op) => isSavedText(op.text))

  /** Writes the added text into the PDF. Returns false (after telling the user) on failure. */
  const saveText = useCallback(async (): Promise<boolean> => {
    const invalid = ops.find((op) => op.text.trim() && !textIsDrawable(op.text))
    if (invalid) {
      setSelectedTextId(invalid.opId)
      toast.error('This font can’t draw one of the characters in a text box.')
      return false
    }
    try {
      const result = await text.commit()
      past.current = []
      future.current = []
      if (fromWizard) {
        patchWizardResumeDocument(documentId, {
          file_url: result.file_url,
          file_size: result.file_size,
          updated_at: new Date().toISOString(),
        })
      }
      await queryClient.invalidateQueries({ queryKey: ['document', documentId] })
      await refetch()
      return true
    } catch (err) {
      const copy = classifyError(err, 'Couldn’t save your text')
      toast.error(copy.message)
      return false
    }
  }, [ops, text, fromWizard, documentId, queryClient, refetch, setSelectedTextId])

  const handleSaveText = useCallback(async () => {
    setPhase('saving-text')
    const ok = await saveText()
    setPhase(null)
    if (ok) toast.success('Text saved to the document')
  }, [saveText])

  const handleDiscardText = useCallback(async () => {
    if (!window.confirm('Discard the text you haven’t saved?')) return
    record()
    try {
      await text.discard()
      setSelectedTextId(null)
    } catch {
      toast.error('Couldn’t discard the draft. Try again.')
    }
  }, [record, text, setSelectedTextId])

  const leave = useCallback(() => {
    const resume = readWizardTextEditResume()
    if (fromWizard && resume) {
      router.push(`${resume.returnPath}?resume=1`)
      return
    }
    router.push(`/dashboard/documents/${documentId}`)
  }, [documentId, fromWizard, router])

  const handleSignComplete = useCallback(async () => {
    if (phase) return
    if (fieldState.validationErrors.length > 0) {
      setMessage(fieldState.validationErrors.join(' · '))
      return
    }
    setMessage(null)
    setFrozenMessage(null)

    // The signature has to cover the final content, so added text goes into the PDF first.
    let textWasSaved = false
    if (hasUnsavedText) {
      setPhase('saving-text')
      if (!(await saveText())) {
        setPhase(null)
        return
      }
      textWasSaved = true
    }

    setPhase('signing')
    try {
      const result = await selfSignAsync(
        buildSelfSignPayload(fields, { documentId, signatureId, initialsChoice }),
      )
      fieldState.clearFields()
      if (result.kind === 'queued') {
        saveSigningJob(result.data.envelope_id, result.data.job_id, {
          envelopeName: documentData?.file_name || 'Self-signed document',
        })
        router.push(`/dashboard/envelopes/${result.data.envelope_id}`)
        return
      }
      router.push('/dashboard/envelopes')
    } catch (err) {
      if (err instanceof FrozenEnvelopeError) setFrozenMessage(err.message)
      // useSelfSignEnvelope already showed the reason.
      if (textWasSaved) toast('Your text was saved to the document. Signing didn’t finish, so try again.')
      setPhase(null)
    }
  }, [
    phase,
    fieldState,
    hasUnsavedText,
    saveText,
    selfSignAsync,
    fields,
    documentId,
    signatureId,
    initialsChoice,
    documentData?.file_name,
    router,
  ])

  const hasUnsavedWork = hasUnsavedText || fieldState.hasFields

  const handleExit = useCallback(() => {
    if (hasUnsavedWork && !window.confirm('Leave this document? Placed fields will be lost. Text you haven’t saved stays as a draft for next time.')) return
    fieldState.clearFields()
    leave()
  }, [hasUnsavedWork, fieldState, leave])

  const handleWizardDone = useCallback(async () => {
    if (hasUnsavedText) {
      setPhase('saving-text')
      const ok = await saveText()
      setPhase(null)
      if (!ok) return
    }
    leave()
  }, [hasUnsavedText, saveText, leave])

  // Placed fields aren't saved anywhere but this tab; warn before closing it.
  useEffect(() => {
    if (!fieldState.hasFields) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [fieldState.hasFields])

  // --- Keyboard ----------------------------------------------------------------------
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showShortcuts) setShowShortcuts(false)
        else if (placingText) setPlacingText(false)
        else {
          setActiveFieldId(null)
          setSelectedTextId(null)
        }
        return
      }
      // Inside a text box or input, undo/delete belong to the text being typed.
      if (isTypingTarget(event.target)) return
      const mod = event.metaKey || event.ctrlKey
      if (mod && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
        return
      }
      if (mod && event.key.toLowerCase() === 'y') {
        event.preventDefault()
        redo()
        return
      }
      if ((event.key === 'Delete' || event.key === 'Backspace') && fieldState.activeFieldId) {
        event.preventDefault()
        deleteField(fieldState.activeFieldId)
        return
      }
      if (event.key === '?') setShowShortcuts(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo, deleteField, fieldState.activeFieldId, placingText, showShortcuts, setActiveFieldId, setSelectedTextId])

  // --- Viewer wiring -----------------------------------------------------------------
  const selfRecipient: RecipientInput = useMemo(
    () => ({
      id: SELF_RECIPIENT_ID,
      name: session?.user?.full_name || 'You',
      email: session?.user?.email || '',
      order: 1,
      color: RECIPIENT_COLORS[0],
    }),
    [session?.user?.full_name, session?.user?.email],
  )
  const recipients = useMemo(() => [selfRecipient], [selfRecipient])
  const viewerFields = useMemo(
    () => ({
      [documentId]: Object.fromEntries(
        Object.entries(fields).map(([id, f]) => [
          id,
          { ...f, x: f.x * renderScale, y: f.y * renderScale, width: f.width * renderScale, height: f.height * renderScale },
        ]),
      ),
    }),
    [documentId, fields, renderScale],
  )
  const viewerDocuments = useMemo(() => (documentData ? [documentData] : []), [documentData])

  const renderTextLayer = useCallback(
    (page: PageOverlayInfo) => (
      <SigningPageTextLayer
        pageNo={page.pageNumber}
        ops={ops.filter((op) => op.page === page.pageNumber)}
        dims={{ widthPt: page.widthPt, heightPt: page.heightPt, widthPx: page.widthPx, heightPx: page.heightPx }}
        selectedId={selectedTextId}
        placing={placingText && editAvailable}
        pointerScale={1}
        onSelect={(opId) => {
          setSelectedTextId(opId)
          if (opId) setActiveFieldId(null)
        }}
        onCreate={createText}
        onChange={changeText}
        onDelete={deleteText}
      />
    ),
    [ops, selectedTextId, placingText, editAvailable, setSelectedTextId, setActiveFieldId, createText, changeText, deleteText],
  )

  const pageIndicator = useMemo(() => {
    const total = documentPages[0]?.totalPages
    return total ? `Page ${currentPage} of ${total}` : undefined
  }, [documentPages, currentPage])

  const zoomIn = () => setZoom((z) => Math.min(SIGNING_ZOOM_MAX, z + SIGNING_ZOOM_STEP))
  const zoomOut = () => setZoom((z) => Math.max(SIGNING_ZOOM_MIN, z - SIGNING_ZOOM_STEP))

  // --- States --------------------------------------------------------------------
  if (isLoading || authStatus === 'loading' || text.loading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-bg">
        <AsyncStatePanel variant="loading" title="Opening document" />
      </div>
    )
  }

  const loadError = error ? classifyError(error, 'Failed to load document') : null
  if (loadError || !documentData) {
    return (
      <div className="flex h-dvh items-center justify-center bg-bg px-4">
        <AsyncStatePanel
          variant="error"
          title="Unable to open this document"
          description={loadError?.message || 'The document is unavailable.'}
          secondaryAction={
            <Button asChild variant="outline">
              <Link href="/dashboard/documents">Back to Documents</Link>
            </Button>
          }
        />
      </div>
    )
  }

  // Preparing for the wizard needs editing; on its own there's nothing else to do.
  if (fromWizard && !editAvailable) {
    return (
      <div className="flex h-dvh items-center justify-center bg-bg px-4">
        <AsyncStatePanel
          variant="error"
          title="Add text isn’t available"
          description={text.error?.message || 'This document can’t be edited.'}
          secondaryAction={
            <Button type="button" variant="outline" onClick={leave}>
              Back
            </Button>
          }
        />
      </div>
    )
  }

  const busyLabel = phase === 'saving-text' ? 'Saving your text…' : phase === 'signing' ? 'Signing…' : null
  const sidebarProps: EditorToolsSidebarProps = {
    edit: {
      placing: placingText,
      onTogglePlacing: () => {
        setPlacingText((v) => !v)
        setActiveFieldId(null)
      },
      unavailableReason: editAvailable ? null : text.error?.message || 'This document can’t be edited.',
    },
    sign: showSignTools
      ? {
          onAddField: (type) => {
            addFieldToCurrentPage(type)
            setToolsOpen(false)
          },
          activeField: fieldState.activeField,
          onFieldChange: changeField,
          onClearActiveField: () => setActiveFieldId(null),
          initials: fieldState.hasInitialsFields
            ? { fullName: session?.user?.full_name, choice: initialsChoice, onChange: setInitialsChoice }
            : null,
        }
      : null,
    message: message ?? (text.autosaveError || null),
    saveEdits: {
      visible: editAvailable && hasUnsavedText,
      saving: phase === 'saving-text',
      onSave: () => void handleSaveText(),
      onDiscard: () => void handleDiscardText(),
    },
    signComplete: showSignTools
      ? { disabled: !!phase || fieldState.validationErrors.length > 0, busyLabel, onSign: () => void handleSignComplete() }
      : undefined,
    done: fromWizard ? { label: 'Save and return', busy: !!phase, onDone: () => void handleWizardDone() } : undefined,
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-surface text-on-surface">
      <SelfSignEditorHeader
        documentTitle={documentData.file_name || 'Document'}
        zoom={zoom}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        pageIndicator={pageIndicator}
        onExit={handleExit}
        onHelp={() => setShowShortcuts(true)}
        titleAsHeading
      />

      {text.baseChanged ? (
        <p role="alert" className="border-b border-border bg-warning-light px-4 py-2 text-body-sm text-warning-text">
          This document changed while you were editing, so your text wasn’t applied. Reload to continue.
        </p>
      ) : null}
      {text.restoreOffer ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-container-low px-4 py-2">
          <p className="text-body-sm text-on-surface">
            You have unsaved text from {new Date(text.restoreOffer.updated_at || '').toLocaleString()}.
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={text.dismissRestore}>
              Start fresh
            </Button>
            <Button type="button" size="sm" onClick={text.acceptRestore}>
              Restore it
            </Button>
          </div>
        </div>
      ) : null}

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={() => setDraggingType(null)}>
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-surface-container-low">
            <VerticalPDFViewer
              documents={viewerDocuments}
              fieldPositions={viewerFields}
              recipients={recipients}
              activeFieldId={fieldState.activeFieldId}
              onFieldSelect={selectField}
              onFieldPositionChange={changeField}
              onFieldDelete={deleteField}
              onFieldDrop={(type, _docId, page, x, y) =>
                addFieldAtPt(type as CreatableFieldType, page, x / renderScale, y / renderScale)
              }
              onPageMetricsChange={(pageKey, metrics) => setPageMetrics((prev) => ({ ...prev, [pageKey]: metrics }))}
              editorLayout
              viewerScale={zoom / 100}
              onPagesChange={setDocumentPages}
              activePageKey={activePageKey}
              onActivePageKeyChange={setActivePageKey}
              initialsChoice={initialsChoice}
              renderPageOverlay={renderTextLayer}
              fitToWidth
              onScaleChange={setRenderScale}
            />
          </main>

          <div className="hidden md:flex">
            <EditorToolsSidebar {...sidebarProps} />
          </div>
        </div>

        {toolsOpen ? (
          <div className="fixed inset-0 z-40 md:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-on-primary-fixed/50"
              aria-label="Close tools"
              onClick={() => setToolsOpen(false)}
            />
            <div className="absolute inset-y-0 right-0 z-10 flex h-full w-full max-w-[320px] shadow-raised">
              <EditorToolsSidebar {...sidebarProps} onClose={() => setToolsOpen(false)} className="w-full" />
            </div>
          </div>
        ) : null}

        <DragOverlay dropAnimation={null}>
          {draggingType ? (
            <div className="pointer-events-none rounded-xl border border-border bg-surface-container-lowest px-3 py-2 text-xs text-on-surface shadow-card">
              {FIELD_TYPE_LABELS[draggingType as CreatableFieldType] ?? draggingType}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <div className="flex shrink-0 items-center gap-2 border-t border-border bg-surface-container-lowest p-3 md:hidden">
        <button
          type="button"
          onClick={() => setToolsOpen(true)}
          className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 font-label-sm text-primary"
        >
          <MaterialIcon name="tune" size={18} />
          Tools
        </button>
        {fromWizard ? (
          <button type="button" onClick={() => void handleWizardDone()} disabled={!!phase} className={primaryActionClass}>
            {phase ? 'Saving…' : 'Save and return'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void handleSignComplete()}
            disabled={!!phase || fieldState.validationErrors.length > 0}
            className={primaryActionClass}
          >
            {busyLabel ?? 'Sign & complete'}
          </button>
        )}
      </div>

      {showShortcuts ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-on-primary-fixed/50 p-4"
          onClick={() => setShowShortcuts(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="editor-shortcuts-title"
            className="w-full max-w-md rounded-xl border border-border bg-surface-container-lowest p-6 shadow-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 id="editor-shortcuts-title" className="font-headline-lg text-headline-lg text-on-surface">
                Keyboard shortcuts
              </h2>
              <button
                type="button"
                autoFocus
                onClick={() => setShowShortcuts(false)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:bg-surface-container"
                aria-label="Close keyboard shortcuts"
              >
                <MaterialIcon name="close" size={20} />
              </button>
            </div>
            <dl className="space-y-3 text-body-sm">
              {[
                ['Undo', 'Ctrl+Z'],
                ['Redo', 'Ctrl+Shift+Z'],
                ['Delete selected field', 'Delete'],
                ['Stop adding text / deselect', 'Escape'],
              ].map(([label, keys]) => (
                <div key={label} className="flex items-center justify-between gap-4">
                  <dt className="text-on-surface">{label}</dt>
                  <dd>
                    <kbd className="rounded-lg bg-surface-container-low px-2 py-1 text-xs text-on-surface">{keys}</kbd>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      ) : null}

      {frozenMessage ? (
        <SigningFrozenEnvelopeAlert message={frozenMessage} onDismiss={() => setFrozenMessage(null)} />
      ) : null}
    </div>
  )
}

export default function DocumentEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh items-center justify-center bg-bg">
          <AsyncStatePanel variant="loading" title="Opening document" />
        </div>
      }
    >
      <DocumentEditor />
    </Suspense>
  )
}
