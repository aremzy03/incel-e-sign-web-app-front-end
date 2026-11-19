/**
 * Turn pdf.js text items into editable "runs" (plan-full-text-rewrite §6.1).
 *
 * A run is one line fragment the user thinks of as a word or phrase. Its
 * geometry is PDF user space, bottom-left origin, exactly what an `edit_text`
 * op sends: the tight glyph box the server deletes (`remove`) and the baseline
 * the replacement is drawn at.
 */

import { classifyPdfFont, type PdfFontClass } from '@/lib/pdf-edit/fonts'
import { findRunFits, type PageRule, type TextFit } from '@/lib/pdf-edit/text-fit'

/** The parts of a pdf.js `TextItem` this module reads. */
export interface PdfTextItem {
  str: string
  transform: number[]
  width: number
  height: number
  fontName: string
}

export interface PdfFontInfo {
  /** The font's real name (e.g. "ABCDEF+Calibri-Bold"), not pdf.js's "g_d0_f1". */
  name: string
  isType3?: boolean
}

export type RunLock = 'rotated' | 'too_small' | 'complex_script' | 'type3'

/**
 * [x0, y0, x1, y1, '#rrggbb', bold, italic, fontName?, previewFontId?] in PDF user space,
 * read by the server (see TextStyleSpan). previewFontId names an embedded font the
 * editor can download for an exact preview.
 */
export type StyleSpan = readonly [number, number, number, number, string, boolean, boolean, string?, (string | null)?]

export interface TextRun {
  runId: string
  page: number
  text: string
  fontSize: number
  fontName: string
  font: PdfFontClass
  baseline: { x: number; y: number }
  remove: { x: number; y: number; width: number; height: number }
  /** Where the visible letters start and end: `remove` without the leading and trailing spaces. */
  ink: { left: number; right: number }
  /** The slot a longer replacement may use (text-fit.ts); absent for locked runs. */
  fit?: TextFit
  /** '#rrggbb' from the PDF when the server sent styles; black otherwise. */
  color: string
  /** The PDF's embedded font, loadable for the preview (see useEmbeddedFont); absent when not loadable. */
  fontId?: string
  /** Why the run can't be edited; absent when it can. */
  locked?: RunLock
}

export const MIN_EDITABLE_FONT_SIZE = 4
export const MAX_RUNS_PER_PAGE = 2000

// Hebrew, Arabic, Syriac, Thaana, NKo… and the Indic blocks (Devanagari to Sinhala), plus Arabic presentation forms.
const COMPLEX_SCRIPT = /[֐-ࣿऀ-෿יִ-﷿ﹰ-﻿]/

export const RUN_LOCK_COPY: Record<RunLock, string> = {
  rotated: 'Rotated text can’t be edited.',
  too_small: 'This text is too small to edit.',
  complex_script: 'This script can’t be edited.',
  type3: 'This text uses a font that can’t be edited.',
}

interface Piece {
  str: string
  x: number
  y: number
  width: number
  fontSize: number
  fontKey: string
  style?: StyleSpan
  locked?: RunLock
}

/** The smallest server span containing the piece's centre: its colour and bold/italic. */
function styleAt(styles: readonly StyleSpan[] | undefined, x: number, y: number): StyleSpan | undefined {
  let best: StyleSpan | undefined
  let bestArea = Infinity
  for (const span of styles ?? []) {
    if (x < span[0] || x > span[2] || y < span[1] || y > span[3]) continue
    const area = (span[2] - span[0]) * (span[3] - span[1])
    if (area < bestArea) {
      best = span
      bestArea = area
    }
  }
  return best
}

function hash(input: string): string {
  let h = 5381
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h + input.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

/** Stable id: the same run on a reloaded page gets the same id (plan §9). */
export function runIdFor(page: number, x: number, y: number, text: string, width: number): string {
  return `edit-${hash(`${page}|${x.toFixed(2)}|${y.toFixed(2)}|${text}|${width.toFixed(2)}`)}`
}

function toPiece(item: PdfTextItem, fonts: Record<string, PdfFontInfo>, styles?: readonly StyleSpan[]): Piece | null {
  if (!item.str || !item.str.trim()) return null
  const [a, b, c, d, e, f] = item.transform
  const fontSize = Math.hypot(c, d) || Math.abs(d) || item.height
  const horizontal = Math.abs(b) < 0.5 && Math.abs(c) < 0.5 && d > 0 && a > 0
  let locked: RunLock | undefined
  if (!horizontal) locked = 'rotated'
  else if (fonts[item.fontName]?.isType3) locked = 'type3'
  else if (fontSize < MIN_EDITABLE_FONT_SIZE) locked = 'too_small'
  else if (COMPLEX_SCRIPT.test(item.str)) locked = 'complex_script'
  const width = Math.max(item.width, 0.5)
  // Centre of the glyphs: half-way along, a little above the baseline.
  const style = styleAt(styles, e + width / 2, f + fontSize * 0.3)
  return { str: item.str, x: e, y: f, width, fontSize, fontKey: item.fontName, style, locked }
}

function canJoin(left: Piece, right: Piece): boolean {
  if (left.locked || right.locked) return false
  if (left.fontKey !== right.fontKey) return false
  // A colour or style change starts a new run, so each keeps its own (e.g. a red label next to a blue link).
  if (left.style?.[4] !== right.style?.[4] || left.style?.[5] !== right.style?.[5] || left.style?.[6] !== right.style?.[6]) {
    return false
  }
  if (Math.abs(left.fontSize - right.fontSize) > 0.5) return false
  if (Math.abs(left.y - right.y) > 0.25 * left.fontSize) return false
  const gap = right.x - (left.x + left.width)
  return gap >= -0.25 * left.fontSize && gap <= 0.6 * left.fontSize
}

/**
 * Group one page's items into runs. Locked runs are kept (with a reason) so the
 * editor can explain why a word isn't editable. Returns null when the page has
 * too many pieces to edit.
 */
export function buildTextRuns(
  page: number,
  items: PdfTextItem[],
  fonts: Record<string, PdfFontInfo> = {},
  styles?: readonly StyleSpan[],
  /** The page's borders, from the server (text_rules). */
  rules?: readonly PageRule[],
  /** The page's view box ([x0, y0, x1, y1]); its bottom edge limits wrapping. */
  view: readonly number[] = [0, 0, 0, 0],
): TextRun[] | null {
  const pieces = items.map((item) => toPiece(item, fonts, styles)).filter((p): p is Piece => p !== null)
  // Top of the page first (PDF y grows up), then left to right.
  pieces.sort((p, q) => (Math.abs(p.y - q.y) > 0.25 * Math.min(p.fontSize, q.fontSize) ? q.y - p.y : p.x - q.x))

  const groups: Piece[][] = []
  for (const piece of pieces) {
    const last = groups[groups.length - 1]
    if (last && canJoin(last[last.length - 1], piece)) last.push(piece)
    else groups.push([piece])
  }
  if (groups.length > MAX_RUNS_PER_PAGE) return null

  const runs: TextRun[] = groups.map((group) => {
    const first = group[0]
    let text = first.str
    for (let i = 1; i < group.length; i++) {
      const prev = group[i - 1]
      const gap = group[i].x - (prev.x + prev.width)
      // Writers often encode the space as a gap instead of a character.
      const needsSpace = gap >= 0.15 * first.fontSize && !/\s$/.test(text) && !/^\s/.test(group[i].str)
      text += (needsSpace ? ' ' : '') + group[i].str
    }
    const right = Math.max(...group.map((p) => p.x + p.width))
    // The server's name for the font ("Arial-Black") beats pdf.js's ("CIDFont+F3").
    const fontName = first.style?.[7] || fonts[first.fontKey]?.name || first.fontKey
    const remove = {
      x: first.x,
      // Tight: down to the descenders, up to the cap height. A line-height box would eat the line above.
      y: first.y - first.fontSize * 0.3,
      width: right - first.x,
      height: first.fontSize * 1.25,
    }
    // Writers pad cells with spaces; the letters are what lines up. A space is about a quarter em.
    const leading = text.length - text.trimStart().length
    const trailing = text.length - text.trimEnd().length
    const ink = {
      left: Math.min(first.x + leading * 0.25 * first.fontSize, right),
      right: Math.max(right - trailing * 0.25 * first.fontSize, first.x),
    }
    const font = classifyPdfFont(fontName)
    // Bold/italic: the PDF's flags, or the font name ("Arial-Black", "Calibri-Light").
    if (first.style) {
      font.bold = first.style[5] || font.bold
      font.italic = first.style[6] || font.italic
      if (first.style[5] && font.weight < 600) font.weight = 700
    }
    return {
      runId: runIdFor(page, first.x, first.y, text, remove.width),
      page,
      text: text.trim(),
      fontSize: first.fontSize,
      fontName,
      font,
      color: first.style?.[4] ?? '#000000',
      ...(first.style?.[8] ? { fontId: first.style[8] } : {}),
      baseline: { x: first.x, y: first.y },
      remove,
      ink,
      locked: group.find((p) => p.locked)?.locked,
    }
  })
  if (runs.length === 0) return runs
  const fits = findRunFits(runs, rules, view)
  for (const run of runs) {
    if (fits[run.runId]) run.fit = fits[run.runId]
  }
  return runs
}

/**
 * CSS box for a run on a page rendered at `scale` CSS px per point (plan §6.2).
 * `view` is the page's view box ([x0, y0, x1, y1] in user space); its origin is
 * usually 0,0 but not always.
 */
export function runCssBox(run: Pick<TextRun, 'remove'>, view: readonly number[], scale: number) {
  return {
    left: (run.remove.x - view[0]) * scale,
    top: (view[3] - run.remove.y - run.remove.height) * scale,
    width: run.remove.width * scale,
    height: run.remove.height * scale,
  }
}
