/**
 * Mirror of the backend's `fields/stamps.py`: what the server draws for
 * date and initials fields, so previews match the signed PDF.
 *
 * The server is the authority. Date fields show when the signer pressed
 * "sign" (server clock) in the signer's browser time zone; initials come from
 * the signer's account name in the style and font they pick. Keep the lists
 * below identical to the backend (fields/tests/test_stamps.py pins them there,
 * src/__tests__/field-stamps.test.ts here).
 */

import type { FieldPosition, FieldType } from '@/types/envelope'

// --- Time zone --------------------------------------------------------------

/** Most signers are in Lagos; the server falls back to this too. */
export const DEFAULT_SIGNER_TIMEZONE = 'Africa/Lagos'

/** The signer's IANA time zone, sent with every sign request. */
export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_SIGNER_TIMEZONE
  } catch {
    return DEFAULT_SIGNER_TIMEZONE
  }
}

// --- Date formats -------------------------------------------------------------

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

type DateParts = { year: number; month: number; day: number }
const pad = (n: number) => String(n).padStart(2, '0')

const DATE_FORMATTERS = {
  'DD/MM/YYYY': (d: DateParts) => `${pad(d.day)}/${pad(d.month)}/${d.year}`,
  'MM/DD/YYYY': (d: DateParts) => `${pad(d.month)}/${pad(d.day)}/${d.year}`,
  'YYYY-MM-DD': (d: DateParts) => `${d.year}-${pad(d.month)}-${pad(d.day)}`,
  'YYYY/MM/DD': (d: DateParts) => `${d.year}/${pad(d.month)}/${pad(d.day)}`,
  'DD-MMM-YYYY': (d: DateParts) => `${pad(d.day)}-${MONTHS_SHORT[d.month - 1]}-${d.year}`,
  'MMM D, YYYY': (d: DateParts) => `${MONTHS_SHORT[d.month - 1]} ${d.day}, ${d.year}`,
  'D MMMM YYYY': (d: DateParts) => `${d.day} ${MONTHS_LONG[d.month - 1]} ${d.year}`,
} as const

export type DateFormat = keyof typeof DATE_FORMATTERS
export const DATE_FORMATS = Object.keys(DATE_FORMATTERS) as DateFormat[]
/** What the server uses when a field has no (or an unknown) format. */
export const SERVER_DEFAULT_DATE_FORMAT: DateFormat = 'YYYY-MM-DD'
/** Pre-selected for new date fields (day-first, as used in Nigeria). */
export const NEW_FIELD_DATE_FORMAT: DateFormat = 'DD/MM/YYYY'

export function isDateFormat(value: unknown): value is DateFormat {
  return typeof value === 'string' && value in DATE_FORMATTERS
}

function datePartsInZone(date: Date, timeZone: string): DateParts {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).formatToParts(date)
    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value)
    return { year: get('year'), month: get('month'), day: get('day') }
  } catch {
    return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() }
  }
}

/** Preview of what the server will stamp: `date` in `timeZone`, in `format`. */
export function formatSigningDate(date: Date, format?: string | null, timeZone: string = browserTimeZone()): string {
  const formatter = isDateFormat(format) ? DATE_FORMATTERS[format] : DATE_FORMATTERS[SERVER_DEFAULT_DATE_FORMAT]
  return formatter(datePartsInZone(date, timeZone))
}

// --- Initials -------------------------------------------------------------

export const INITIALS_STYLES = [
  { id: 'initials', label: 'Initials' },
  { id: 'first_name', label: 'First name' },
  { id: 'last_name', label: 'Last name' },
  { id: 'full_name', label: 'Full name' },
] as const
export type InitialsStyle = (typeof INITIALS_STYLES)[number]['id']
export const DEFAULT_INITIALS_STYLE: InitialsStyle = 'initials'

/** "Abdulmalik Aremu" → AA / Abdulmalik / Aremu / Abdulmalik Aremu. */
export function initialsText(fullName: string | null | undefined, style: InitialsStyle = DEFAULT_INITIALS_STYLE): string {
  const parts = (fullName ?? '').split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  switch (style) {
    case 'first_name':
      return parts[0]
    case 'last_name':
      return parts[parts.length - 1]
    case 'full_name':
      return parts.join(' ')
    default: {
      const letters = parts
        .map((p) => p[0])
        .filter((c) => /\p{L}/u.test(c))
        .join('')
        .toUpperCase()
      return letters || parts[0][0].toUpperCase()
    }
  }
}

/**
 * Same ids as the backend. `css` is the font-family stack; handwriting fonts
 * are served from /public/fonts/initials (the same TTFs the server embeds),
 * declared in globals.css.
 */
export const INITIALS_FONTS = [
  { id: 'great-vibes', label: 'Great Vibes', css: "'Initials Great Vibes', cursive" },
  { id: 'allura', label: 'Allura', css: "'Initials Allura', cursive" },
  { id: 'sacramento', label: 'Sacramento', css: "'Initials Sacramento', cursive" },
  { id: 'alex-brush', label: 'Alex Brush', css: "'Initials Alex Brush', cursive" },
  { id: 'parisienne', label: 'Parisienne', css: "'Initials Parisienne', cursive" },
  { id: 'yellowtail', label: 'Yellowtail', css: "'Initials Yellowtail', cursive" },
  { id: 'homemade-apple', label: 'Homemade Apple', css: "'Initials Homemade Apple', cursive" },
  { id: 'mr-dafoe', label: 'Mr Dafoe', css: "'Initials Mr Dafoe', cursive" },
  { id: 'la-belle-aurore', label: 'La Belle Aurore', css: "'Initials La Belle Aurore', cursive" },
  { id: 'cedarville-cursive', label: 'Cedarville Cursive', css: "'Initials Cedarville Cursive', cursive" },
  { id: 'kaushan-script', label: 'Kaushan Script', css: "'Initials Kaushan Script', cursive" },
  { id: 'times-italic', label: 'Times Italic', css: "'Times New Roman', Times, serif", italic: true },
  { id: 'helvetica-oblique', label: 'Helvetica Italic', css: 'Helvetica, Arial, sans-serif', italic: true },
] as const
export type InitialsFont = (typeof INITIALS_FONTS)[number]['id']
export const DEFAULT_INITIALS_FONT: InitialsFont = 'great-vibes'

export function initialsFontStyle(font: string | null | undefined): { fontFamily: string; fontStyle?: 'italic' } {
  const entry = INITIALS_FONTS.find((f) => f.id === font) ?? INITIALS_FONTS[0]
  return 'italic' in entry && entry.italic ? { fontFamily: entry.css, fontStyle: 'italic' } : { fontFamily: entry.css }
}

export interface InitialsChoice {
  style: InitialsStyle
  font: InitialsFont
}

export const DEFAULT_INITIALS_CHOICE: InitialsChoice = {
  style: DEFAULT_INITIALS_STYLE,
  font: DEFAULT_INITIALS_FONT,
}

/** Extra keys for a sign / self-sign request. */
export function stampRequestOptions(choice: InitialsChoice = DEFAULT_INITIALS_CHOICE) {
  return {
    timezone: browserTimeZone(),
    initials_style: choice.style,
    initials_font: choice.font,
  }
}

// --- Field fonts and defaults ----------------------------------------------

/** Fonts the server can draw for date and designation fields. */
export const FIELD_TEXT_FONTS = [
  { id: 'Helvetica', label: 'Helvetica', css: 'Helvetica, Arial, sans-serif' },
  { id: 'Times-Roman', label: 'Times Roman', css: "'Times New Roman', Times, serif" },
  { id: 'Courier', label: 'Courier', css: "'Courier New', Courier, monospace" },
] as const

export function fieldTextFontCss(font: string | null | undefined): string {
  return FIELD_TEXT_FONTS.find((f) => f.id === font)?.css ?? FIELD_TEXT_FONTS[0].css
}

/** Types the server fills at signing time; senders can't prefill them. */
export const SERVER_FILLED_FIELD_TYPES: ReadonlySet<FieldType> = new Set<FieldType>(['initials', 'date'])

/** Settings a new field starts with, so it is valid as soon as it is placed. */
export function defaultFieldSettings(type: FieldType): Partial<FieldPosition> {
  switch (type) {
    case 'date':
      return { required: true, font_family: 'Helvetica', font_size: 12, date_format: NEW_FIELD_DATE_FORMAT }
    case 'initials':
      return { required: true }
    case 'designation':
      return { required: false, font_family: 'Helvetica', font_size: 12, max_length: 100, prefill_value: '' }
    default:
      return {}
  }
}

export const TEXT_FIELD_RETIRED_MESSAGE =
  'Text fields are no longer supported. Delete them and use Add text on the document instead.'
