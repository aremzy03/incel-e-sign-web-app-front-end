/**
 * Grouping pdf.js text items into editable runs (plan-full-text-rewrite §6.1, §16).
 */
import { buildTextRuns, runCssBox, runIdFor, type PdfTextItem } from '@/lib/pdf-edit/text-runs'
import { classifyPdfFont, fontWeightFromName, localFamilyNames } from '@/lib/pdf-edit/fonts'
import { textEditErrorCopy } from '@/lib/api/documents'

const item = (str: string, x: number, y: number, width: number, size = 12, fontName = 'g_f1'): PdfTextItem => ({
  str,
  transform: [size, 0, 0, size, x, y],
  width,
  height: size,
  fontName,
})

const FONTS = { g_f1: { name: 'ABCDEF+Arial-BoldMT' }, g_f2: { name: 'Times-Roman' } }

describe('buildTextRuns', () => {
  it('joins fragments split by a gap into one run with a space', () => {
    // "Hello" ends at 102; "World" starts 3pt later (> 0.15·12 = 1.8): the writer encoded the space as a gap.
    const runs = buildTextRuns(1, [item('Hello', 72, 700, 30), item('World', 105, 700, 32)], FONTS)!
    expect(runs).toHaveLength(1)
    expect(runs[0].text).toBe('Hello World')
    expect(runs[0].remove).toEqual({ x: 72, y: 700 - 3.6, width: 65, height: 15 })
    expect(runs[0].baseline).toEqual({ x: 72, y: 700 })
    expect(runs[0].fontName).toBe('ABCDEF+Arial-BoldMT')
  })

  it('joins touching fragments without adding a space', () => {
    const runs = buildTextRuns(1, [item('Inv', 72, 700, 18), item('oice', 90.5, 700, 22)], FONTS)!
    expect(runs.map((r) => r.text)).toEqual(['Invoice'])
  })

  it('does not join two lines', () => {
    const runs = buildTextRuns(1, [item('Top', 72, 700, 20), item('Bottom', 72, 686, 36)], FONTS)!
    expect(runs.map((r) => r.text)).toEqual(['Top', 'Bottom'])
  })

  it('does not join across a wide gap, a different font or size', () => {
    const runs = buildTextRuns(
      1,
      [
        item('Name', 72, 700, 30),
        item('Value', 300, 700, 30),
        item('Serif', 340, 700, 30, 12, 'g_f2'),
        item('Big', 380, 700, 30, 18),
      ],
      FONTS,
    )!
    expect(runs.map((r) => r.text)).toEqual(['Name', 'Value', 'Serif', 'Big'])
  })

  it('locks rotated and tiny text but keeps it with a reason', () => {
    const rotated: PdfTextItem = { str: 'Side', transform: [0, 12, -12, 0, 300, 300], width: 24, height: 12, fontName: 'g_f1' }
    const runs = buildTextRuns(1, [rotated, item('tiny', 72, 100, 8, 3)], FONTS)!
    expect(Object.fromEntries(runs.map((r) => [r.text, r.locked]))).toEqual({ Side: 'rotated', tiny: 'too_small' })
  })

  it('locks complex scripts and Type 3 fonts', () => {
    const runs = buildTextRuns(
      1,
      [item('مرحبا', 72, 700, 30), item('Glyphs', 72, 650, 30, 12, 'g_t3')],
      { ...FONTS, g_t3: { name: 'T3Font', isType3: true } },
    )!
    expect(runs.map((r) => r.locked)).toEqual(['complex_script', 'type3'])
  })

  it('drops whitespace-only items', () => {
    expect(buildTextRuns(1, [item('   ', 72, 700, 10)], FONTS)).toEqual([])
  })

  it('gives identical words at different x different stable ids', () => {
    const runs = buildTextRuns(1, [item('Yes', 72, 700, 20), item('Yes', 300, 700, 20)], FONTS)!
    expect(runs[0].runId).not.toBe(runs[1].runId)
    expect(runs[0].runId).toBe(runIdFor(1, 72, 700, 'Yes', 20))
  })

  it('refuses a page with too many pieces', () => {
    const many = Array.from({ length: 2001 }, (_, i) => item('x', 10, 800 - i * 0.4 * 30, 5))
    expect(buildTextRuns(1, many, FONTS)).toBeNull()
  })
})

describe('runCssBox', () => {
  it('converts the bottom-left glyph box to CSS, honouring the view origin', () => {
    const run = { remove: { x: 72, y: 696.4, width: 65, height: 15 } }
    expect(runCssBox(run, [0, 0, 612, 792], 2)).toEqual({ left: 144, top: (792 - 711.4) * 2, width: 130, height: 30 })
    expect(runCssBox(run, [10, 20, 622, 812], 1).left).toBe(62)
  })
})

describe('classifyPdfFont (mirrors the server)', () => {
  it('maps names to Liberation families and styles', () => {
    expect(classifyPdfFont('ABCDEF+TimesNewRomanPS-BoldItalicMT')).toMatchObject({ family: 'LiberationSerif', bold: true, italic: true })
    expect(classifyPdfFont('Courier')).toMatchObject({ family: 'LiberationMono', bold: false })
    expect(classifyPdfFont('Calibri')).toMatchObject({ family: 'LiberationSans' })
    expect(classifyPdfFont('DejaVuSans')).toMatchObject({ family: 'LiberationSans' })
  })
})

describe('textEditErrorCopy', () => {

  it('reads a rewrite failure with the ops that failed', () => {
    const error = { response: { data: { reason: 'rewrite_failed', message: 'Couldn’t replace the text on the page. The file was not changed.', opIds: ['edit-1'] } } }
    expect(textEditErrorCopy(error)).toEqual({
      reason: 'rewrite_failed',
      message: 'Couldn’t replace the text on the page. The file was not changed.',
      opIds: ['edit-1'],
    })
  })

  it('reads a validation list and falls back to known copy', () => {
    const error = { response: { data: { status: 'error', errors: [{ opId: 'edit-2', reason: 'boxes_overlap' }] } } }
    expect(textEditErrorCopy(error)).toMatchObject({ reason: 'boxes_overlap', opIds: ['edit-2'], message: 'Two edits overlap. Undo one of them.' })
  })
})

describe('colours and styles from the server', () => {
  const grey = [70, 695, 200, 712, '#808080', false, false] as const
  const red = [205, 695, 260, 712, '#ff0000', true, false] as const

  it('gives a run the colour of the span under it', () => {
    const [run] = buildTextRuns(1, [item('Weight: 1,759.5kg', 72, 700, 120)], { g_f1: { name: 'CIDFont+F5' } }, [grey])!
    expect(run.color).toBe('#808080')
    expect(run.font.bold).toBe(false)
  })

  it('uses the server’s font name when pdf.js only has a generic one', () => {
    const heading = [250, 690, 440, 715, '#a61c00', false, false, 'Arial-Black'] as const
    const [run] = buildTextRuns(1, [item('HIVOLT', 255, 698, 170)], { g_f1: { name: 'CIDFont+F3' } }, [heading])!
    expect(run.fontName).toBe('Arial-Black')
    expect(run.font).toMatchObject({ family: 'LiberationSans', bold: true, weight: 900 })
    expect(run.font.css.startsWith("'Arial Black', 'Arial', 'Liberation Sans'")).toBe(true)
    expect(run.fontId).toBeUndefined()
  })

  it('carries the server’s loadable embedded font id', () => {
    const heading = [250, 690, 440, 715, '#a61c00', true, false, 'Arial Black', '29'] as const
    const [run] = buildTextRuns(1, [item('HIVOLT', 255, 698, 170)], { g_f1: { name: 'CIDFont+F3' } }, [heading])!
    expect(run.fontId).toBe('29')
    expect(run.font.weight).toBe(900)
  })

  it('makes a bold-flagged run without a weight in its name 700', () => {
    const bold = [70, 695, 200, 712, '#000000', true, false, 'CIDFont+F6'] as const
    const [run] = buildTextRuns(1, [item('Total', 72, 700, 40)], {}, [bold])!
    expect(run.font.weight).toBe(700)
  })

  it('splits touching fragments where the colour changes', () => {
    const runs = buildTextRuns(1, [item('Weight:', 72, 700, 130), item('URGENT', 203, 700, 50)], { g_f1: { name: 'Calibri' } }, [grey, red])!
    expect(runs.map((r) => [r.text, r.color, r.font.bold])).toEqual([
      ['Weight:', '#808080', false],
      ['URGENT', '#ff0000', true],
    ])
  })

  it('defaults to black when the server sent no styles', () => {
    expect(buildTextRuns(1, [item('Plain', 72, 700, 30)], FONTS)![0].color).toBe('#000000')
  })
})

describe('font names for the preview', () => {
  it('reads the weight from the name', () => {
    expect(fontWeightFromName('ABCDEF+Arial-Black')).toBe(900)
    expect(fontWeightFromName('Calibri Light')).toBe(300)
    expect(fontWeightFromName('Montserrat-ExtraBold')).toBe(800)
    expect(fontWeightFromName('OpenSans-SemiBold')).toBe(600)
    expect(fontWeightFromName('Roboto-ExtraLight')).toBe(200)
    expect(fontWeightFromName('Calibri Bold')).toBe(700)
    expect(fontWeightFromName('Calibri')).toBe(400)
  })

  it('names installed families to try, best first', () => {
    expect(localFamilyNames('Arial-Black')).toEqual(['Arial Black', 'Arial'])
    expect(localFamilyNames('ABCDEF+TimesNewRomanPS-BoldMT')).toEqual(['Times New Roman'])
    expect(localFamilyNames('Calibri Light')).toEqual(['Calibri Light', 'Calibri'])
    expect(localFamilyNames('Calibri Regular')).toEqual(['Calibri'])
    expect(localFamilyNames('CIDFont+F3')).toEqual([])
  })
})
