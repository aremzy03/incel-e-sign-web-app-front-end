'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import type { EnvelopeDocumentResponse, Position } from '@/lib/api/envelopes'
import type { User } from '@/lib/api/users'
import { PdfLoadingIndicator } from '@/components/pdf/PdfLoadingIndicator'
import { MaterialIcon } from '@/components/ui/material-icon'
import { resolveSignatureImage } from '@/hooks/signing'
import {
  formatSigningDate,
  getInitialsFromName,
  positionToPixelStyle,
  type PageDimsByDoc,
  type SignerDocumentPositionEntry,
  type SigningEnvelopeField,
  type SigningEnvelopeResponse,
} from '@/hooks/signing/types'
import { cn } from '@/lib/utils'
import { documentUrlNeedsAuth } from '@/lib/url'

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
  onPageIndicatorChange?: (currentPage: number, totalPages: number) => void
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
  onPageIndicatorChange,
  className,
}: SigningDocumentViewerProps) {
  const [pdf, setPdf] = useState<PdfComponents | null>(null)
  const selectedSignatureImage = resolveSignatureImage(selectedSignature)
  const scale = zoom / 100
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
      const myPositionsOnThisPage = signerPositionsForThisDoc.filter(
        (sp) => currentUserId && sp.signer_id === currentUserId && sp.position.page === pageNo,
      )
      const dims = pageDims[docItem.id]?.[pageNo]

      return myPositionsOnThisPage.map((entry, idx) => {
        const isMe = entry.signer_id === currentUserId
        const isSigned = signedFor[`${docItem.id}-${entry.signer_id}`]
        const isPreview = previewSignerId === entry.signer_id && !isSigned
        const commonStyle = dims
          ? positionToPixelStyle(entry.position, dims, { coordinateSpace: positionCoordinateSpace })
          : null

        if (!commonStyle) return null

        return (
          <div key={`${docItem.id}-${entry.signer_id}-${idx}`} className="absolute" style={commonStyle}>
            {!isSigned ? (
              isPreview && selectedSignatureImage ? (
                <div
                  className="relative h-full w-full cursor-pointer rounded-md border-2 border-green-500 bg-white shadow-lg transition hover:border-green-600 group"
                  onClick={() => (isMe ? onPlaceholderClick({ ...entry, document_id: docItem.id }) : undefined)}
                  title="Click to confirm and sign"
                >
                  <img
                    src={selectedSignatureImage}
                    alt="Signature preview"
                    className="h-full w-full select-none object-contain p-1"
                  />
                  <div className="absolute inset-0 flex items-center justify-center rounded-md bg-green-500/10 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="rounded bg-white/90 px-2 py-1 text-xs font-semibold text-green-700">
                      Click to confirm
                    </span>
                  </div>
                </div>
              ) : (
                <div className="relative h-full w-full">
                  <div
                    role="button"
                    onClick={() => onPlaceholderClick({ ...entry, document_id: docItem.id })}
                    className="field-pulse group absolute inset-0 flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-status-your-turn bg-accent-light/30 transition hover:bg-accent-light/50"
                    title="Click to place your signature"
                  >
                    <div className="flex items-center gap-2 text-status-your-turn">
                      <MaterialIcon name="history_edu" size={20} fill />
                      <span className="font-label-sm text-label-sm font-bold">CLICK TO SIGN</span>
                    </div>
                  </div>
                  <div className="absolute -left-2 -top-3 rounded bg-status-your-turn px-2 py-0.5 text-[10px] font-bold text-white">
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
              <div className="absolute inset-0 rounded-md border-2 border-green-400 bg-green-100" />
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
        'group absolute inset-0 flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-status-your-turn bg-info-light/40 p-2 transition hover:bg-accent-light/60'
      const disabledCls =
        'absolute inset-0 flex cursor-not-allowed items-center justify-center rounded-md border border-outline-variant bg-gray-200/30 p-2'

      return fieldsForPage.map((f, idx) => {
        const key = f.id || `${docItem.id}-${pageNo}-${idx}`
        const style = dims
          ? positionToPixelStyle(fieldToPosition(f), dims, { coordinateSpace: positionCoordinateSpace })
          : null
        if (!style) return null

        const isMine = !currentUserId || !f.assigned_signer || f.assigned_signer === currentUserId
        const isActive = activeFieldPreview === key
        const fontFamily = f.font_family || 'Helvetica'
        const fontSize = f.font_size || 12
        const requiredMark = f.required ? ' *' : ''
        const myName = currentUserId ? signerDetails[currentUserId]?.full_name : undefined
        const initials = getInitialsFromName(myName)
        const today = formatSigningDate(new Date(), f.date_format)

        const header = (
          <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-1 pt-0.5 text-[10px] leading-none text-info/90">
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
            <div key={`nf-${docItem.id}-${idx}`} className="absolute" style={style}>
              <div
                className={
                  isMine
                    ? 'absolute inset-0 flex items-center justify-center rounded-lg border-2 border-status-completed bg-success-light/30 px-4 transition'
                    : disabledCls
                }
                title={`Date${requiredMark}`}
                role={isMine ? 'button' : undefined}
                onClick={handleClick}
              >
                <div className="flex w-full items-center gap-2 text-status-completed">
                  <MaterialIcon name="calendar_today" size={18} />
                  <span style={{ fontFamily, fontSize }} className="font-semibold">
                    {value}
                  </span>
                  <MaterialIcon name="check_circle" size={18} className="ml-auto" />
                </div>
              </div>
            </div>
          )
        }

        if (f.type === 'initials') {
          const value = f.prefill_value && f.prefill_value.trim() !== '' ? f.prefill_value : initials
          return (
            <div key={`nf-${docItem.id}-${idx}`} className="absolute" style={style}>
              <div
                className={isMine ? interactiveCls : disabledCls}
                title={`Initials${requiredMark}`}
                role={isMine ? 'button' : undefined}
                onClick={handleClick}
              >
                {header}
                <div style={{ fontFamily, fontSize }} className="flex h-full w-full items-center justify-center text-on-surface">
                  {value || '—'}
                </div>
                {isMine ? (
                  <div className="absolute bottom-0.5 left-0 right-0 text-center text-[10px] text-secondary opacity-0 transition-opacity group-hover:opacity-100">
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
            <div key={`nf-${docItem.id}-${idx}`} className="absolute" style={style}>
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
                  <div className="absolute bottom-0.5 left-0 right-0 text-center text-[10px] text-secondary opacity-0 transition-opacity group-hover:opacity-100">
                    Click to preview
                  </div>
                ) : null}
              </div>
            </div>
          )
        }

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
                defaultValue={f.prefill_value || fieldValues[f.id || ''] || ''}
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
                <div className="absolute bottom-0.5 left-0 right-0 text-center text-[10px] text-secondary opacity-0 transition-opacity group-hover:opacity-100">
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
      currentUserId,
      envelope.fields,
      fieldValues,
      pageDims,
      positionCoordinateSpace,
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
              className="absolute cursor-move rounded-md border-2 border-status-your-turn bg-white/90 shadow"
              style={{
                left: draftPlacement.x,
                top: draftPlacement.y,
                width: draftPlacement.width,
                height: draftPlacement.height,
              }}
              onMouseDown={(e) => {
                e.stopPropagation()
                setIsDraggingDraft(true)
                const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
                setDragOffset({
                  x: (e.clientX - rect.left) / scale,
                  y: (e.clientY - rect.top) / scale,
                })
              }}
              onMouseUp={() => setIsDraggingDraft(false)}
              onMouseLeave={() => setIsDraggingDraft(false)}
              onMouseMove={(e) => {
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
      <div className={cn('flex flex-1 items-center justify-center bg-surface-dim p-8', className)}>
        <PdfLoadingIndicator label="Initializing PDF viewer…" />
      </div>
    )
  }

  const PdfDocument = pdf.Document
  const PdfPage = pdf.Page

  return (
    <div
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

      <div className="flex flex-col items-center gap-8 p-8">
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
            <div key={docItem.id} className="flex w-full max-w-[850px] flex-col items-center gap-8">
              {!pdfLoadedByDocId[docItem.id] ? (
                <PdfLoadingIndicator label="Loading document…" />
              ) : null}

              <PdfDocument
                className="flex w-full flex-col items-center gap-8"
                file={pdfFileByDocumentId[docItem.document]}
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
                loading={<PdfLoadingIndicator label="Loading document…" />}
              >
                {Array.from({ length: pageDims[docItem.id]?.numPages || 1 }, (_, i) => i + 1).map((pageNo) => (
                  <div
                    key={`${docItem.id}-${pageNo}`}
                    className="relative w-fit max-w-full scroll-mt-4"
                    data-signing-page={pagesBefore + pageNo}
                    style={{
                      transform: `scale(${scale})`,
                      transformOrigin: 'top center',
                    }}
                    ref={setPageContainerRef(docItem.id, pageNo)}
                  >
                    <div className="relative overflow-hidden bg-white shadow-xl ring-1 ring-black/5">
                      <PdfPage
                        pageNumber={pageNo}
                        renderAnnotationLayer={false}
                        renderTextLayer={false}
                        className="block w-fit max-w-full"
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
