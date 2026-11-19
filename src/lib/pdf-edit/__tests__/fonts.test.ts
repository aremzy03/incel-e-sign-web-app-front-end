import { DEFAULT_FONT_SIZE, DEFAULT_TEXT_WIDTH, fitTextFrame, textLineHeight } from '../fonts'

const measure = (sample: string) => sample.length * 6

describe('fitTextFrame', () => {
  it('starts at the smaller width and one line tall', () => {
    const frame = fitTextFrame({
      text: '',
      fontSize: DEFAULT_FONT_SIZE,
      minWidth: DEFAULT_TEXT_WIDTH,
      maxWidth: 500,
      pad: 4,
      measure,
    })
    expect(DEFAULT_TEXT_WIDTH).toBe(108)
    expect(DEFAULT_FONT_SIZE).toBe(11)
    expect(frame.width).toBe(108)
    expect(frame.height).toBe(textLineHeight(11))
  })

  it('widens as the line grows, then wraps and grows taller at the page edge', () => {
    const wide = fitTextFrame({
      text: 'a'.repeat(30),
      fontSize: 11,
      minWidth: 108,
      maxWidth: 500,
      pad: 4,
      measure,
    })
    expect(wide.width).toBe(30 * 6 + 4)
    expect(wide.height).toBe(textLineHeight(11))

    const wrapped = fitTextFrame({
      text: 'a'.repeat(30),
      fontSize: 11,
      minWidth: 108,
      maxWidth: 120,
      pad: 4,
      measure,
    })
    expect(wrapped.width).toBe(120)
    expect(wrapped.height).toBeGreaterThan(textLineHeight(11))
  })

  it('keeps a manually resized width and grows the height instead', () => {
    const frame = fitTextFrame({
      text: 'a'.repeat(40),
      fontSize: 11,
      minWidth: 108,
      maxWidth: 500,
      lockedWidth: 150,
      pad: 4,
      measure,
    })
    expect(frame.width).toBe(150)
    expect(frame.height).toBeGreaterThan(textLineHeight(11))
  })
})
