import type { Position, SignerDocumentPosition } from '@/lib/api/envelopes'

/** Default US Letter page dimensions in PDF points (react-pdf viewport at scale 1). */
export const DEFAULT_PAGE_WIDTH_PT = 612
export const DEFAULT_PAGE_HEIGHT_PT = 792

const CSS_PX_TO_POINTS = 72 / 96
const POINTS_TO_CSS_PX = 96 / 72

/**
 * Heuristic aligned with the sign page: values much larger than the page were
 * stored as viewport overlay coordinates (create / edit canvas flow).
 */
export function positionLooksLikeViewportPixels(
  position: Pick<Position, 'x' | 'y' | 'width' | 'height'>,
  pageWidthPt = DEFAULT_PAGE_WIDTH_PT,
  pageHeightPt = DEFAULT_PAGE_HEIGHT_PT,
): boolean {
  const { x, y, width, height } = position
  return (
    x > pageWidthPt * 2 ||
    y > pageHeightPt * 2 ||
    width > pageWidthPt * 2 ||
    height > pageHeightPt * 2
  )
}

/** Convert PDF points (72 dpi) to viewport overlay units used by the field canvas. */
export function pdfPointsToViewportPosition(position: Position): Position {
  const toViewport = (value: number) => value * POINTS_TO_CSS_PX
  return {
    page: position.page,
    x: toViewport(position.x),
    y: toViewport(position.y),
    width: toViewport(position.width),
    height: toViewport(position.height),
  }
}

/**
 * Positions saved via the broken edit flow were shrunk by cssPxToPoints (~0.75×).
 * Detect likely-corrupted boxes and restore viewport coordinates.
 */
export function maybeRepairShrunkViewportPosition(position: Position): Position {
  const restore = (value: number) => value / CSS_PX_TO_POINTS
  const restoredWidth = restore(position.width)
  const restoredHeight = restore(position.height)

  // Default signature box is 116.8 × 36.8 in viewport units; corrupted saves land near 87.6 × 27.6.
  const looksShrunk =
    position.width > 0 &&
    position.height > 0 &&
    position.width < 116.8 * 0.85 &&
    position.height < 36.8 * 0.85 &&
    Math.abs(restoredWidth - 116.8) < 2 &&
    Math.abs(restoredHeight - 36.8) < 2 &&
    !positionLooksLikeViewportPixels(position)

  if (!looksShrunk) {
    return position
  }

  return {
    page: position.page,
    x: restore(position.x),
    y: restore(position.y),
    width: restoredWidth,
    height: restoredHeight,
  }
}

/**
 * Normalize a backend position for display/placement on the PDF field canvas.
 * Create/edit store react-pdf viewport coordinates — use directly after optional repair.
 */
export function backendPositionToViewport(position: Position): Position {
  return maybeRepairShrunkViewportPosition(position)
}

/**
 * Convert canvas field coordinates to the backend payload format (matches create page).
 */
export function viewportPositionToBackend(
  position: Pick<Position, 'page' | 'x' | 'y' | 'width' | 'height'>,
): Position {
  return {
    page: position.page,
    x: position.x,
    y: position.y,
    width: position.width,
    height: position.height,
  }
}

const DEFAULT_SIGNATURE_WIDTH = 116.8
const DEFAULT_SIGNATURE_HEIGHT = 36.8

function readNumeric(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

/** Normalize backend signer position entries (nested or flat shapes). */
export function normalizeSignerPositionEntry(
  entry: unknown,
): SignerDocumentPosition | null {
  if (!entry || typeof entry !== 'object') return null

  const raw = entry as Record<string, unknown>
  const nested =
    raw.position && typeof raw.position === 'object'
      ? (raw.position as Record<string, unknown>)
      : null
  const source = nested ?? raw

  const page = readNumeric(source.page ?? raw.page, 1)
  const x = readNumeric(source.x ?? raw.x)
  const y = readNumeric(source.y ?? raw.y)
  let width = readNumeric(source.width ?? raw.width)
  let height = readNumeric(source.height ?? raw.height)

  if (width <= 0) width = DEFAULT_SIGNATURE_WIDTH
  if (height <= 0) height = DEFAULT_SIGNATURE_HEIGHT

  const signerId = String(
    raw.signer_id ?? raw.signer ?? raw.user_id ?? raw.assigned_signer ?? '',
  ).trim()

  if (!signerId) return null

  return {
    signer_id: signerId,
    position: { page, x, y, width, height },
  }
}

export function normalizeSignerPositionEntries(
  entries: unknown,
): SignerDocumentPosition[] {
  if (!Array.isArray(entries)) return []
  return entries
    .map(normalizeSignerPositionEntry)
    .filter((entry): entry is SignerDocumentPosition => entry !== null)
}
