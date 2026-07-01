import {
  backendPositionToViewport,
  ensurePdfPointsPosition,
  fieldPositionToBackendPdfPoints,
  maybeRepairShrunkViewportPosition,
  normalizeSignerPositionEntry,
  positionLooksLikeViewportPixels,
  positionStoredAsPdfPoints,
  viewportOverlayToPdfPoints,
  viewportOverlayToPixelStyle,
  viewportPositionToBackend,
} from '../field-geometry'
import { normalizeEnvelopeRecipients } from '@/lib/api/envelopes'

describe('field-geometry', () => {
  it('converts viewport overlay to PDF points on envelope create', () => {
    const pdf = viewportPositionToBackend({
      page: 1,
      x: 120,
      y: 400,
      width: 140,
      height: 44,
    })

    expect(pdf.page).toBe(1)
    expect(pdf.x).toBeCloseTo(100, 1)
    expect(pdf.y).toBeCloseTo(400 / 1.2, 1)
    expect(pdf.width).toBeCloseTo(140 / 1.2, 1)
    expect(pdf.height).toBeCloseTo(44 / 1.2, 1)
  })

  it('loads PDF points back onto the create editor canvas', () => {
    const pdf = { page: 1, x: 100, y: 400 / 1.2, width: 140 / 1.2, height: 44 / 1.2 }
    const viewport = backendPositionToViewport(pdf)

    expect(viewport.page).toBe(1)
    expect(viewport.x).toBeCloseTo(120, 5)
    expect(viewport.y).toBeCloseTo(400, 5)
    expect(viewport.width).toBeCloseTo(140, 5)
    expect(viewport.height).toBeCloseTo(44, 5)
  })

  it('detects viewport-scale coordinates', () => {
    expect(
      positionLooksLikeViewportPixels({
        x: 1500,
        y: 100,
        width: 200,
        height: 40,
      }),
    ).toBe(true)
  })

  it('repairs positions saved with cssPxToPoints shrink', () => {
    const repaired = maybeRepairShrunkViewportPosition({
      page: 1,
      x: 75,
      y: 50,
      width: 87.6,
      height: 27.6,
    })

    expect(repaired.x).toBeCloseTo(100, 1)
    expect(repaired.y).toBeCloseTo(66.67, 1)
    expect(repaired.width).toBeCloseTo(116.8, 1)
    expect(repaired.height).toBeCloseTo(36.8, 1)
  })

  it('keeps legacy viewport overlay positions unchanged on editor load', () => {
    const position = {
      page: 1,
      x: 120,
      y: 400,
      width: 140,
      height: 44,
    }

    expect(backendPositionToViewport(position)).toEqual(position)
  })

  it('detects PDF points from envelope create payload', () => {
    expect(
      positionStoredAsPdfPoints({ page: 1, x: 10, y: 20, width: 30, height: 40 }),
    ).toBe(true)
  })

  it('maps create editor coords onto sign canvas at scale 1', () => {
    const createHeightPx = 792 * 1.2
    const signHeightPx = 792
    const dims = {
      widthPt: 612,
      heightPt: 792,
      widthPx: 612,
      heightPx: signHeightPx,
    }
    const position = { page: 1, x: 120, y: 400, width: 140, height: 44 }

    expect(positionStoredAsPdfPoints(position)).toBe(false)
    expect(viewportOverlayToPixelStyle(position, dims)).toEqual({
      left: 120 * (612 / (612 * 1.2)),
      top: 400 * (signHeightPx / createHeightPx),
      width: 140 * (612 / (612 * 1.2)),
      height: 44 * (signHeightPx / createHeightPx),
    })
  })

  it('maps wizard viewport 1:1 when sign canvas matches editor reference size', () => {
    const dims = {
      widthPt: 612,
      heightPt: 792,
      widthPx: 612 * 1.2,
      heightPx: 792 * 1.2,
    }
    const position = { page: 1, x: 120, y: 400, width: 140, height: 44 }

    expect(viewportOverlayToPixelStyle(position, dims)).toEqual({
      left: 120,
      top: 400,
      width: 140,
      height: 44,
    })
  })

  it('converts viewport overlay to PDF points for backend sign API', () => {
    const position = { page: 1, x: 120, y: 400, width: 140, height: 44 }
    const pdf = viewportOverlayToPdfPoints(position)

    expect(pdf.x).toBeCloseTo(100, 1)
    expect(pdf.y).toBeCloseTo(400 / 1.2, 1)
    expect(pdf.width).toBeCloseTo(140 / 1.2, 1)
    expect(pdf.height).toBeCloseTo(44 / 1.2, 1)
  })

  it('ensurePdfPointsPosition is idempotent for PDF points and converts viewport', () => {
    const viewport = { page: 1, x: 46.4, y: 701.19, width: 140, height: 44 }
    const pdf = ensurePdfPointsPosition(viewport)
    expect(pdf.width).toBeCloseTo(140 / 1.2, 1)
    expect(pdf.y).toBeCloseTo(701.19 / 1.2, 1)
    expect(ensurePdfPointsPosition(pdf).width).toBeCloseTo(pdf.width, 5)
    expect(ensurePdfPointsPosition(pdf).y).toBeCloseTo(pdf.y, 5)
  })

  it('converts editor canvas coords using the active render scale', () => {
    const viewport = { page: 1, x: 252, y: 1262, width: 252, height: 79.2 }
    const pdf = fieldPositionToBackendPdfPoints(viewport, 1.8)
    expect(pdf.x).toBeCloseTo(140, 1)
    expect(pdf.y).toBeCloseTo(1262 / 1.8, 1)
    expect(pdf.width).toBeCloseTo(252 / 1.8, 1)
    expect(pdf.height).toBeCloseTo(79.2 / 1.8, 1)
  })

  it('treats wizard-sized positions as viewport overlay in auto mode', () => {
    const position = { page: 1, x: 100, y: 100, width: 150, height: 40 }

    expect(positionStoredAsPdfPoints(position)).toBe(false)
  })

  it('keeps PDF-point dimensions from the API without upgrading to viewport size', () => {
    expect(
      normalizeSignerPositionEntry({
        signer_id: 'user-1',
        page: '1',
        x: '100',
        y: '200',
        width: '116.8',
        height: '36.8',
      }),
    ).toEqual({
      signer_id: 'user-1',
      position: {
        page: 1,
        x: 100,
        y: 200,
        width: 116.8,
        height: 36.8,
      },
    })
  })

  it('normalizes nested position objects', () => {
    expect(
      normalizeSignerPositionEntry({
        signer_id: 'user-1',
        position: { page: 1, x: 10, y: 20, width: 100, height: 40 },
      }),
    ).toEqual({
      signer_id: 'user-1',
      position: { page: 1, x: 10, y: 20, width: 100, height: 40 },
    })
  })

  it('applies default signature dimensions when width/height are missing', () => {
    const entry = normalizeSignerPositionEntry({
      signer_id: 'user-2',
      page: '2',
      x: 30,
      y: 40,
      width: 0,
      height: 0,
    })

    expect(entry?.position.width).toBe(140)
    expect(entry?.position.height).toBe(44)
  })
})

describe('normalizeEnvelopeRecipients', () => {
  it('falls back to signing_order when recipients is empty', () => {
    const recipients = normalizeEnvelopeRecipients({
      recipients: [],
      signing_order: [
        { signer_id: 'user-1', order: 1, email: 'a@example.com', name: 'Alice' },
        { signer_id: 'user-2', order: 2, email: 'b@example.com', name: 'Bob' },
      ],
    })

    expect(recipients).toHaveLength(2)
    expect(recipients[0]).toMatchObject({ id: 'user-1', email: 'a@example.com', name: 'Alice', order: 1 })
    expect(recipients[1]).toMatchObject({ id: 'user-2', email: 'b@example.com', name: 'Bob', order: 2 })
  })

  it('enriches signing_order entries from signatures metadata', () => {
    const recipients = normalizeEnvelopeRecipients({
      signing_order: [{ signer_id: 'user-1', order: 1 }],
      signatures: [
        {
          id: 'sig-1',
          signer: 'user-1',
          signer_email: 'alice@example.com',
          signer_name: 'Alice Smith',
          status: 'pending',
          signing_order: 1,
          created_at: '',
          updated_at: '',
        },
      ],
    })

    expect(recipients[0]).toMatchObject({
      id: 'user-1',
      email: 'alice@example.com',
      name: 'Alice Smith',
      order: 1,
    })
  })
})
