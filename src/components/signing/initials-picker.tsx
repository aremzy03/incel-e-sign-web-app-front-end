'use client'

import { cn } from '@/lib/utils'
import {
  INITIALS_FONTS,
  INITIALS_STYLES,
  initialsFontStyle,
  initialsText,
  type InitialsChoice,
} from '@/lib/fields/stamps'

interface InitialsPickerProps {
  /** The signer's account name; the server derives the text from the same name. */
  fullName: string | null | undefined
  value: InitialsChoice
  onChange: (next: InitialsChoice) => void
  className?: string
}

/** Lets the signer pick what their initials say and which handwriting font draws them. */
export function InitialsPicker({ fullName, value, onChange, className }: InitialsPickerProps) {
  const sample = initialsText(fullName, value.style) || 'AA'

  return (
    <div className={cn('space-y-4', className)}>
      <fieldset>
        <legend className="mb-2 text-xs font-medium text-on-surface">Show as</legend>
        <div className="grid grid-cols-2 gap-2">
          {INITIALS_STYLES.map((style) => {
            const selected = value.style === style.id
            return (
              <button
                key={style.id}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange({ ...value, style: style.id })}
                className={cn(
                  'min-w-0 rounded-lg border px-2 py-1.5 text-left text-xs transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-your-turn focus-visible:ring-offset-2',
                  selected
                    ? 'border-primary bg-primary text-on-primary'
                    : 'border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low',
                )}
              >
                <span className="block font-medium">{style.label}</span>
                <span className={cn('block truncate', selected ? 'text-on-primary/80' : 'text-muted')}>
                  {initialsText(fullName, style.id) || '—'}
                </span>
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-xs font-medium text-on-surface">Handwriting</legend>
        <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto pr-1">
          {INITIALS_FONTS.map((font) => {
            const selected = value.font === font.id
            return (
              <button
                key={font.id}
                type="button"
                aria-pressed={selected}
                aria-label={`${font.label}: ${sample}`}
                onClick={() => onChange({ ...value, font: font.id })}
                className={cn(
                  'flex h-14 min-w-0 flex-col items-center justify-center rounded-lg border px-2 transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-your-turn focus-visible:ring-offset-2',
                  selected
                    ? 'border-primary bg-surface-container-low ring-1 ring-primary'
                    : 'border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low',
                )}
              >
                <span className="max-w-full truncate text-xl leading-tight text-on-surface" style={initialsFontStyle(font.id)}>
                  {sample}
                </span>
                <span className="max-w-full truncate text-xs text-muted">{font.label}</span>
              </button>
            )
          })}
        </div>
      </fieldset>
    </div>
  )
}
