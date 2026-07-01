import type { CSSProperties } from 'react'
import type { Position } from '@/lib/api/envelopes'
import {
  maybeRepairShrunkViewportPosition,
  positionStoredAsPdfPoints,
  viewportOverlayToPixelStyle,
} from '@/lib/utils/field-geometry'
import type { Envelope, EnvelopeSignature, EnvelopeSigningOrderEntry, EnvelopeCurrentSigner, EnvelopeRecipient } from '@/lib/api/envelopes'

export type SigningViewStep = 'landing' | 'sign'
export type SigningViewStatus = 'waiting' | 'processing' | 'complete' | 'declined' | 'cancelled'

export type SigningView =
  | { kind: 'step'; step: SigningViewStep }
  | { kind: 'status'; status: SigningViewStatus }

export interface SignerDocumentPositionEntry {
  signer_id: string
  position: Position
  document_id: string
}

export interface SigningOrderEntry {
  signer_id: string
  order: number
  signed_at?: string
  status?: 'pending' | 'processing' | 'signed' | 'rejected'
}

export interface SigningEnvelopeField {
  id?: string
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
}

export interface SigningEnvelopeResponse {
  id: string
  name?: string
  status: string
  signing_order: SigningOrderEntry[] | EnvelopeSigningOrderEntry[]
  fields?: SigningEnvelopeField[]
  creator?: { id?: string; full_name?: string; email?: string }
  decline_message?: string
  document?: string | { file_url: string }
  current_signer?: EnvelopeCurrentSigner | null
  signatures?: EnvelopeSignature[]
  recipients?: EnvelopeRecipient[]
  is_self_sign?: boolean
}

export interface PageDimEntry {
  widthPt: number
  heightPt: number
  widthPx: number
  heightPx: number
}

export type PageDimsByDoc = Record<
  string,
  Record<number, PageDimEntry> & { numPages?: number }
>

export function positionLooksLikeViewportPixels(
  x: number,
  y: number,
  w: number,
  h: number,
  widthPt: number,
  heightPt: number,
): boolean {
  return x > widthPt * 2 || y > heightPt * 2 || w > widthPt * 2 || h > heightPt * 2
}

export type PositionCoordinateSpace = 'viewport-overlay' | 'pdf-points' | 'auto'

export function positionToPixelStyle(
  position: Position,
  dims: PageDimEntry,
  options?: { coordinateSpace?: PositionCoordinateSpace },
): CSSProperties | null {
  if (!dims.widthPt || !dims.heightPt || !dims.widthPx || !dims.heightPx) return null

  const repaired = maybeRepairShrunkViewportPosition(position)
  const space = options?.coordinateSpace ?? 'auto'
  const usePdfPoints =
    space === 'pdf-points' ||
    (space === 'auto' && positionStoredAsPdfPoints(repaired, dims.widthPt, dims.heightPt))

  let style: CSSProperties | null
  if (usePdfPoints) {
    const scaleX = dims.widthPx / dims.widthPt
    const scaleY = dims.heightPx / dims.heightPt
    const widthPx = repaired.width * scaleX
    const heightPx = repaired.height * scaleY
    const leftPx = repaired.x * scaleX
    const topPx = repaired.y * scaleY
    if (!widthPx || !heightPx) return null
    style = {
      left: Math.max(0, Math.min(leftPx, dims.widthPx - widthPx)),
      top: Math.max(0, Math.min(topPx, dims.heightPx - heightPx)),
      width: widthPx,
      height: heightPx,
    }
  } else {
    style = viewportOverlayToPixelStyle(repaired, dims)
  }

  return style
}

export function formatSigningDate(d: Date, pattern?: string): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const mmm = d.toLocaleString('en', { month: 'short' })
  switch (pattern) {
    case 'MM/DD/YYYY':
      return `${mm}/${dd}/${yyyy}`
    case 'DD/MM/YYYY':
      return `${dd}/${mm}/${yyyy}`
    case 'YYYY/MM/DD':
      return `${yyyy}/${mm}/${dd}`
    case 'DD-MMM-YYYY':
      return `${dd}-${mmm}-${yyyy}`
    case 'YYYY-MM-DD':
    default:
      return `${yyyy}-${mm}-${dd}`
  }
}

export function getInitialsFromName(full?: string): string {
  if (!full) return ''
  const parts = full.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}
