export const PLACEHOLDER_TEXT = 'Type your text'

export const TEXT_FONTS = [
  { id: 'Helvetica', label: 'Helvetica', css: 'Helvetica, Arial, sans-serif' },
  { id: 'Times-Roman', label: 'Times Roman', css: "'Times New Roman', Times, serif" },
  { id: 'Courier', label: 'Courier', css: "'Courier New', Courier, monospace" },
] as const

export type TextFontId = (typeof TEXT_FONTS)[number]['id']

export function fontCssFamily(font: string): string {
  return TEXT_FONTS.find((item) => item.id === font)?.css ?? TEXT_FONTS[0].css
}

export function textIsDrawable(text: string): boolean {
  for (const char of text) {
    if (char === '\n' || char === '\t') continue
    if (char.codePointAt(0)! > 255) return false
  }
  return true
}

export function isSavedText(text: string): boolean {
  const trimmed = text.trim()
  return trimmed.length > 0 && trimmed !== PLACEHOLDER_TEXT
}

export const DEFAULT_FONT_SIZE = 11
/** Starting frame width. 40% smaller than the original 180pt box. */
export const DEFAULT_TEXT_WIDTH = 108

export function textLineHeight(fontSize: number) {
  return fontSize * 1.2
}

export function defaultTextOp(partial: {
  page: number
  x: number
  y: number
  pageWidth: number
  pageHeight: number
}) {
  const width = Math.min(DEFAULT_TEXT_WIDTH, Math.max(24, partial.pageWidth - partial.x))
  return {
    opId: crypto.randomUUID(),
    op: 'add_text' as const,
    page: partial.page,
    x: partial.x,
    y: partial.y,
    width,
    height: textLineHeight(DEFAULT_FONT_SIZE),
    text: '',
    font: 'Helvetica' as TextFontId,
    fontSize: DEFAULT_FONT_SIZE,
    color: '#000000',
    bold: false,
    italic: false,
    align: 'left' as const,
  }
}

function wrapParagraph(text: string, maxWidth: number, measure: (sample: string) => number): string[] {
  if (text === '') return ['']
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''
  const pushWord = (word: string) => {
    if (measure(word) <= maxWidth) {
      current = word
      return
    }
    let chunk = ''
    for (const char of word) {
      const trial = chunk + char
      if (measure(trial) <= maxWidth) {
        chunk = trial
      } else {
        if (chunk) lines.push(chunk)
        chunk = char
      }
    }
    current = chunk
  }
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (measure(candidate) <= maxWidth) {
      current = candidate
      continue
    }
    if (current) lines.push(current)
    pushWord(word)
  }
  if (current || lines.length === 0) lines.push(current)
  return lines
}

/** Grow a text frame to fit its words, keeping a minimum width until the line needs more. */
export function fitTextFrame(input: {
  text: string
  fontSize: number
  minWidth: number
  maxWidth: number
  lockedWidth?: number | null
  pad: number
  measure: (sample: string) => number
}): { width: number; height: number } {
  const minWidth = Math.min(Math.max(input.minWidth, 1), input.maxWidth)
  const locked =
    input.lockedWidth == null
      ? null
      : Math.min(Math.max(input.lockedWidth, minWidth), input.maxWidth)
  const paragraphs = input.text.length > 0 ? input.text.split('\n') : ['']
  let natural = 0
  for (const paragraph of paragraphs) {
    natural = Math.max(natural, input.measure(paragraph))
  }
  const width = locked ?? Math.min(input.maxWidth, Math.max(minWidth, natural + input.pad))
  const inner = Math.max(1, width - input.pad)
  const lines = paragraphs.flatMap((paragraph) => wrapParagraph(paragraph, inner, input.measure))
  return { width, height: Math.max(1, lines.length) * textLineHeight(input.fontSize) }
}

// --- Existing-text rewrite (plan-full-text-rewrite §7.2, §8) ----------------------

export type LiberationFamily = 'LiberationSans' | 'LiberationSerif' | 'LiberationMono'

export interface PdfFontClass {
  /** The Liberation family the server falls back to for this font. */
  family: LiberationFamily
  /** CSS stack for previewing typed text: the PDF's own font if installed, then Liberation. */
  css: string
  bold: boolean
  italic: boolean
  /** CSS font-weight (100–900), from the name: "Arial Black" 900, "Calibri Light" 300. */
  weight: number
}

const FAMILY_CSS: Record<LiberationFamily, string> = {
  LiberationSans: "'Liberation Sans', Arial, Helvetica, sans-serif",
  LiberationSerif: "'Liberation Serif', 'Times New Roman', Times, serif",
  LiberationMono: "'Liberation Mono', 'Courier New', Courier, monospace",
}

// Longest names first: "extrabold" must not read as "bold".
const WEIGHTS: [RegExp, number][] = [
  [/(extra|ultra)\s*light|hairline/, 200],
  [/thin/, 100],
  [/(semi|demi)\s*bold/, 600],
  [/(extra|ultra)\s*bold/, 800],
  [/black|heavy/, 900],
  [/bold/, 700],
  [/medium/, 500],
  [/light/, 300],
]

/** CSS font-weight named by a PDF font name; 400 when the name says nothing. */
export function fontWeightFromName(fontName: string): number {
  const name = fontName.replace(/^[A-Z]{6}\+/, '').toLowerCase()
  return WEIGHTS.find(([pattern]) => pattern.test(name))?.[1] ?? 400
}

// Words that name a style, not the family ("Calibri-BoldItalic", "TimesNewRomanPS-BoldMT").
const STYLE_WORDS = /^(regular|book|normal|bold|italic|oblique|light|thin|medium|semibold|demibold|extrabold|ultrabold|black|heavy|condensed|mt|ps|psmt|it|bd|bi)$/i

/**
 * Family names to ask the browser for, best first: "Arial-Black" gives
 * ["Arial Black", "Arial"], "TimesNewRomanPS-BoldMT" gives ["Times New Roman"].
 * A font installed on the viewer's machine is then used as is.
 */
export function localFamilyNames(fontName: string): string[] {
  const base = fontName.replace(/^[A-Z]{6}\+/, '').replace(/,.*$/, '')
  // Split "TimesNewRomanPS" into words, and hyphens/underscores into spaces.
  const words = base
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/[\s\-_]+/)
    .filter(Boolean)
  const names: string[] = []
  // Some weights and widths are families of their own on Windows and macOS: "Arial Black",
  // "Calibri Light", "Arial Narrow". Bold and italic never are.
  const SEPARATE_FAMILY = /^(black|light|narrow|condensed|semibold|medium)$/i
  const withWeightWord = words.filter((word) => !STYLE_WORDS.test(word) || SEPARATE_FAMILY.test(word))
  const family = words.filter((word) => !STYLE_WORDS.test(word))
  for (const candidate of [withWeightWord, family]) {
    const name = candidate.join(' ')
    if (name && !/^(cidfont|f\d+|t\d+)/i.test(name) && !names.includes(name)) names.push(name)
  }
  return names
}

function cssQuote(name: string): string {
  return `'${name.replace(/['\\]/g, '')}'`
}

/** The Liberation stack alone: what the server draws with when it can't reuse the PDF's font. */
export function liberationCss(family: LiberationFamily): string {
  return FAMILY_CSS[family]
}

/**
 * Serif / sans / mono and style from a PDF font name, matching the server's
 * `classify_font` (documents/services/pdf_rewrite.py). "ABCDEF+" subset prefixes are ignored.
 */
export function classifyPdfFont(fontName: string): PdfFontClass {
  const name = fontName.replace(/^[A-Z]{6}\+/, '').toLowerCase()
  let family: LiberationFamily = 'LiberationSans'
  // Same order as the server: a serif name wins, then mono, else sans.
  if (/times|georgia|cambria|garamond|liberation serif|serif/.test(name) && !name.includes('sans')) {
    family = 'LiberationSerif'
  } else if (/courier|consolas|mono|typewriter/.test(name)) {
    family = 'LiberationMono'
  }
  const weight = fontWeightFromName(fontName)
  const local = localFamilyNames(fontName).map(cssQuote)
  return {
    family,
    css: [...local, FAMILY_CSS[family]].join(', '),
    bold: weight >= 600,
    italic: /italic|oblique/.test(name),
    weight,
  }
}
