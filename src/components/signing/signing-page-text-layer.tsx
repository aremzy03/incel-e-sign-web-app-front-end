'use client'

import type { AddTextOp } from '@/lib/api/documents'
import { defaultTextOp, DEFAULT_FONT_SIZE, DEFAULT_TEXT_WIDTH, textLineHeight } from '@/lib/pdf-edit/fonts'
import { clampPdfFrame, pdfPointsToCssStyle } from '@/lib/pdf-edit/geometry'
import type { PageDimEntry } from '@/hooks/signing/types'
import { TextBox } from '@/components/pdf-edit/text-box'

interface SigningPageTextLayerProps {
  pageNo: number
  ops: AddTextOp[]
  dims?: PageDimEntry
  selectedId: string | null
  placing: boolean
  pointerScale: number
  onSelect: (opId: string | null) => void
  onCreate: (op: AddTextOp) => void
  onChange: (opId: string, patch: Partial<AddTextOp>) => void
  onDelete: (opId: string) => void
}

export function SigningPageTextLayer({
  pageNo,
  ops,
  dims,
  selectedId,
  placing,
  pointerScale,
  onSelect,
  onCreate,
  onChange,
  onDelete,
}: SigningPageTextLayerProps) {
  if (!dims?.widthPt || !dims.heightPt || !dims.widthPx || !dims.heightPx) return null
  const metrics = {
    pageWidthPt: dims.widthPt,
    pageHeightPt: dims.heightPt,
    pageCssWidth: dims.widthPx,
    pageCssHeight: dims.heightPx,
  }

  return (
    <div
      className={placing ? 'pointer-events-auto absolute inset-0 cursor-text' : 'pointer-events-none absolute inset-0'}
      onClick={(event) => {
        if (!placing || event.target !== event.currentTarget) return
        const rect = event.currentTarget.getBoundingClientRect()
        const points = clampPdfFrame(
          {
            x: ((event.clientX - rect.left) / rect.width) * dims.widthPt,
            y: ((event.clientY - rect.top) / rect.height) * dims.heightPt,
            width: DEFAULT_TEXT_WIDTH,
            height: textLineHeight(DEFAULT_FONT_SIZE),
          },
          dims.widthPt,
          dims.heightPt,
        )
        onSelect(null)
        onCreate(
          defaultTextOp({
            page: pageNo,
            x: points.x,
            y: points.y,
            pageWidth: dims.widthPt,
            pageHeight: dims.heightPt,
          }),
        )
      }}
    >
      {ops.map((op) => (
        <div key={op.opId} className="pointer-events-auto">
          <TextBox
            op={op}
            selected={op.opId === selectedId}
            css={pdfPointsToCssStyle(op, metrics)}
            metrics={metrics}
            pointerScale={pointerScale}
            onSelect={() => onSelect(op.opId)}
            onChange={(patch) => onChange(op.opId, patch)}
            onCommitGeometry={(patch) => onChange(op.opId, patch)}
            onDelete={() => onDelete(op.opId)}
          />
        </div>
      ))}
    </div>
  )
}
