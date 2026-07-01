import { positionToPixelStyle } from '@/hooks/signing/types'

describe('positionToPixelStyle', () => {
  const editorDims = {
    widthPt: 612,
    heightPt: 792,
    widthPx: 612 * 1.2,
    heightPx: 792 * 1.2,
  }

  const signDims = {
    widthPt: 612,
    heightPt: 792,
    widthPx: 612,
    heightPx: 792,
  }

  it('uses viewport overlay coords when sign canvas matches editor reference', () => {
    const position = { page: 1, x: 120, y: 400, width: 140, height: 44 }
    const style = positionToPixelStyle(position, editorDims, { coordinateSpace: 'viewport-overlay' })

    expect(style).toEqual({
      left: 120,
      top: 400,
      width: 140,
      height: 44,
    })
  })

  it('scales Y from create editor (1.2) down to sign canvas (1.0)', () => {
    const position = { page: 1, x: 120, y: 400, width: 140, height: 44 }
    const style = positionToPixelStyle(position, signDims, { coordinateSpace: 'viewport-overlay' })

    expect(style?.left).toBeCloseTo(100, 1)
    expect(style?.top).toBeCloseTo(400 * (792 / (792 * 1.2)), 1)
    expect(style?.width).toBeCloseTo(140 * (612 / (612 * 1.2)), 1)
    expect(style?.height).toBeCloseTo(44 * (792 / (792 * 1.2)), 1)
  })

  it('maps PDF points from GET envelope onto sign canvas in auto mode', () => {
    const position = {
      page: 1,
      x: 100,
      y: 400 / 1.2,
      width: 140 / 1.2,
      height: 44 / 1.2,
    }
    const style = positionToPixelStyle(position, signDims, { coordinateSpace: 'auto' })

    expect(style?.left).toBeCloseTo(100, 1)
    expect(style?.top).toBeCloseTo(400 / 1.2, 1)
    expect(style?.width).toBeCloseTo(140 / 1.2, 1)
    expect(style?.height).toBeCloseTo(44 / 1.2, 1)
  })
})
