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
