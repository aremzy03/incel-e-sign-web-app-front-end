'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Document as PDFDocument, Page } from 'react-pdf'
import '@/lib/pdf-worker'
import { AddTextOp, Document, PdfPageSize } from '@/lib/api/documents'
import { PdfLoadingIndicator } from '@/components/pdf/PdfLoadingIndicator'
import { getCachedAccessToken } from '@/lib/auth-session-cache'
import {
  getDocumentFileUrlForViewer,
  getDocumentViewerRevisionKey,
  getPdfJsDocumentOptions,
} from '@/lib/url'
import { clampPdfFrame, pdfPointsToCssStyle } from '@/lib/pdf-edit/geometry'
import { defaultTextOp, DEFAULT_FONT_SIZE, DEFAULT_TEXT_WIDTH, textLineHeight } from '@/lib/pdf-edit/fonts'
import { TextBox } from './text-box'

interface TextEditViewerProps {
  document: Document
  pages: PdfPageSize[]
  ops: AddTextOp[]
  selectedId: string | null
  zoom: number
  onSelect: (opId: string | null) => void
  onCreate: (op: AddTextOp) => void
  onChange: (opId: string, patch: Partial<AddTextOp>) => void
  onDelete: (opId: string) => void
}

export function TextEditViewer({
  document,
  pages,
  ops,
  selectedId,
  zoom,
  onSelect,
  onCreate,
  onChange,
  onDelete,
}: TextEditViewerProps) {
  const fileUrl = getDocumentFileUrlForViewer(document)
  const revision = getDocumentViewerRevisionKey(document)
  const accessToken = getCachedAccessToken() ?? undefined
  const file = useMemo(() => ({ url: fileUrl }), [fileUrl, revision])
  const options = useMemo(
    () => getPdfJsDocumentOptions(fileUrl, { accessToken }),
    [fileUrl, accessToken],
  )
  const [cssSizes, setCssSizes] = useState<Record<number, { width: number; height: number }>>({})
  const [fitWidth, setFitWidth] = useState(0)
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({})
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = containerRef.current
    if (!node) return
    const measureContainer = () => {
      const styles = getComputedStyle(node)
      const pad = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight)
      const next = Math.max(320, node.clientWidth - pad)
      setFitWidth((current) => (Math.abs(current - next) < 1 ? current : next))
    }
    measureContainer()
    const observer = new ResizeObserver(measureContainer)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const pageCssWidth = fitWidth > 0 ? fitWidth * (zoom / 100) : 0

  const measure = (pageNumber: number) => {
    const node = pageRefs.current[pageNumber]
    if (!node) return
    const rect = node.getBoundingClientRect()
    setCssSizes((current) => {
      const previous = current[pageNumber]
      if (previous && Math.abs(previous.width - rect.width) < 0.5 && Math.abs(previous.height - rect.height) < 0.5) {
        return current
      }
      return { ...current, [pageNumber]: { width: rect.width, height: rect.height } }
    })
  }

  return (
    <div ref={containerRef} className="pdf-canvas-scroll-area-editor h-full min-h-0 w-full overflow-auto">
      <PDFDocument
        className="mx-auto flex w-max min-w-full flex-col items-center gap-8"
        key={revision}
        file={file}
        options={options}
        loading={<PdfLoadingIndicator label="Loading document…" />}
        error={<p className="text-body-sm text-error">This file couldn’t be opened as a PDF.</p>}
      >
        {pageCssWidth > 0 ? (
          pages.map((page) => {
          const css = cssSizes[page.page]
          const metrics = css
            ? {
                pageWidthPt: page.width,
                pageHeightPt: page.height,
                pageCssWidth: css.width,
                pageCssHeight: css.height,
              }
            : null
          const pageOps = ops.filter((op) => op.page === page.page)
          return (
            <div
              key={page.page}
              ref={(node) => {
                pageRefs.current[page.page] = node
              }}
              className="relative bg-white shadow-xl ring-1 ring-black/5"
              style={{ width: pageCssWidth || undefined }}
            >
              <Page
                pageNumber={page.page}
                width={pageCssWidth || page.width}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                onRenderSuccess={() => measure(page.page)}
              />
              <div
                className="absolute inset-0"
                onClick={(event) => {
                  if (!metrics || event.target !== event.currentTarget) return
                  const rect = event.currentTarget.getBoundingClientRect()
                  const points = clampPdfFrame(
                    {
                      x: ((event.clientX - rect.left) / rect.width) * page.width,
                      y: ((event.clientY - rect.top) / rect.height) * page.height,
                      width: DEFAULT_TEXT_WIDTH,
                      height: textLineHeight(DEFAULT_FONT_SIZE),
                    },
                    page.width,
                    page.height,
                  )
                  onSelect(null)
                  onCreate(
                    defaultTextOp({
                      page: page.page,
                      x: points.x,
                      y: points.y,
                      pageWidth: page.width,
                      pageHeight: page.height,
                    }),
                  )
                }}
              >
                {metrics
                  ? pageOps.map((op) => (
                      <TextBox
                        key={op.opId}
                        op={op}
                        selected={op.opId === selectedId}
                        css={pdfPointsToCssStyle(op, metrics)}
                        metrics={metrics}
                        onSelect={() => onSelect(op.opId)}
                        onChange={(patch) => onChange(op.opId, patch)}
                        onCommitGeometry={(patch) => onChange(op.opId, patch)}
                        onDelete={() => onDelete(op.opId)}
                      />
                    ))
                  : null}
              </div>
            </div>
          )
        })
        ) : (
          <PdfLoadingIndicator label="Preparing page…" />
        )}
      </PDFDocument>
    </div>
  )
}
