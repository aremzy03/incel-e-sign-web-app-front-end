/**
 * Fitting replacements into their slot (lib/pdf-edit/text-fit.ts), mirroring the
 * server's documents/services/text_fit.py, and finding slots on a page.
 */
import { fitText, findRunFits, wrapWords, type TextFit } from '@/lib/pdf-edit/text-fit'
import { buildTextRuns, type PdfTextItem } from '@/lib/pdf-edit/text-runs'

const measure = (text: string, size: number) => text.length * size * 0.5
const fit = (over: Partial<TextFit> = {}): TextFit => ({ left: 100, right: 200, bottom: 0, align: 'left', anchor: 100, ...over })

describe('fitText (same cases as the server tests)', () => {
  it('keeps text that fits at its size and anchor', () => {
    const layout = fitText('abcd', 10, 700, fit(), measure)
    expect(layout).toMatchObject({ mode: 'fit', size: 10 })
    expect(layout.lines[0]).toMatchObject({ text: 'abcd', x: 100, y: 700 })
  })

  it('pins right- and centre-aligned text at its end and middle', () => {
    expect(fitText('abcd', 10, 700, fit({ align: 'right', anchor: 200 }), measure).lines[0].x).toBe(180)
    expect(fitText('abcd', 10, 700, fit({ align: 'center', anchor: 150 }), measure).lines[0].x).toBe(140)
  })

  it('shrinks text that nearly fits', () => {
    const layout = fitText('a'.repeat(21), 10, 700, fit({ bottom: 690 }), measure)
    expect(layout.mode).toBe('shrink')
    expect(measure('a'.repeat(21), layout.size)).toBeLessThanOrEqual(100)
  })

  it('wraps much longer text when there is room below', () => {
    const layout = fitText('aaaa bbbb cccc dddd eeee ffff', 10, 700, fit({ right: 150, bottom: 600 }), measure)
    expect(layout.mode).toBe('wrap')
    expect(layout.lines.map((l) => [l.text, l.y])).toEqual([
      ['aaaa bbbb', 700],
      ['cccc dddd', 688],
      ['eeee ffff', 676],
    ])
  })

  it('shrinks to three quarters without room, then overflows', () => {
    const noRoom = fit({ right: 150, bottom: 699 })
    expect(fitText('a'.repeat(12), 10, 700, noRoom, measure).mode).toBe('shrink')
    expect(fitText('a'.repeat(30), 10, 700, noRoom, measure)).toMatchObject({ mode: 'overflow', overflow: true, size: 7.5 })
  })

  it('does not wrap a word wider than the slot', () => {
    expect(wrapWords(`short ${'x'.repeat(40)}`, 10, 100, measure)).toBeNull()
  })
})

const item = (str: string, x: number, y: number, width: number, size = 11): PdfTextItem => ({
  str,
  transform: [size, 0, 0, size, x, y],
  width,
  height: size,
  fontName: 'g_f1',
})
const VIEW = [0, 0, 612, 792]

describe('findRunFits', () => {
  it('stops at a table border and finds right-aligned figures in a column', () => {
    // The invoice's VALUE column: figures padded with spaces, right edges lined up, borders at 338 and 441.5.
    const rules = [
      [0, 338, 250, 330],
      [0, 441.5, 250, 330],
    ] as const
    const runs = buildTextRuns(
      1,
      [item('383,375.16', 364.7, 300, 50.1), item('624.84', 384.9, 274, 30.2), item('384,000.00', 365.8, 248, 50.4)],
      {},
      undefined,
      rules,
      VIEW,
    )!
    const fits = findRunFits(runs, rules, VIEW)
    const figure = fits[runs[0].runId]
    expect(figure.align).toBe('right')
    expect(figure.anchor).toBeCloseTo(414.8, 1)
    expect(figure.right).toBeCloseTo(441.5 - 2.2, 1)
    expect(figure.left).toBeCloseTo(338 + 2.2, 1)
  })

  it('stops before the next word on the line and wraps only down to the line below', () => {
    const runs = buildTextRuns(
      1,
      [item('Head Office:', 72, 640, 60), item('Branch Office:', 216, 640, 70), item('SD 12 Hexalix', 72, 627, 60)],
      {},
      undefined,
      [],
      VIEW,
    )!
    const head = runs.find((r) => r.text === 'Head Office:')!
    expect(head.fit).toMatchObject({ align: 'left', anchor: 72 })
    expect(head.fit!.right).toBeCloseTo(216 - 3.3, 1)
    // The next line's cap height (627 + 0.75 * 11) is as far down as it may wrap.
    expect(head.fit!.bottom).toBeCloseTo(635.25, 1)
  })

  it('lets the last text on a page wrap down to the bottom margin', () => {
    const [run] = buildTextRuns(1, [item('For: Hivolt Ideal Solutions Ltd', 72, 140, 133)], {}, undefined, [], VIEW)!
    expect(run.fit!.bottom).toBe(36)
  })

  it('reads the letters without the padding spaces', () => {
    const [run] = buildTextRuns(1, [item('   624.84', 366.9, 274, 48.2)], {}, undefined, [], VIEW)!
    expect(run.ink.left).toBeCloseTo(366.9 + 3 * 0.25 * 11, 1)
    expect(run.ink.right).toBeCloseTo(415.1, 1)
  })
})
