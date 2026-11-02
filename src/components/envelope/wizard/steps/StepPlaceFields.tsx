'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import dynamic from 'next/dynamic'
import { DndContext, DragOverlay, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { MaterialIcon } from '@/components/ui/material-icon'
import type { DocumentPageInfo } from '@/components/envelope/VerticalPDFViewer'
import { FieldPalettePanel } from '../FieldPalettePanel'
import { PlaceFieldsRightPanel } from '../PlaceFieldsRightPanel'
import { FieldPropertiesPopover } from '../FieldPropertiesPopover'
import { EnvelopeWizardStepper } from '../EnvelopeWizardStepper'
import { useEnvelopeWizard } from '../envelope-wizard-context'
import {
  countRecipientFields,
  formatFileSize,
  getDefaultEnvelopeNamePreview,
  getRecipientInitials,
} from '../wizard-utils'

interface PlaceFieldsFooterProps {
  onOpenReview: () => void
}

function PlaceFieldsFooter({ onOpenReview }: PlaceFieldsFooterProps) {
  const {
    goBack,
    handleSaveDraft,
    handleSend,
    creating,
    saving,
    sending,
    isValidating,
    sendValidationErrors,
  } = useEnvelopeWizard()
  const isBusy = creating || saving || sending || isValidating

  return (
    <footer className="z-50 flex h-16 shrink-0 items-center justify-between border-t border-border bg-white px-6 md:px-8">
      <Button
        type="button"
        variant="outline"
        onClick={goBack}
        disabled={isBusy}
        className="gap-2 rounded-full border-border px-6 text-primary"
      >
        <MaterialIcon name="arrow_back" size={18} />
        Back
      </Button>
      <div className="flex items-center gap-3 md:gap-4">
        <button
          type="button"
          onClick={() => void handleSaveDraft()}
          disabled={isBusy}
          className="text-label-sm font-medium text-primary hover:underline disabled:opacity-50"
        >
          Save and Finish Later
        </button>
        <Button
          type="button"
          variant="outline"
          onClick={onOpenReview}
          disabled={isBusy}
          className="gap-2 rounded-full border-border px-5 text-primary"
        >
          <MaterialIcon name="fact_check" size={18} />
          Review Summary
        </Button>
        <Button
          type="button"
          onClick={() => void handleSend()}
          disabled={isBusy || sendValidationErrors.length > 0}
          className="gap-2 rounded-full bg-primary px-7 py-2.5 font-bold text-on-primary shadow-sm hover:bg-primary-hover"
        >
          <MaterialIcon name="send" size={18} />
          {sending ? 'Sending…' : 'Send for Signature'}
        </Button>
      </div>
    </footer>
  )
}

export function StepPlaceFields() {
  const VerticalPDFViewer = useMemo(
    () =>
      dynamic(
        () =>
          import('@/components/envelope/VerticalPDFViewer').then((m) => m.VerticalPDFViewer),
        { ssr: false },
      ),
    [],
  )

  const {
    uploadedDocuments,
    fieldPositions,
    recipients,
    activeFieldId,
    setActiveFieldId,
    handleFieldPositionChange,
    handleFieldDelete,
    handleFieldDrop,
    activeDragFieldType,
    setActiveDragFieldType,
    showKeyboardShortcuts,
    setShowKeyboardShortcuts,
    handleSaveDraft,
    handleSend,
    handleFieldDelete: onFieldDelete,
    envelopeName,
    setEnvelopeName,
    description,
    setDescription,
    pdfPasswordProtectionEnabled,
    setPdfPasswordProtectionEnabled,
    sendValidationErrors,
    error,
    success,
    creating,
    saving,
    sending,
    isValidating,
  } = useEnvelopeWizard()

  const isBusy = creating || saving || sending || isValidating
  const [showReviewModal, setShowReviewModal] = useState(false)

  const defaultNamePlaceholder = useMemo(
    () => getDefaultEnvelopeNamePreview(uploadedDocuments),
    [uploadedDocuments],
  )
  const docName = envelopeName.trim() || defaultNamePlaceholder
  const sortedRecipients = useMemo(
    () => [...recipients].sort((a, b) => a.order - b.order),
    [recipients],
  )

  const [viewerPages, setViewerPages] = useState<DocumentPageInfo[]>([])
  const [activePageKey, setActivePageKey] = useState<string | null>(null)
  const [scrollToPageKey, setScrollToPageKey] = useState<string | null>(null)

  const handlePagesChange = useCallback((pages: DocumentPageInfo[]) => {
    setViewerPages(pages)
    setActivePageKey((current) => {
      if (current) return current
      if (pages.length === 0) return null
      return `${pages[0].documentId}-${pages[0].pageNumber}`
    })
  }, [])

  const handlePageSelect = useCallback((pageKey: string) => {
    setActivePageKey(pageKey)
    setScrollToPageKey(pageKey)
  }, [])

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const data = event.active?.data?.current as { type?: string; fieldType?: string } | undefined
      if (data?.type === 'field-palette-item') {
        setActiveDragFieldType(data.fieldType as string)
      }
    },
    [setActiveDragFieldType],
  )

  const handleDragCancel = useCallback(() => {
    setActiveDragFieldType(null)
  }, [setActiveDragFieldType])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const activeData = event.active?.data?.current as
        | { type?: string; fieldType?: string }
        | undefined
      const over = event.over
      const overData = over?.data?.current as
        | { type?: string; documentId?: string; pageNumber?: number }
        | undefined

      setActiveDragFieldType(null)

      if (activeData?.type === 'field-palette-item' && overData?.type === 'page' && over) {
        const fieldType = activeData.fieldType as string
        const { documentId, pageNumber } = overData

        const overRect = over.rect
        const activeRect = event.active?.rect?.current
        const translated = activeRect?.translated || activeRect?.initial
        const pointerX = translated
          ? translated.left + translated.width / 2
          : overRect.left + overRect.width / 2
        const pointerY = translated
          ? translated.top + translated.height / 2
          : overRect.top + overRect.height / 2

        const fieldWidth = 200
        const fieldHeight = 50

        let x = pointerX - overRect.left - fieldWidth / 2
        let y = pointerY - overRect.top - fieldHeight / 2
        x = Math.max(0, Math.min(x, overRect.width - fieldWidth))
        y = Math.max(0, Math.min(y, overRect.height - fieldHeight))

        handleFieldDrop(fieldType, documentId!, pageNumber!, x, y)
      }
    },
    [handleFieldDrop, setActiveDragFieldType],
  )

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (showReviewModal) {
        if (event.key === 'Escape') {
          setShowReviewModal(false)
        }
        return
      }
      if (event.key === 'Delete' && activeFieldId) {
        onFieldDelete(activeFieldId)
        return
      }
      if (event.key === 'Escape') {
        setActiveFieldId(null)
        return
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault()
        void handleSaveDraft()
        return
      }
      if (event.key === '?' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault()
        setShowKeyboardShortcuts(true)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [
    showReviewModal,
    activeFieldId,
    onFieldDelete,
    setActiveFieldId,
    handleSaveDraft,
    setShowKeyboardShortcuts,
  ])

  return mounted
    ? createPortal(
        <div className="fixed inset-0 z-50 flex flex-col bg-surface-container-low">
          <header className="z-50 flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface-container-lowest px-6">
            <div className="flex items-center gap-4">
              <div className="rounded bg-primary px-3 py-1">
                <span className="text-headline-lg font-semibold tracking-tight text-on-primary">
                  Incel E-Sign
                </span>
              </div>
              <div className="hidden h-6 w-px bg-border sm:block" />
              <div className="hidden flex-col sm:flex">
                <span className="text-label-sm font-medium text-primary">{docName}</span>
                <span className="text-caption-xs text-muted">
                  Place fields on document &amp; send
                </span>
              </div>
            </div>
            <EnvelopeWizardStepper variant="compact" className="hidden lg:flex" />
            <div className="flex items-center gap-4">
              <MaterialIcon name="notifications" size={22} className="text-on-surface-variant" />
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-primary-container text-label-xs font-bold text-primary">
                IE
              </div>
            </div>
          </header>

          {error && (
            <div className="flex items-center gap-2 border-b border-error/30 bg-error-container px-6 py-2 text-xs font-medium text-error">
              <MaterialIcon name="error" size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 border-b border-success/30 bg-success-light px-6 py-2 text-xs font-medium text-success">
              <MaterialIcon name="check_circle" size={16} />
              <span>{success}</span>
            </div>
          )}

          <div className="border-b border-warning/30 bg-warning-light px-4 py-2 text-center text-xs text-warning lg:hidden">
            Field placement works best on desktop.
          </div>

          <DndContext
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div className="flex min-h-0 flex-1 overflow-hidden">
              <aside className="hidden h-full min-h-0 w-[200px] shrink-0 border-r border-border lg:block">
                <FieldPalettePanel />
              </aside>

              <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-surface-container-low">
                <VerticalPDFViewer
                  documents={uploadedDocuments}
                  fieldPositions={fieldPositions}
                  recipients={recipients}
                  activeFieldId={activeFieldId}
                  onFieldSelect={setActiveFieldId}
                  onFieldPositionChange={handleFieldPositionChange}
                  onFieldDelete={handleFieldDelete}
                  onFieldDrop={handleFieldDrop}
                  editorLayout
                  onPagesChange={handlePagesChange}
                  scrollToPageKey={scrollToPageKey}
                  activePageKey={activePageKey}
                  onActivePageKeyChange={setActivePageKey}
                />
              </main>

              <div className="hidden h-full min-h-0 shrink-0 lg:block">
                <PlaceFieldsRightPanel
                  pages={viewerPages}
                  activePageKey={activePageKey}
                  onPageSelect={handlePageSelect}
                />
              </div>
            </div>

            <DragOverlay dropAnimation={null}>
              {activeDragFieldType && (
                <div className="pointer-events-none z-[9999] rounded-md border bg-white px-3 py-2 text-xs shadow-lg">
                  {activeDragFieldType}
                </div>
              )}
            </DragOverlay>
          </DndContext>

          <FieldPropertiesPopover />

          <PlaceFieldsFooter onOpenReview={() => setShowReviewModal(true)} />

          {showReviewModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
              <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-surface-container-lowest shadow-xl">
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                  <div>
                    <h3 className="text-headline-lg font-semibold text-primary">
                      Review &amp; Send Envelope
                    </h3>
                    <p className="text-caption-xs text-muted">
                      Verify recipients, fields, and envelope settings before sending.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowReviewModal(false)}
                    aria-label="Close review modal"
                  >
                    <MaterialIcon name="close" size={20} />
                  </Button>
                </div>

                <div className="flex-1 space-y-6 overflow-y-auto p-6">
                  {sendValidationErrors.length > 0 && (
                    <div className="rounded-xl border border-warning/40 bg-warning-light p-4">
                      <div className="flex gap-2">
                        <MaterialIcon name="warning" size={20} className="shrink-0 text-warning" />
                        <div>
                          <p className="text-sm font-medium text-on-surface">Action required</p>
                          <ul className="mt-1 list-inside list-disc text-xs text-muted">
                            {sendValidationErrors.map((err) => (
                              <li key={err}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Envelope Details & Password Protection */}
                  <div className="space-y-4 rounded-xl border border-border bg-surface p-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <Label className="mb-1 block text-caption-xs font-medium text-on-surface-variant">
                          Envelope Name
                        </Label>
                        <Input
                          value={envelopeName}
                          onChange={(e) => setEnvelopeName(e.target.value)}
                          placeholder={defaultNamePlaceholder}
                          className="bg-surface-container-lowest"
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-border bg-surface-container-lowest p-3">
                        <div className="pr-3">
                          <p className="text-label-sm font-semibold text-primary">
                            PDF Password Protection
                          </p>
                          <p className="text-[11px] text-muted">Lock completed PDFs</p>
                        </div>
                        <Switch
                          checked={pdfPasswordProtectionEnabled}
                          onCheckedChange={setPdfPasswordProtectionEnabled}
                          aria-label="Enable PDF password protection"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="mb-1 block text-caption-xs font-medium text-on-surface-variant">
                        Description / Notes
                      </Label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Optional message or notes for recipients..."
                        rows={2}
                        className="bg-surface-container-lowest"
                      />
                    </div>
                  </div>

                  {/* Documents */}
                  <div>
                    <h4 className="mb-2.5 text-label-sm font-semibold uppercase tracking-wider text-muted">
                      Documents ({uploadedDocuments.length})
                    </h4>
                    <div className="space-y-2">
                      {uploadedDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between rounded-lg border border-border bg-surface px-3.5 py-2.5"
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <MaterialIcon
                              name="picture_as_pdf"
                              size={20}
                              className="shrink-0 text-secondary"
                            />
                            <span className="truncate text-label-sm font-medium text-primary">
                              {doc.file_name}
                            </span>
                          </div>
                          <span className="ml-3 shrink-0 text-caption-xs text-muted">
                            {formatFileSize(doc.file_size)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recipients & Field Counts */}
                  <div>
                    <h4 className="mb-2.5 text-label-sm font-semibold uppercase tracking-wider text-muted">
                      Signing Order ({sortedRecipients.length})
                    </h4>
                    <div className="space-y-2.5">
                      {sortedRecipients.map((recipient, idx) => {
                        const fieldCount = countRecipientFields(fieldPositions, recipient.id)
                        const hasNoFields = fieldCount === 0
                        const displayName = recipient.name || recipient.email
                        return (
                          <div
                            key={recipient.id}
                            className={`flex items-center justify-between rounded-xl border p-3 ${
                              hasNoFields
                                ? 'border-error/30 bg-error-container/30'
                                : 'border-border bg-surface'
                            }`}
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-caption-xs font-bold text-on-secondary">
                                {idx + 1}
                              </span>
                              <div
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                                style={{
                                  backgroundColor: `${recipient.color}33`,
                                  color: recipient.color,
                                }}
                              >
                                {getRecipientInitials(recipient.name, recipient.email)}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-label-sm font-bold text-primary">
                                  {displayName}
                                </p>
                                <p className="truncate text-caption-xs text-muted">
                                  {recipient.email}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`ml-3 shrink-0 rounded-full px-3 py-1 text-caption-xs font-semibold ${
                                hasNoFields
                                  ? 'bg-error-container text-error'
                                  : 'bg-white text-primary border border-border'
                              }`}
                            >
                              {hasNoFields
                                ? 'No fields placed'
                                : `${fieldCount} field${fieldCount === 1 ? '' : 's'}`}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowReviewModal(false)}
                    disabled={isBusy}
                  >
                    Continue Editing
                  </Button>
                  <Button
                    type="button"
                    onClick={() => void handleSend()}
                    disabled={isBusy || sendValidationErrors.length > 0}
                    className="gap-2 bg-primary px-6 font-bold text-on-primary hover:bg-primary-hover"
                  >
                    <MaterialIcon name="send" size={18} />
                    {sending ? 'Sending…' : 'Send for Signature'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {showKeyboardShortcuts && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
              <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowKeyboardShortcuts(false)}
                  >
                    <MaterialIcon name="close" size={18} />
                  </Button>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Delete selected field</span>
                    <kbd className="rounded bg-surface-container-low px-2 py-0.5 text-xs">
                      Delete
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Save draft</span>
                    <kbd className="rounded bg-surface-container-low px-2 py-0.5 text-xs">
                      Ctrl+S
                    </kbd>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>,
        document.body,
      )
    : null
}
