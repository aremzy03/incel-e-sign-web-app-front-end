'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import dynamic from 'next/dynamic'
import { DndContext, DragOverlay, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import { Button } from '@/components/ui/button'
import { MaterialIcon } from '@/components/ui/material-icon'
import type { DocumentPageInfo } from '@/components/envelope/VerticalPDFViewer'
import { FieldPalettePanel } from '../FieldPalettePanel'
import { PlaceFieldsRightPanel } from '../PlaceFieldsRightPanel'
import { FieldPropertiesPopover } from '../FieldPropertiesPopover'
import { EnvelopeWizardStepper } from '../EnvelopeWizardStepper'
import { useEnvelopeWizard } from '../envelope-wizard-context'

function PlaceFieldsFooter() {
  const { goBack, goNext, handleSaveDraft, creating, saving, sending, isValidating } =
    useEnvelopeWizard()
  const isBusy = creating || saving || sending || isValidating

  return (
    <footer className="z-50 flex h-16 shrink-0 items-center justify-between border-t border-border bg-white px-8">
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
      <div className="flex items-center gap-4">
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
          onClick={goNext}
          disabled={isBusy}
          className="gap-2 rounded-full bg-secondary px-8 py-2.5 font-medium text-on-secondary shadow-sm hover:bg-accent-hover"
        >
          Next: Settings
          <MaterialIcon name="arrow_forward" size={18} />
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
    handleFieldDelete: onFieldDelete,
  } = useEnvelopeWizard()

  const docName = uploadedDocuments[0]?.file_name ?? 'Document'
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
            <span className="text-caption-xs text-muted">Place fields on document</span>
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

      <PlaceFieldsFooter />

      {showKeyboardShortcuts && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowKeyboardShortcuts(false)}>
                <MaterialIcon name="close" size={18} />
              </Button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Delete selected field</span>
                <kbd className="rounded bg-surface-container-low px-2 py-0.5 text-xs">Delete</kbd>
              </div>
              <div className="flex justify-between">
                <span>Save draft</span>
                <kbd className="rounded bg-surface-container-low px-2 py-0.5 text-xs">Ctrl+S</kbd>
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
