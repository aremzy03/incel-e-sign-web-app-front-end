/**
 * Pins lib/fields/stamps to the backend (fields/stamps.py and
 * fields/tests/test_stamps.py use the same values), so previews match the PDF.
 */
import {
  DATE_FORMATS,
  INITIALS_FONTS,
  INITIALS_STYLES,
  defaultFieldSettings,
  formatSigningDate,
  initialsText,
  stampRequestOptions,
} from '@/lib/fields/stamps'
import { buildSignEnvelopePayload } from '@/lib/api/signatures'
import { getSendValidationErrors } from '@/lib/envelope/envelope-wizard-validation'

// 23:30 UTC on 18 Nov is already 19 Nov in Lagos (UTC+1).
const SIGNED_AT = new Date('2026-11-18T23:30:00Z')

describe('field stamps (mirror of the backend)', () => {
  it('formats every date format like the server, in the signer zone', () => {
    const expected: Record<string, string> = {
      'DD/MM/YYYY': '19/11/2026',
      'MM/DD/YYYY': '11/19/2026',
      'YYYY-MM-DD': '2026-11-19',
      'YYYY/MM/DD': '2026/11/19',
      'DD-MMM-YYYY': '19-Nov-2026',
      'MMM D, YYYY': 'Nov 19, 2026',
      'D MMMM YYYY': '19 November 2026',
    }
    expect([...DATE_FORMATS].sort()).toEqual(Object.keys(expected).sort())
    for (const [format, text] of Object.entries(expected)) {
      expect(formatSigningDate(SIGNED_AT, format, 'Africa/Lagos')).toBe(text)
    }
    expect(formatSigningDate(SIGNED_AT, 'DD/MM/YYYY', 'America/New_York')).toBe('18/11/2026')
    expect(formatSigningDate(SIGNED_AT, 'nonsense', 'Africa/Lagos')).toBe('2026-11-19')
  })

  it('derives initials in each style', () => {
    expect(initialsText('  Abdulmalik   Aremu ', 'initials')).toBe('AA')
    expect(initialsText('Abdulmalik Aremu', 'first_name')).toBe('Abdulmalik')
    expect(initialsText('Abdulmalik Aremu', 'last_name')).toBe('Aremu')
    expect(initialsText('Abdulmalik Aremu', 'full_name')).toBe('Abdulmalik Aremu')
    expect(initialsText('abdulmalik olawale aremu', 'initials')).toBe('AOA')
    expect(initialsText('', 'initials')).toBe('')
  })

  it('uses the backend ids for styles and fonts', () => {
    expect(INITIALS_STYLES.map((s) => s.id)).toEqual(['initials', 'first_name', 'last_name', 'full_name'])
    expect(INITIALS_FONTS.map((f) => f.id)).toEqual([
      'great-vibes', 'allura', 'sacramento', 'alex-brush', 'parisienne', 'yellowtail',
      'homemade-apple', 'mr-dafoe', 'la-belle-aurore', 'cedarville-cursive', 'kaushan-script',
      'times-italic', 'helvetica-oblique',
    ])
  })

  it('sends time zone and initials choice with a sign request', () => {
    const payload = buildSignEnvelopePayload({
      signature_id: 'sig-1',
      ...stampRequestOptions({ style: 'full_name', font: 'allura' }),
    })
    expect(payload.initials_style).toBe('full_name')
    expect(payload.initials_font).toBe('allura')
    expect(typeof payload.timezone).toBe('string')
    expect(payload.timezone).not.toBe('')
  })

  it('gives new fields valid settings', () => {
    expect(defaultFieldSettings('date')).toMatchObject({ date_format: 'DD/MM/YYYY', font_family: 'Helvetica' })
    expect(defaultFieldSettings('initials')).toEqual({ required: true })
  })
})

describe('retired text fields', () => {
  it('block sending until removed', () => {
    const fields = {
      d1: {
        f1: { id: 'f1', type: 'text' as const, page: 1, x: 0, y: 0, width: 10, height: 10, assignedTo: '1', documentId: 'd1' },
      },
    }
    const errors = getSendValidationErrors({ uploadedDocuments: [], recipients: [], fieldPositions: fields })
    expect(errors.join(' ')).toMatch(/Add text/)
  })
})
