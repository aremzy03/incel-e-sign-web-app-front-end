'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  DATE_FORMATS,
  FIELD_TEXT_FONTS,
  NEW_FIELD_DATE_FORMAT,
  TEXT_FIELD_RETIRED_MESSAGE,
  formatSigningDate,
} from '@/lib/fields/stamps'
import type { FieldPosition } from '@/types/envelope'

interface FieldTypeSettingsProps {
  field: FieldPosition
  onChange: (patch: Partial<FieldPosition>) => void
  /** Wording for who fills server-side values: "the signer" or "you". */
  signerLabel?: string
}

/**
 * Settings for non-signature fields, shared by the envelope wizard and
 * self-sign. Only offers what the server actually honours: date and initials
 * are filled at signing time, so they have no value to type here.
 */
export function FieldTypeSettings({ field, onChange, signerLabel = 'the signer' }: FieldTypeSettingsProps) {
  if (field.type === 'signature') return null
  const you = signerLabel === 'you'
  const signs = you ? 'sign' : 'signs'

  if (field.type === 'text') {
    return (
      <p role="alert" className="rounded-lg bg-error-light px-3 py-2 text-xs text-error-text">
        {TEXT_FIELD_RETIRED_MESSAGE}
      </p>
    )
  }

  if (field.type === 'initials') {
    return (
      <p className="text-xs text-muted">
        {you
          ? 'Filled from your name when you sign. Pick initials, first name, last name or full name, and a handwriting font, under Your initials.'
          : 'Filled when the signer signs, from their name. They choose initials, first name, last name or full name, and a handwriting font.'}
      </p>
    )
  }

  const fontControls = (
    <div className="grid grid-cols-2 gap-2">
      <div>
        <Label className="text-xs">Font</Label>
        <Select value={field.font_family || 'Helvetica'} onValueChange={(v) => onChange({ font_family: v })}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Select font" />
          </SelectTrigger>
          <SelectContent>
            {FIELD_TEXT_FONTS.map((font) => (
              <SelectItem key={font.id} value={font.id}>
                {font.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Max size</Label>
        <Input
          type="number"
          min={6}
          max={48}
          className="h-8 text-xs"
          value={field.font_size ?? ''}
          onChange={(e) => onChange({ font_size: Number(e.target.value) || undefined })}
        />
      </div>
      <p className="col-span-2 text-xs text-muted">Text shrinks to fit the box when it is too long.</p>
    </div>
  )

  if (field.type === 'date') {
    const today = new Date()
    return (
      <div className="space-y-3">
        <p className="text-xs text-muted">
          Filled with the date {signerLabel} {signs}, in {you ? 'your' : 'their'} time zone.
        </p>
        <div>
          <Label className="text-xs">Date format</Label>
          <Select
            value={field.date_format || NEW_FIELD_DATE_FORMAT}
            onValueChange={(v) => onChange({ date_format: v })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              {DATE_FORMATS.map((format) => (
                <SelectItem key={format} value={format}>
                  {formatSigningDate(today, format)}
                  <span className="ml-2 text-muted">{format}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {fontControls}
      </div>
    )
  }

  // designation
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">Required</Label>
        <div className="flex gap-2">
          <Button variant={field.required ? 'default' : 'outline'} size="sm" onClick={() => onChange({ required: true })}>
            Yes
          </Button>
          <Button variant={!field.required ? 'default' : 'outline'} size="sm" onClick={() => onChange({ required: false })}>
            No
          </Button>
        </div>
      </div>
      <div>
        <Label className="text-xs">Value</Label>
        <Input
          className="h-8 text-xs"
          placeholder="e.g. Head of Operations"
          maxLength={field.max_length || undefined}
          value={field.prefill_value ?? ''}
          onChange={(e) => onChange({ prefill_value: e.target.value })}
        />
      </div>
      <div>
        <Label className="text-xs">Max length</Label>
        <Input
          type="number"
          className="h-8 text-xs"
          value={field.max_length ?? ''}
          onChange={(e) => onChange({ max_length: Number(e.target.value) || undefined })}
        />
      </div>
      {fontControls}
    </div>
  )
}
