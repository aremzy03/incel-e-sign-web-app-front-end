import { pageCssBoxToPdfPoints, pdfPointsToPageCssBox, clampPdfFrame } from '../geometry'

describe('pdf edit geometry', () => {
  it('converts an A4 top-left box with the page width, not letter width', () => {
    const pageWidthPt = 595
    const pageHeightPt = 842
    const pageCssWidth = (595 / 1) * 1.2
    const pageCssHeight = (842 / 1) * 1.2
    const points = pageCssBoxToPdfPoints(
      { x: 0, y: 0, width: 100, height: 20 },
      { pageWidthPt, pageHeightPt, pageCssWidth, pageCssHeight },
    )
    expect(points.x).toBeCloseTo(0, 5)
    expect(points.y).toBeCloseTo(0, 5)
    expect(points.width).toBeCloseTo(100 * (595 / pageCssWidth), 5)
    expect(points.width).not.toBeCloseTo(100 * (612 / pageCssWidth), 1)
  })

  it('round-trips CSS through points at zoom 1.5', () => {
    const metrics = {
      pageWidthPt: 595,
      pageHeightPt: 842,
      pageCssWidth: 595 * 1.5,
      pageCssHeight: 842 * 1.5,
    }
    const original = { x: 40, y: 80, width: 120, height: 36 }
    const points = pageCssBoxToPdfPoints(original, metrics)
    const back = pdfPointsToPageCssBox(points, metrics)
    expect(Math.abs(back.x - original.x)).toBeLessThan(0.5)
    expect(Math.abs(back.y - original.y)).toBeLessThan(0.5)
    expect(Math.abs(back.width - original.width)).toBeLessThan(0.5)
    expect(Math.abs(back.height - original.height)).toBeLessThan(0.5)
  })

  it('clamps a box dragged past the right edge to the page width', () => {
    const clamped = clampPdfFrame({ x: 500, y: 10, width: 180, height: 20 }, 595, 842)
    expect(clamped.x + clamped.width).toBeCloseTo(595, 5)
    expect(clamped.x).toBeGreaterThanOrEqual(0)
  })
})
