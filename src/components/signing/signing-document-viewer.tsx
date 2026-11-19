'use client'

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import type { EnvelopeDocumentResponse, Position } from '@/lib/api/envelopes'
import type { User } from '@/lib/api/users'
import { PdfLoadingIndicator } from '@/components/pdf/PdfLoadingIndicator'
import { MaterialIcon } from '@/components/ui/material-icon'
import { resolveSignatureImage } from '@/hooks/signing'
import {
  formatSigningDate,
  positionToPixelStyle,
  type PageDimsByDoc,
  type SignerDocumentPositionEntry,
  type SigningEnvelopeField,
  type SigningEnvelopeResponse,
} from '@/hooks/signing/types'
import { cn } from '@/lib/utils'
import {
  DEFAULT_INITIALS_CHOICE,
  initialsFontStyle,
  initialsText,
  type InitialsChoice,
} from '@/lib/fields/stamps'
import { documentUrlNeedsAuth, getPdfJsDocumentOptions } from '@/lib/url'

type ReactPdfModule = typeof import('react-pdf')
type PdfComponents = Pick<ReactPdfModule, 'Document' | 'Page'> & { pdfjs: ReactPdfModule['pdfjs'] }

export interface SigningDocumentViewerProps {
  envelopeDocuments: EnvelopeDocumentResponse[]
  envelope: SigningEnvelopeResponse
  pdfFileByDocumentId: Record<string, { url: string; httpHeaders?: Record<string, string> }>
  pdfLoadedByDocId: Record<string, boolean>
  setPdfLoadedByDocId: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  markPreviewFallback?: (documentId: string) => void
  pageDims: PageDimsByDoc
  setPageContainerRef: (docId: string, pageNo: number) => (el: HTMLDivElement | null) => void
  measurePageCanvas: (docId: string, pageNo: number) => void
  setPageDimensions: (
    docId: string,
    pageNo: number,
    widthPt: number,
    heightPt: number,
    widthPx?: number,
    heightPx?: number,
  ) => void
  setDocumentNumPages: (docId: string, numPages: number) => void
  passwordDialog: React.ReactNode
  onPassword: (updatePassword: (password: string) => void, reason: 1 | 2) => void
  passwordCancelled: boolean
  currentUserId?: string
  signerDetails: Record<string, User>
  signedFor: Record<string, boolean>
  previewSignerId: string | null
  selectedSignature: unknown
  onPlaceholderClick: (entry: SignerDocumentPositionEntry) => void
  fieldValues: Record<string, string>
  setFieldValue: (id: string, value: string) => void
  activeFieldPreview: string | null
  toggleFieldPreview: (key: string) => void
  draftPlacement: Position | null
  setDraftPlacement: React.Dispatch<React.SetStateAction<Position | null>>
  isDraggingDraft: boolean
  setIsDraggingDraft: React.Dispatch<React.SetStateAction<boolean>>
  dragOffset: { x: number; y: number }
  setDragOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>
  selected: SignerDocumentPositionEntry | null
  setSelected: React.Dispatch<React.SetStateAction<SignerDocumentPositionEntry | null>>
  onClearPreview: () => void
  zoom: number
  /** How the signer's initials will be stamped (style and handwriting font). */
  initialsChoice?: InitialsChoice
  focusedTargetId?: string | null
  selectedFieldKey?: string | null
  onPageIndicatorChange?: (currentPage: number, totalPages: number) => void
  documentSectionRefs?: React.MutableRefObject<Record<string, HTMLDivElement | null>>
  renderPageOverlay?: (documentId: string, pageNo: number) => React.ReactNode
  className?: string
}

function fieldToPosition(f: SigningEnvelopeField): Position {
  return {
    page: f.page,
    x: f.x,
    y: f.y,
    width: f.width,
    height: f.height,
  }
}

export function SigningDocumentViewer({
  envelopeDocuments,
  envelope,
  pdfFileByDocumentId,
  pdfLoadedByDocId,
  setPdfLoadedByDocId,
  markPreviewFallback,
  pageDims,
  setPageContainerRef,
  measurePageCanvas,
  setPageDimensions,
  setDocumentNumPages,
  passwordDialog,
  onPassword,
  passwordCancelled,
  currentUserId,
  signerDetails,
  signedFor,
  previewSignerId,
  selectedSignature,
  onPlaceholderClick,
  fieldValues,
  setFieldValue,
  activeFieldPreview,
  toggleFieldPreview,
  draftPlacement,
  setDraftPlacement,
  isDraggingDraft,
  setIsDraggingDraft,
  dragOffset,
  setDragOffset,
  selected,
  setSelected,
  onClearPreview,
  zoom,
  initialsChoice = DEFAULT_INITIALS_CHOICE,
  focusedTargetId,
  selectedFieldKey,
  onPageIndicatorChange,
  documentSectionRefs,
  renderPageOverlay,
  className,
}: SigningDocumentViewerProps) {
  const [pdf, setPdf] = useState<PdfComponents | null>(null)
  // react-pdf reloads a document when `options` changes identity, so keep one
  // options object per URL for the life of the viewer.
  const pdfOptionsCache = useRef<Record<string, ReturnType<typeof getPdfJsDocumentOptions>>>({})
  const pdfOptionsFor = (url: string | undefined) => {
    if (!url) return undefined
    pdfOptionsCache.current[url] ??= getPdfJsDocumentOptions(url)
    return pdfOptionsCache.current[url]
  }
  const selectedSignatureImage = resolveSignatureImage(selectedSignature)
  // Pages fill the canvas width (like a browser PDF viewer); zoom multiplies that fit.
  // `scale` is rendered CSS px per PDF point. Draft placement is kept in points.
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const pagesColumnRef = useRef<HTMLDivElement>(null)
  const [availableWidth, setAvailableWidth] = useState(0)
  useLayoutEffect(() => {
    const scroller = scrollAreaRef.current
    const column = pagesColumnRef.current
    if (!scroller || !column) return
    const measure = () => {
      const styles = getComputedStyle(column)
      const inner = scroller.clientWidth - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight)
      setAvailableWidth((current) => (Math.abs(current - inner) < 1 ? current : Math.max(200, inner)))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(scroller)
    return () => observer.disconnect()
  }, [pdf])
  const widestPagePt = useMemo(() => {
    let widest = 0
    for (const doc of Object.values(pageDims)) {
      for (const [key, dims] of Object.entries(doc)) {
        if (key !== 'numPages' && typeof dims === 'object' && dims?.widthPt) widest = Math.max(widest, dims.widthPt)
      }
    }
    return widest || 612
  }, [pageDims])
  const fitScale = availableWidth > 0 ? availableWidth / widestPagePt : 1
  const scale = fitScale * (zoom / 100)
  const positionCoordinateSpace: 'auto' | 'pdf-points' = 'auto'

  const totalPages = envelopeDocuments.reduce(
    (acc, doc) => acc + (pageDims[doc.id]?.numPages || 0),
    0,
  )

  const onPageIndicatorChangeRef = useRef(onPageIndicatorChange)
  const lastReportedPageRef = useRef({ current: 0, total: 0 })

  useEffect(() => {
    onPageIndicatorChangeRef.current = onPageIndicatorChange
  }, [onPageIndicatorChange])

  const reportPageIndicator = useCallback((current: number, total: number) => {
    const last = lastReportedPageRef.current
    if (last.current === current && last.total === total) return
    lastReportedPageRef.current = { current, total }
    onPageIndicatorChangeRef.current?.(current, total)
  }, [])

  useEffect(() => {
    if (totalPages === 0) return
    reportPageIndicator(1, totalPages)
  }, [totalPages, reportPageIndicator])

  useEffect(() => {
    if (totalPages === 0) return

    const pageElements = Array.from(document.querySelectorAll('[data-signing-page]'))
    if (pageElements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible.length === 0) return
        const pageNo = Number(visible[0].target.getAttribute('data-signing-page') || 1)
        reportPageIndicator(pageNo, totalPages)
      },
      { root: null, threshold: [0.25, 0.5, 0.75] },
    )

    pageElements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [totalPages, reportPageIndicator, envelopeDocuments, pdfLoadedByDocId])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const mod = (await import('react-pdf')) as ReactPdfModule
        mod.pdfjs.GlobalWorkerOptions.workerSrc = `${window.location.origin}/pdf.worker.min.mjs`
        if (!cancelled) {
          setPdf({ Document: mod.Document, Page: mod.Page, pdfjs: mod.pdfjs })
        }
      } catch (e) {
        console.error('[SigningDocumentViewer] Failed to load PDF renderer:', e)
        toast.error('Failed to initialize PDF preview')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const renderSignaturePlaceholders = useCallback(
    (docItem: EnvelopeDocumentResponse, pageNo: number) => {
      const signerPositionsForThisDoc = docItem.signer_document_positions || []
      const myPositionsWithIdx = signerPositionsForThisDoc
        .map((sp, signerIdx) => ({ sp, signerIdx }))
        .filter(({ sp }) => currentUserId && sp.signer_id === currentUserId)
      const myPositionsOnThisPage = myPositionsWithIdx
        .map(({ sp }, idx) => ({ sp, idx }))
        .filter(({ sp }) => sp.position.page === pageNo)
      const dims = pageDims[docItem.id]?.[pageNo]

      return myPositionsOnThisPage.map(({ sp: entry, idx }) => {
        const isMe = entry.signer_id === currentUserId
        const targetKey = `sig-${docItem.id}-${entry.signer_id}-${idx}`
        const isSigned = Boolean(
          signedFor[`${docItem.id}-${entry.signer_id}-${idx}`] ||
            signedFor[`${docItem.id}-${entry.signer_id}`],
        )
        const isSelected = selectedFieldKey === targetKey
        const isFocused = focusedTargetId === targetKey
        const isPreview = previewSignerId === entry.signer_id && !isSigned
        const commonStyle = dims
          ? positionToPixelStyle(entry.position, dims, { coordinateSpace: positionCoordinateSpace })
          : null

        if (!commonStyle) return null

        return (
          <div
            key={targetKey}
            data-signing-target={targetKey}
            className={cn('absolute', isFocused && 'ring-2 ring-status-your-turn ring-offset-1')}
            style={commonStyle}
          >
            {!isSigned ? (
              isPreview && selectedSignatureImage ? (
                <button
                  type="button"
                  className="relative h-full w-full cursor-pointer rounded-md border-2 border-success bg-white shadow-lg transition hover:border-success group"
                  onClick={() =>
                    isMe
                      ? onPlaceholderClick({ ...entry, document_id: docItem.id, position_index: idx })
                      : undefined
                  }
                  title="Selected signature field"
                >
                  <img
                    src={selectedSignatureImage}
                    alt="Signature preview"
                    className="h-full w-full select-none object-contain p-1"
                  />
                  <div className="absolute inset-0 flex items-center justify-center rounded-md bg-success/10 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="rounded bg-white/90 px-2 py-1 text-xs font-semibold text-success-text">
                      Selected
                    </span>
                  </div>
                </button>
              ) : (
                // Container queries: labels appear only when the box is wide enough for them,
                // so small pages (phones) don't spill text outside the field.
                <div className="@container relative h-full w-full">
                  <button
                    type="button"
                    aria-label={isSelected ? 'Selected signature field' : 'Place signature'}
                    onClick={() =>
                      onPlaceholderClick({ ...entry, document_id: docItem.id, position_index: idx })
                    }
                    className={cn(
                      'field-pulse group absolute inset-0 flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed bg-accent-light/30 transition hover:bg-accent-light/50',
                      isSelected
                        ? 'border-status-your-turn ring-2 ring-status-your-turn/30'
                        : 'border-status-your-turn',
                    )}
                    title="Place your signature here"
                  >
                    <div className="flex min-w-0 items-center gap-1 px-1 text-your-turn-text @[9rem]:gap-2">
                      <MaterialIcon name="history_edu" size={20} fill />
                      <span className="hidden truncate font-label-sm text-label-sm font-bold @[9rem]:inline">
                        {isSelected ? 'SELECTED' : 'PLACE SIGNATURE'}
                      </span>
                    </div>
                  </button>
                  <div className="absolute -left-2 -top-3 hidden rounded bg-your-turn-strong px-2 py-0.5 text-[10px] font-bold text-white @[7rem]:block">
                    REQUIRED
                  </div>
                </div>
              )
            ) : selectedSignatureImage ? (
              <img
                src={selectedSignatureImage}
                alt="Signed"
                className="h-full w-full select-none object-contain"
              />
            ) : (
              <div className="absolute inset-0 rounded-md border-2 border-success bg-success-light" />
            )}
          </div>
        )
      })
    },
    [
      currentUserId,
      onPlaceholderClick,
      pageDims,
      previewSignerId,
      selectedSignatureImage,
      signedFor,
      selectedFieldKey,
      focusedTargetId,
      signerDetails,
      positionCoordinateSpace,
    ],
  )

  const renderFieldOverlays = useCallback(
    (docItem: EnvelopeDocumentResponse, pageNo: number) => {
      const allFields = envelope.fields
      if (!allFields?.length) return null

      const dims = pageDims[docItem.id]?.[pageNo]
      const fieldsForPage = allFields.filter((f) => (f?.page || 0) === pageNo)
      const interactiveCls =
        'group absolute inset-0 flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-status-your-turn bg-info-light/40 p-0.5 transition @[8rem]:p-2 hover:bg-accent-light/60'
      const disabledCls =
        'absolute inset-0 flex cursor-not-allowed items-center justify-center rounded-md border border-outline-variant bg-surface-container-high/30 p-0.5 @[8rem]:p-2'

      return fieldsForPage.map((f, idx) => {
        const key = f.id || `${docItem.id}-${pageNo}-${idx}`
        const targetId = f.id ?? `field-${idx}`
        const style = dims
          ? positionToPixelStyle(fieldToPosition(f), dims, { coordinateSpace: positionCoordinateSpace })
          : null
        if (!style) return null

        const isMine = !currentUserId || !f.assigned_signer || f.assigned_signer === currentUserId
        const isActive = activeFieldPreview === key
        const isFocused = focusedTargetId === targetId
        const fontFamily = f.font_family || 'Helvetica'
        // Field text is in points; scale it with the page like the PDF will.
        const fontSize = (f.font_size || 12) * scale
        const requiredMark = f.required ? ' *' : ''
        const myName = currentUserId ? signerDetails[currentUserId]?.full_name : undefined
        const initials = initialsText(myName, initialsChoice.style)
        const today = formatSigningDate(new Date(), f.date_format)

        const header = (
          <div className="absolute left-0 right-0 top-0 hidden items-center justify-between px-1 pt-0.5 text-[10px] leading-none text-info/90 @[8rem]:flex">
            <span className="max-w-[70%] truncate">
              {isMine ? signerDetails[f.assigned_signer || '']?.full_name || 'You' : 'Recipient'}
            </span>
            <span className="uppercase opacity-80">{f.type}</span>
          </div>
        )

        const handleClick = () => {
          if (!isMine) return
          toggleFieldPreview(key)
        }

        if (f.type === 'date') {
          const value = f.prefill_value && f.prefill_value.trim() !== '' ? f.prefill_value : today
          return (
            <div
              key={`nf-${docItem.id}-${idx}`}
              data-signing-target={targetId}
              className={cn('@container absolute', isFocused && 'ring-2 ring-status-your-turn ring-offset-1')}
              style={style}
            >
              <div
                className={
                  isMine
                    ? 'absolute inset-0 flex items-center justify-center rounded-lg border-2 border-status-completed bg-success-light/30 px-1 transition @[8rem]:px-4'
                    : disabledCls
                }
                title={`Date${requiredMark}`}
                role={isMine ? 'button' : undefined}
                onClick={handleClick}
              >
                <div className="flex w-full min-w-0 items-center justify-center gap-2 text-success-text">
                  <MaterialIcon name="calendar_today" size={18} className="hidden @[7rem]:inline-block" />
                  <span style={{ fontFamily, fontSize }} className="font-semibold">
                    {value}
                  </span>
                  <MaterialIcon name="check_circle" size={18} className="ml-auto hidden @[9rem]:inline-block" />
                </div>
              </div>
            </div>
          )
        }

        if (f.type === 'initials') {
          const value = f.prefill_value && f.prefill_value.trim() !== '' ? f.prefill_value : initials
          return (
            <div
              key={`nf-${docItem.id}-${idx}`}
              data-signing-target={targetId}
              className={cn('@container absolute', isFocused && 'ring-2 ring-status-your-turn ring-offset-1')}
              style={style}
            >
              <div
                className={isMine ? interactiveCls : disabledCls}
                title={`Initials${requiredMark}`}
                role={isMine ? 'button' : undefined}
                onClick={handleClick}
              >
                {header}
                <div
                  style={value === initials ? { ...initialsFontStyle(initialsChoice.font), fontSize: '1.25em' } : { fontFamily, fontSize }}
                  className="flex h-full w-full items-center justify-center truncate text-on-surface"
                >
                  {value || '—'}
                </div>
                {isMine ? (
                  <div className="absolute bottom-0.5 left-0 right-0 text-center hidden text-[10px] text-secondary opacity-0 transition-opacity group-hover:opacity-100 @[8rem]:block">
                    Click to preview
                  </div>
                ) : null}
              </div>
            </div>
          )
        }

        if (f.type === 'designation') {
          const value = f.prefill_value ?? 'Designation not set'
          return (
            <div
              key={`nf-${docItem.id}-${idx}`}
              data-signing-target={targetId}
              className={cn('@container absolute', isFocused && 'ring-2 ring-status-your-turn ring-offset-1')}
              style={style}
            >
              <div
                className={isMine ? interactiveCls : disabledCls}
                title={`Designation${requiredMark}`}
                role={isMine ? 'button' : undefined}
                onClick={handleClick}
              >
                {header}
                <div style={{ fontFamily, fontSize }} className="w-full truncate px-2 text-on-surface">
                  {value}
                </div>
                {isMine ? (
                  <div className="absolute bottom-0.5 left-0 right-0 text-center hidden text-[10px] text-secondary opacity-0 transition-opacity group-hover:opacity-100 @[8rem]:block">
                    Click to preview
                  </div>
                ) : null}
              </div>
            </div>
          )
        }

        return (
          <div
            key={`nf-${docItem.id}-${idx}`}
            data-signing-target={targetId}
            className={cn('absolute', isFocused && 'ring-2 ring-status-your-turn ring-offset-1')}
            style={style}
          >
            <div
              className={isMine ? interactiveCls : disabledCls}
              title={`Text${requiredMark}`}
              role={isMine ? 'button' : undefined}
              onClick={handleClick}
            >
              {header}
              <input
                type="text"
                value={fieldValues[f.id || ''] ?? f.prefill_value ?? ''}
                placeholder={f.placeholder || ''}
                maxLength={f.max_length || undefined}
                readOnly={!isMine}
                className="h-full w-full bg-transparent text-on-surface outline-none"
                style={{ fontFamily, fontSize }}
                autoFocus={isActive}
                onChange={(e) => {
                  if (!f.id) return
                  setFieldValue(f.id, e.target.value)
                }}
              />
              {isMine ? (
                <div className="absolute bottom-0.5 left-0 right-0 text-center hidden text-[10px] text-secondary opacity-0 transition-opacity group-hover:opacity-100 @[8rem]:block">
                  Click to type
                </div>
              ) : null}
            </div>
          </div>
        )
      })
    },
    [
      activeFieldPreview,
      focusedTargetId,
      currentUserId,
      envelope.fields,
      fieldValues,
      initialsChoice,
      pageDims,
      positionCoordinateSpace,
      scale,
      setFieldValue,
      signerDetails,
      toggleFieldPreview,
    ],
  )

  const renderDraftPlacement = useCallback(
    (docItem: EnvelopeDocumentResponse, pageNo: number) => {
      const mySignerDocPosition = docItem.signer_document_positions?.find((s) => s.signer_id === currentUserId)
      const canPlace =
        (!mySignerDocPosition || !mySignerDocPosition.position) &&
        previewSignerId &&
        currentUserId &&
        previewSignerId === currentUserId &&
        docItem.document_file_url

      if (!canPlace) return null

      const isThisDocAndPage = draftPlacement?.page === pageNo && selected?.document_id === docItem.id
      const defaultW = 180
      const defaultH = 50

      return (
        <div
          className="absolute inset-0"
          onClick={(e) => {
            if (!selectedSignatureImage) return
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
            const x = (e.clientX - rect.left) / scale - defaultW / 2
            const y = (e.clientY - rect.top) / scale - defaultH / 2
            setSelected({ ...selected!, document_id: docItem.id })
            setDraftPlacement({
              page: pageNo,
              x: Math.max(0, x),
              y: Math.max(0, y),
              width: defaultW,
              height: defaultH,
            })
          }}
        >
          {isThisDocAndPage && draftPlacement && selectedSignatureImage ? (
            <div
              className="absolute cursor-move touch-none select-none rounded-md border-2 border-status-your-turn bg-white/90 shadow"
              style={{
                left: draftPlacement.x * scale,
                top: draftPlacement.y * scale,
                width: draftPlacement.width * scale,
                height: draftPlacement.height * scale,
              }}
              // Pointer events cover mouse, touch and pen. Capture keeps the drag
              // alive when a finger or cursor outruns the box; cancel/lost capture
              // clear it so an interrupted gesture never leaves the box stuck.
              onPointerDown={(e) => {
                if (e.pointerType === 'mouse' && e.button !== 0) return
                e.stopPropagation()
                e.currentTarget.setPointerCapture(e.pointerId)
                setIsDraggingDraft(true)
                const rect = e.currentTarget.getBoundingClientRect()
                setDragOffset({
                  x: (e.clientX - rect.left) / scale,
                  y: (e.clientY - rect.top) / scale,
                })
              }}
              onPointerMove={(e) => {
                if (!isDraggingDraft || !draftPlacement) return
                const parentRect = (e.currentTarget.parentElement as HTMLDivElement).getBoundingClientRect()
                const newX = Math.max(
                  0,
                  Math.min(
                    (e.clientX - parentRect.left) / scale - dragOffset.x,
                    parentRect.width / scale - draftPlacement.width,
                  ),
                )
                const newY = Math.max(
                  0,
                  Math.min(
                    (e.clientY - parentRect.top) / scale - dragOffset.y,
                    parentRect.height / scale - draftPlacement.height,
                  ),
                )
                setDraftPlacement({ ...draftPlacement, x: newX, y: newY })
              }}
              onPointerUp={() => setIsDraggingDraft(false)}
              onPointerCancel={() => setIsDraggingDraft(false)}
              onLostPointerCapture={() => setIsDraggingDraft(false)}
              // The page layer re-places the box on click; a finished drag must not.
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedSignatureImage}
                alt="Signature preview"
                className="pointer-events-none h-full w-full select-none object-contain"
              />
            </div>
          ) : null}
        </div>
      )
    },
    [
      currentUserId,
      draftPlacement,
      dragOffset.x,
      dragOffset.y,
      isDraggingDraft,
      previewSignerId,
      scale,
      selected,
      selectedSignatureImage,
      setDraftPlacement,
      setDragOffset,
      setIsDraggingDraft,
      setSelected,
    ],
  )

  if (!pdf) {
    return (
      <div
        className={cn(
          'flex flex-1 flex-col items-center overflow-y-auto bg-surface-container-low p-8',
          'bg-[radial-gradient(#041534_1px,transparent_1px)] [background-size:20px_20px]',
          'wizard-custom-scrollbar',
          className,
        )}
      >
        <div className="flex w-full max-w-[850px] flex-col items-center">
          <PdfLoadingIndicator label="Initializing PDF viewer…" />
        </div>
      </div>
    )
  }

  const PdfDocument = pdf.Document
  const PdfPage = pdf.Page

  return (
    <div
      ref={scrollAreaRef}
      className={cn(
        'flex flex-1 flex-col overflow-y-auto bg-surface-container-low',
        'bg-[radial-gradient(#041534_1px,transparent_1px)] [background-size:20px_20px]',
        'wizard-custom-scrollbar',
        className,
      )}
      onClick={(e) => {
        if (
          e.target === e.currentTarget ||
          (e.target as HTMLElement).classList.contains('react-pdf__Page__canvas')
        ) {
          onClearPreview()
        }
      }}
    >
      {passwordDialog}

      {/* Start-aligned so a page zoomed wider than the canvas scrolls instead of clipping its left edge. */}
      <div ref={pagesColumnRef} className="flex flex-col items-start gap-8 p-4 md:p-8">
        {envelopeDocuments.map((docItem, docIndex) => {
          const pagesBefore = envelopeDocuments
            .slice(0, docIndex)
            .reduce((acc, d) => acc + (pageDims[d.id]?.numPages || 0), 0)

          if (!docItem.document_file_url || passwordCancelled) {
            if (passwordCancelled) {
              return (
                <div key={docItem.id} className="flex min-h-[200px] w-full max-w-[850px] items-center justify-center text-muted">
                  PDF preview cancelled.
                </div>
              )
            }
            if (docItem.document_file_url) {
              return (
                <div key={docItem.id} className="w-full max-w-[850px]">
                  <PdfLoadingIndicator label="Loading PDF preview…" />
                </div>
              )
            }
            return (
              <div key={docItem.id} className="flex min-h-[200px] w-full max-w-[850px] items-center justify-center text-muted">
                No PDF preview available for this document.
              </div>
            )
          }

          return (
            <div
              key={docItem.id}
              ref={(el) => {
                if (documentSectionRefs) documentSectionRefs.current[docItem.id] = el
              }}
              className="flex w-max min-w-full flex-col items-center gap-8 scroll-mt-4"
              data-document-section={docItem.id}
            >
              {!pdfLoadedByDocId[docItem.id] ? (
                <PdfLoadingIndicator label="Loading document…" />
              ) : null}

              <PdfDocument
                // A new file (e.g. after saving added text) remounts the document and its
                // pages; swapping it in place lets old pages render against a destroyed
                // worker ("Cannot read properties of null (reading 'sendWithPromise')").
                key={pdfFileByDocumentId[docItem.document]?.url ?? docItem.id}
                className="flex w-full flex-col items-center gap-8"
                file={pdfFileByDocumentId[docItem.document]}
                options={pdfOptionsFor(pdfFileByDocumentId[docItem.document]?.url)}
                onLoadSuccess={(info: { numPages: number }) => {
                  setPdfLoadedByDocId((prev) => ({ ...prev, [docItem.id]: true }))
                  setDocumentNumPages(docItem.id, info.numPages)
                }}
                onLoadError={(error: unknown) => {
                  console.error(`[SigningDocumentViewer] PDF load error for ${docItem.id}:`, error)
                  const fileConfig = docItem.document
                    ? pdfFileByDocumentId[docItem.document]
                    : undefined
                  const currentUrl =
                    typeof fileConfig === 'string' ? fileConfig : fileConfig?.url
                  if (docItem.document && currentUrl && documentUrlNeedsAuth(currentUrl)) {
                    toast.error(`Failed to load PDF for ${docItem.file_name || docItem.id}`)
                  } else if (docItem.document) {
                    markPreviewFallback?.(docItem.document)
                    return
                  } else {
                    toast.error(`Failed to load PDF for ${docItem.file_name || docItem.id}`)
                  }
                  setPdfLoadedByDocId((prev) => ({ ...prev, [docItem.id]: false }))
                }}
                onPassword={onPassword as never}
                loading=""
              >
                {Array.from({ length: pageDims[docItem.id]?.numPages || 1 }, (_, i) => i + 1).map((pageNo) => (
                  <div
                    key={`${docItem.id}-${pageNo}`}
                    className="relative w-fit scroll-mt-4"
                    data-signing-page={pagesBefore + pageNo}
                    ref={setPageContainerRef(docItem.id, pageNo)}
                  >
                    <div className="relative overflow-hidden bg-white shadow-xl ring-1 ring-black/5">
                      <PdfPage
                        pageNumber={pageNo}
                        scale={scale}
                        renderAnnotationLayer={false}
                        renderTextLayer={false}
                        className="block w-fit"
                        loading={<PdfLoadingIndicator size="sm" label="Loading page…" />}
                        data-page-key={`${docItem.id}-${pageNo}`}
                        onRenderSuccess={(page: {
                          view?: number[]
                          width?: number
                          height?: number
                          canvas?: HTMLCanvasElement
                        }) => {
                          try {
                            const [x0, y0, x1, y1] = page.view || [0, 0, page.width, page.height]
                            const widthPt = Math.abs((x1 ?? page.width ?? 0) - (x0 ?? 0)) || page.width || 0
                            const heightPt = Math.abs((y1 ?? page.height ?? 0) - (y0 ?? 0)) || page.height || 0
                            setPageDimensions(docItem.id, pageNo, widthPt, heightPt)
                            measurePageCanvas(docItem.id, pageNo)
                          } catch (e) {
                            console.error('[SigningDocumentViewer] Error getting page dimensions:', e)
                          }
                        }}
                      />

                      <div className="absolute inset-0 z-10">
                        {renderSignaturePlaceholders(docItem, pageNo)}
                        {renderFieldOverlays(docItem, pageNo)}
                        {renderDraftPlacement(docItem, pageNo)}
                        {renderPageOverlay?.(docItem.document, pageNo)}
                      </div>
                    </div>
                  </div>
                ))}
              </PdfDocument>
            </div>
          )
        })}
      </div>
    </div>
  )
}
