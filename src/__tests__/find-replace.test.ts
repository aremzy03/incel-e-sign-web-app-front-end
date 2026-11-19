/**
 * Find & replace over text runs (plan-full-text-rewrite §4.3, §9).
 */
import { containsQuery, findMatches, replaceInText, runsInReadingOrder } from '@/lib/pdf-edit/find-replace'
import { buildTextRuns, type PdfTextItem } from '@/lib/pdf-edit/text-runs'

const item = (str: string, x: number, y: number, width: number): PdfTextItem => ({
  str,
  transform: [12, 0, 0, 12, x, y],
  width,
  height: 12,
  fontName: 'f',
})

const insensitive = { matchCase: false }
const sensitive = { matchCase: true }

describe('replaceInText', () => {
  it('replaces every occurrence, case-insensitive by default', () => {
    expect(replaceInText('Pay the Invoice, then file the invoice.', 'invoice', 'receipt', insensitive)).toBe(
      'Pay the receipt, then file the receipt.',
    )
  })

  it('respects match case', () => {
    expect(replaceInText('Invoice and invoice', 'invoice', 'bill', sensitive)).toBe('Invoice and bill')
  })

  it('handles regex characters literally and empty queries', () => {
    expect(replaceInText('Total (USD): $5.00', '(USD)', '(NGN)', insensitive)).toBe('Total (NGN): $5.00')
    expect(replaceInText('unchanged', '', 'x', insensitive)).toBe('unchanged')
  })
})

describe('findMatches', () => {
  const pages = {
    2: { runs: buildTextRuns(2, [item('Second page pay', 72, 700, 90)]) },
    1: {
      runs: buildTextRuns(1, [item('Please pay the invoice.', 72, 700, 140), item('Nothing here', 72, 650, 70)]),
    },
  }
  const runs = runsInReadingOrder(pages)

  it('orders runs by page, then top to bottom', () => {
    expect(runs.map((run) => run.text)).toEqual(['Please pay the invoice.', 'Nothing here', 'Second page pay'])
  })

  it('matches the current text: a pending replacement, not the original', () => {
    const first = runs[0]
    const current = (run: typeof first) => (run.runId === first.runId ? 'Please pay the receipt.' : run.text)
    expect(findMatches(runs, current, 'invoice', insensitive)).toEqual([])
    expect(findMatches(runs, current, 'PAY', insensitive).map((run) => run.page)).toEqual([1, 2])
  })

  it('never matches locked runs', () => {
    const locked = [{ ...runs[0], locked: 'rotated' as const }]
    expect(findMatches(locked, (run) => run.text, 'pay', insensitive)).toEqual([])
  })

  it('containsQuery folds case only when asked', () => {
    expect(containsQuery('Invoice', 'invoice', insensitive)).toBe(true)
    expect(containsQuery('Invoice', 'invoice', sensitive)).toBe(false)
  })
})
