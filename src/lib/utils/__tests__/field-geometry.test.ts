import {
  backendPositionToViewport,
  maybeRepairShrunkViewportPosition,
  normalizeSignerPositionEntry,
  positionLooksLikeViewportPixels,
  viewportPositionToBackend,
} from '../field-geometry'
import { normalizeEnvelopeRecipients } from '@/lib/api/envelopes'

describe('field-geometry', () => {
  it('passes viewport coordinates through unchanged on save', () => {
    expect(
      viewportPositionToBackend({
        page: 1,
        x: 120,
        y: 80,
        width: 116.8,
        height: 36.8,
      }),
    ).toEqual({
      page: 1,
      x: 120,
      y: 80,
      width: 116.8,
      height: 36.8,
    })
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

  it('keeps normal viewport positions unchanged on load', () => {
    const position = {
      page: 1,
      x: 120,
      y: 80,
      width: 116.8,
      height: 36.8,
    }

    expect(backendPositionToViewport(position)).toEqual(position)
  })

  it('normalizes flat signer position entries from the API', () => {
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

    expect(entry?.position.width).toBe(116.8)
    expect(entry?.position.height).toBe(36.8)
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
