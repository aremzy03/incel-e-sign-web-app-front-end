/**
 * Fit a replacement into the space its original text had (plan-full-text-rewrite,
 * "Borders and alignment").
 *
 * `findRunFits` works out each run's slot from the page: borders (the server's
 * `text_rules`), the neighbouring words and the page margins on either side, how far
 * down it may wrap, and whether it is left-, right- or centre-aligned. `fitText` is
 * the policy, mirrored from documents/services/text_fit.py so the preview matches the
 * save:
 *
 * 1. It fits: one line at the original size.
 * 2. It nearly fits (90% or more): one line, shrunk.
 * 3. It fits wrapped onto the empty lines below: wrapped.
 * 4. It fits at 75% or more: one line, shrunk.
 * 5. Otherwise one line at 75%, overflowing (the editor warns): it overlaps as little as it can.
 *
 * Everything is PDF user space, bottom-left origin.
 */

import type { TextRun } from '@/lib/pdf-edit/text-runs'

export type FitAlign = 'left' | 'center' | 'right'

export interface TextFit {
  left: number
  right: number
  /** Lowest y wrapped lines may reach (their descenders included). */
  bottom: number
  align: FitAlign
  /** Where the text is pinned: its start, middle or end. */
  anchor: number
}

/** [0, x, y0, y1] a vertical rule; [1, y, x0, x1] a horizontal one (see page_rules on the server). */
export type PageRule = readonly [number, number, number, number]

export const LINE_HEIGHT = 1.2
export const NEAR_FIT_SCALE = 0.9
export const MIN_FIT_SCALE = 0.75
export const MAX_WRAP_LINES = 20
const DESCENT = 0.25

export type Measure = (text: string, size: number) => number

export interface FitLayout {
  mode: 'fit' | 'shrink' | 'wrap' | 'overflow'
  size: number
  lines: { text: string; x: number; y: number; width: number }[]
  overflow: boolean
}

function available(fit: TextFit): number {
  if (fit.align === 'right') return fit.anchor - fit.left
  if (fit.align === 'center') return 2 * Math.min(fit.anchor - fit.left, fit.right - fit.anchor)
  return fit.right - fit.anchor
}

function lineX(fit: TextFit, width: number): number {
  if (fit.align === 'right') return fit.anchor - width
  if (fit.align === 'center') return fit.anchor - width / 2
  return fit.anchor
}

/** Greedy word wrap; null when one word alone is wider than the line. */
export function wrapWords(text: string, size: number, width: number, measure: Measure): string[] | null {
  const lines: string[] = []
  let current = ''
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (measure(word, size) > width) return null
    const candidate = current ? `${current} ${word}` : word
    if (current && measure(candidate, size) > width) {
      lines.push(current)
      current = word
    } else {
      current = candidate
    }
  }
  if (current) lines.push(current)
  return lines
}

const shrunk = (natural: number, room: number, size: number) => Math.floor((size * room * 100) / natural) / 100

export function fitText(rawText: string, size: number, baselineY: number, fit: TextFit, measure: Measure): FitLayout {
  const room = Math.max(available(fit), 0)
  const text = rawText.trim()
  const natural = measure(text, size)
  const single = (mode: FitLayout['mode'], lineSize: number): FitLayout => {
    const width = measure(text, lineSize)
    return { mode, size: lineSize, lines: [{ text, x: lineX(fit, width), y: baselineY, width }], overflow: mode === 'overflow' }
  }

  if (natural <= room + 0.01) return single('fit', size)
  if (natural * NEAR_FIT_SCALE <= room) return single('shrink', shrunk(natural, room, size))
  const lines = wrapWords(text, size, room, measure)
  if (lines && lines.length > 1 && lines.length <= MAX_WRAP_LINES) {
    const step = LINE_HEIGHT * size
    const last = baselineY - (lines.length - 1) * step
    if (last - DESCENT * size >= fit.bottom - 0.01) {
      return {
        mode: 'wrap',
        size,
        lines: lines.map((line, index) => {
          const width = measure(line, size)
          return { text: line, x: lineX(fit, width), y: baselineY - index * step, width }
        }),
        overflow: false,
      }
    }
  }
  if (natural * MIN_FIT_SCALE <= room) return single('shrink', shrunk(natural, room, size))
  return single('overflow', Math.floor(size * MIN_FIT_SCALE * 100) / 100)
}

// --- Slots --------------------------------------------------------------------------

/** Edges within this distance count as lined up (columns, right-aligned figures). */
const ALIGN_TOLERANCE = 2
/** Runs further apart than this many lines don't vote on each other's alignment. */
const ALIGN_REACH_LINES = 12
/** Wrapping stops this far above the page's bottom edge when nothing else is below. */
const BOTTOM_MARGIN = 36

interface Band {
  run: TextRun
  left: number
  right: number
  /** Descender line to cap height. */
  low: number
  high: number
}

function band(run: TextRun): Band {
  return {
    run,
    left: run.ink.left,
    right: run.ink.right,
    low: run.baseline.y - DESCENT * run.fontSize,
    high: run.baseline.y + 0.75 * run.fontSize,
  }
}

const overlaps = (a0: number, a1: number, b0: number, b1: number) => a0 < b1 && b0 < a1

function alignmentOf(me: Band, others: Band[], leftLimit: number, rightLimit: number, ruledLeft: boolean, ruledRight: boolean): FitAlign {
  const reach = ALIGN_REACH_LINES * me.run.fontSize
  let left = 0
  let right = 0
  let center = 0
  for (const other of others) {
    if (other.run.runId === me.run.runId || Math.abs(other.run.baseline.y - me.run.baseline.y) > reach) continue
    if (overlaps(other.low, other.high, me.low, me.high)) continue // same line: not a column
    const sameLeft = Math.abs(other.left - me.left) <= ALIGN_TOLERANCE
    const sameRight = Math.abs(other.right - me.right) <= ALIGN_TOLERANCE
    const sameCentre = Math.abs((other.left + other.right) / 2 - (me.left + me.right) / 2) <= ALIGN_TOLERANCE
    // Only a shared edge with a differing other edge says anything: equal widths line up everywhere.
    if (sameLeft && !sameRight) left++
    else if (sameRight && !sameLeft) right++
    else if (sameCentre && !sameLeft && !sameRight) center++
  }
  if (right > left && right >= center) return 'right'
  if (center > left && center > right) return 'center'
  if (left > 0) return 'left'
  // No column to go by: a cell with borders on both sides says it.
  if (ruledLeft && ruledRight) {
    const leftGap = me.left - leftLimit
    const rightGap = rightLimit - me.right
    if (leftGap > 3 && rightGap > 3 && Math.abs(leftGap - rightGap) <= ALIGN_TOLERANCE) return 'center'
    if (rightGap <= 4 && leftGap > 4 * rightGap + 6) return 'right'
  }
  return 'left'
}

/**
 * The slot each editable run may grow into, keyed by runId. `rules` are the page's
 * borders; `view` its view box.
 */
export function findRunFits(runs: TextRun[], rules: readonly PageRule[] | undefined, view: readonly number[]): Record<string, TextFit> {
  const bands = runs.filter((run) => run.locked !== 'rotated').map(band)
  const contentLeft = Math.min(...bands.map((b) => b.left))
  const contentRight = Math.max(...bands.map((b) => b.right))
  const fits: Record<string, TextFit> = {}

  for (const me of bands) {
    if (me.run.locked) continue
    const size = me.run.fontSize
    const pad = Math.max(2, 0.2 * size)
    const wordGap = Math.max(3, 0.3 * size)

    // The nearest border on each side; without one, the page's text margins.
    let ruleRight = Infinity
    let ruleLeft = -Infinity
    for (const [kind, at, from, to] of rules ?? []) {
      if (kind !== 0 || !overlaps(from, to, me.low, me.high)) continue
      if (at >= me.right - 0.5) ruleRight = Math.min(ruleRight, at - pad)
      else if (at <= me.left + 0.5) ruleLeft = Math.max(ruleLeft, at + pad)
    }
    let ruledRight = ruleRight !== Infinity
    let ruledLeft = ruleLeft !== -Infinity
    let right = ruledRight ? ruleRight : Math.max(contentRight, me.right)
    let left = ruledLeft ? ruleLeft : Math.min(contentLeft, me.left)
    for (const other of bands) {
      if (other === me || !overlaps(other.low, other.high, me.low, me.high)) continue
      if (other.left >= me.right - 0.5 && other.left - wordGap < right) {
        right = other.left - wordGap
        ruledRight = false
      } else if (other.right <= me.left + 0.5 && other.right + wordGap > left) {
        left = other.right + wordGap
        ruledLeft = false
      }
    }
    // Never narrower than the original: it fitted there.
    right = Math.max(right, me.right)
    left = Math.min(left, me.left)

    // Wrapping: down to the first text or rule below, inside the slot's width.
    let bottom = Math.min(view[1] + BOTTOM_MARGIN, me.low)
    for (const other of bands) {
      if (other.high <= me.low + 0.5 && overlaps(other.left, other.right, left, right)) bottom = Math.max(bottom, other.high)
    }
    for (const [kind, at, from, to] of rules ?? []) {
      if (kind === 1 && at <= me.high && overlaps(from, to, left, right)) bottom = Math.max(bottom, at)
    }
    bottom = Math.min(bottom, me.low)

    const align = alignmentOf(me, bands, left, right, ruledLeft, ruledRight)
    const anchor = align === 'right' ? me.right : align === 'center' ? (me.left + me.right) / 2 : me.left
    fits[me.run.runId] = { left, right, bottom, align, anchor }
  }
  return fits
}

/** Width of text in a CSS font, via a shared canvas. Falls back to an estimate without one (tests, SSR). */
let canvasContext: CanvasRenderingContext2D | null | undefined
export function canvasMeasure(cssFont: (size: number) => string): Measure {
  if (canvasContext === undefined) {
    try {
      canvasContext = typeof document === 'undefined' ? null : document.createElement('canvas').getContext('2d')
    } catch {
      canvasContext = null
    }
  }
  const context = canvasContext
  return (text, size) => {
    if (!context) return text.length * size * 0.5
    context.font = cssFont(size)
    return context.measureText(text).width
  }
}

/** Ascent and descent of a CSS font, per unit of font size (fallback: typical Latin values). */
export function canvasFontMetrics(cssFont: string): { ascent: number; descent: number } {
  canvasMeasure(() => cssFont) // creates the shared context
  const context = canvasContext
  if (context) {
    context.font = cssFont
    const metrics = context.measureText('Hg')
    const size = parseFloat(/(\d+(?:\.\d+)?)px/.exec(cssFont)?.[1] ?? '100')
    if (metrics.fontBoundingBoxAscent && size) {
      return { ascent: metrics.fontBoundingBoxAscent / size, descent: (metrics.fontBoundingBoxDescent ?? 0) / size }
    }
  }
  return { ascent: 0.9, descent: 0.22 }
}
