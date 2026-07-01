import type { DocumentWithPositions, Position, SignerDocumentPosition } from '@/lib/api/envelopes'

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
export function maybeRepairShrunkViewportPosition<
  T extends Pick<Position, 'x' | 'y' | 'width' | 'height'> & { page?: number },
>(position: T): T {
  const restore = (value: number) => value / CSS_PX_TO_POINTS
  const restoredWidth = restore(position.width)
  const restoredHeight = restore(position.height)

  const looksShrunk =
    position.width > 0 &&
    position.height > 0 &&
    position.width < LEGACY_SHRUNK_SIGNATURE_WIDTH * 0.85 &&
    position.height < LEGACY_SHRUNK_SIGNATURE_HEIGHT * 0.85 &&
    Math.abs(restoredWidth - LEGACY_SHRUNK_SIGNATURE_WIDTH) < 2 &&
    Math.abs(restoredHeight - LEGACY_SHRUNK_SIGNATURE_HEIGHT) < 2 &&
    !positionLooksLikeViewportPixels(position)

  if (!looksShrunk) {
    return position
  }

  return {
    ...position,
    x: restore(position.x),
    y: restore(position.y),
    width: restoredWidth,
    height: restoredHeight,
  }
}

/**
 * Convert PDF points from the API back onto the create/edit canvas (react-pdf scale 1.2).
 */
export function pdfPointsToViewportOverlay(
  position: Position,
  pageWidthPt = DEFAULT_PAGE_WIDTH_PT,
  pageHeightPt = DEFAULT_PAGE_HEIGHT_PT,
  editorScale = CREATE_EDITOR_VIEWPORT_SCALE,
): Position {
  const refWidthPx = pageWidthPt * editorScale
  const refHeightPx = pageHeightPt * editorScale
  const scaleX = refWidthPx / pageWidthPt
  const scaleY = refHeightPx / pageHeightPt

  return {
    page: position.page,
    x: position.x * scaleX,
    y: position.y * scaleY,
    width: position.width * scaleX,
    height: position.height * scaleY,
  }
}

/**
 * Normalize a backend position for the create/edit field canvas.
 * New envelopes store PDF points; legacy drafts may still have viewport overlay units.
 */
export function backendPositionToViewport(position: Position): Position {
  const repaired = maybeRepairShrunkViewportPosition(position)
  if (positionStoredAsPdfPoints(repaired)) {
    return pdfPointsToViewportOverlay(repaired)
  }
  return repaired
}

/**
 * Convert create/edit canvas coordinates to PDF points for POST /envelopes/create/.
 */
export function viewportPositionToBackend(
  position: Pick<Position, 'page' | 'x' | 'y' | 'width' | 'height'>,
): Position {
  return fieldPositionToBackendPdfPoints(position)
}

/** Ensure envelope API payload positions are PDF points (idempotent). */
export function ensurePdfPointsPosition(position: Position): Position {
  if (positionStoredAsPdfPoints(position)) {
    return position
  }
  return viewportOverlayToPdfPoints(position)
}

/**
 * Convert editor canvas field coordinates to PDF points for API payloads.
 * @param renderScale react-pdf render scale when the field was placed (default: create wizard 1.2).
 */
export function fieldPositionToBackendPdfPoints(
  position: Pick<Position, 'page' | 'x' | 'y' | 'width' | 'height'>,
  renderScale = CREATE_EDITOR_VIEWPORT_SCALE,
): Position {
  return viewportOverlayToPdfPoints(
    position,
    DEFAULT_PAGE_WIDTH_PT,
    DEFAULT_PAGE_HEIGHT_PT,
    renderScale,
  )
}

export function normalizeDocumentsWithPositionsForApi(
  documents?: DocumentWithPositions[],
): DocumentWithPositions[] | undefined {
  if (!documents?.length) return documents

  return documents.map((doc) => ({
    ...doc,
    signer_document_positions: (doc.signer_document_positions ?? []).map((entry) => ({
      ...entry,
      position: ensurePdfPointsPosition(entry.position),
    })),
  }))
}

/** VerticalPDFViewer editor scale used on envelope create step 3. */
export const CREATE_EDITOR_VIEWPORT_SCALE = 1.2

/** Default signature field size on envelope create step 3 (matches handleFieldDrop). */
export const WIZARD_SIGNATURE_WIDTH = 140
export const WIZARD_SIGNATURE_HEIGHT = 44

/** Legacy shrunk viewport units from the broken cssPxToPoints save path. */
const LEGACY_SHRUNK_SIGNATURE_WIDTH = 116.8
const LEGACY_SHRUNK_SIGNATURE_HEIGHT = 36.8

/**
 * Map viewport overlay coordinates (saved by create/edit) onto the sign-page canvas.
 * react-pdf renders at `widthPt * scale` CSS pixels; do not apply an extra 96/72 factor.
 */
export function viewportOverlayToPixelStyle(
  position: Position,
  dims: {
    widthPt: number
    heightPt: number
    widthPx: number
    heightPx: number
  },
  editorScale = CREATE_EDITOR_VIEWPORT_SCALE,
): { left: number; top: number; width: number; height: number } | null {
  if (!dims.widthPt || !dims.heightPt || !dims.widthPx || !dims.heightPx) return null

  const viewport = maybeRepairShrunkViewportPosition(position)
  const refWidthPx = dims.widthPt * editorScale
  const refHeightPx = dims.heightPt * editorScale
  const scaleX = dims.widthPx / refWidthPx
  const scaleY = dims.heightPx / refHeightPx

  const leftPx = viewport.x * scaleX
  const topPx = viewport.y * scaleY
  const widthPx = viewport.width * scaleX
  const heightPx = viewport.height * scaleY

  if (!widthPx || !heightPx) return null

  return {
    left: Math.max(0, Math.min(leftPx, dims.widthPx - widthPx)),
    top: Math.max(0, Math.min(topPx, dims.heightPx - heightPx)),
    width: widthPx,
    height: heightPx,
  }
}

/**
 * Convert create/edit viewport overlay coordinates to PDF points for backend flattening.
 * Inverse of mapping from editor canvas (react-pdf scale 1.2) to PDF user space.
 */
export function viewportOverlayToPdfPoints(
  position: Position,
  pageWidthPt = DEFAULT_PAGE_WIDTH_PT,
  pageHeightPt = DEFAULT_PAGE_HEIGHT_PT,
  editorScale = CREATE_EDITOR_VIEWPORT_SCALE,
): Position {
  const viewport = maybeRepairShrunkViewportPosition(position)
  const refWidthPx = pageWidthPt * editorScale
  const refHeightPx = pageHeightPt * editorScale
  const scaleX = pageWidthPt / refWidthPx
  const scaleY = pageHeightPt / refHeightPx

  return {
    page: viewport.page,
    x: viewport.x * scaleX,
    y: viewport.y * scaleY,
    width: viewport.width * scaleX,
    height: viewport.height * scaleY,
  }
}

/**
 * Detect coordinates stored as PDF points (legacy) vs viewport overlay pixels (create wizard).
 */
export function positionStoredAsPdfPoints(
  position: Pick<Position, 'x' | 'y' | 'width' | 'height'> & { page?: number },
  pageWidthPt = DEFAULT_PAGE_WIDTH_PT,
  pageHeightPt = DEFAULT_PAGE_HEIGHT_PT,
): boolean {
  if (positionLooksLikeViewportPixels(position, pageWidthPt, pageHeightPt)) {
    return false
  }

  const repaired = maybeRepairShrunkViewportPosition(position)
  const { x, y, width, height } = repaired

  // Wizard default box is 140×44 in viewport overlay; PDF equivalent is ~117×37.
  const looksLikeWizardViewportBox =
    width >= WIZARD_SIGNATURE_WIDTH * 0.95 ||
    height >= WIZARD_SIGNATURE_HEIGHT * 0.95
  if (looksLikeWizardViewportBox) {
    return false
  }

  return (
    x >= 0 &&
    y >= 0 &&
    width > 0 &&
    height > 0 &&
    x + width <= pageWidthPt * 1.02 &&
    y + height <= pageHeightPt * 1.02
  )
}

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

  if (width <= 0) width = WIZARD_SIGNATURE_WIDTH
  if (height <= 0) height = WIZARD_SIGNATURE_HEIGHT

  // Legacy API entries used 116.8×36.8 as fractional viewport units — expand to 140×44.
  // Do not upgrade when those dimensions are valid PDF points from envelope create (~117×37).
  if (
    Math.abs(width - LEGACY_SHRUNK_SIGNATURE_WIDTH) < 0.01 &&
    Math.abs(height - LEGACY_SHRUNK_SIGNATURE_HEIGHT) < 0.01 &&
    !positionStoredAsPdfPoints({ page, x, y, width, height })
  ) {
    width = WIZARD_SIGNATURE_WIDTH
    height = WIZARD_SIGNATURE_HEIGHT
  }

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
