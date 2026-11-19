'use client'

import { AddTextOp } from '@/lib/api/documents'
import { fontCssFamily, TEXT_FONTS } from '@/lib/pdf-edit/fonts'
import { MaterialIcon } from '@/components/ui/material-icon'

interface TextEditToolbarProps {
  op: AddTextOp
  onChange: (patch: Partial<AddTextOp>) => void
  onDelete: () => void
}

export function TextEditToolbar({ op, onChange, onDelete }: TextEditToolbarProps) {
  return (
    <div
      className="absolute bottom-full left-0 z-20 mb-2 flex max-w-[min(100vw-2rem,36rem)] flex-wrap items-center gap-1 rounded-lg border border-border bg-surface-container-lowest p-1 shadow-card"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <label className="sr-only" htmlFor={`font-${op.opId}`}>
        Font
      </label>
      <select
        id={`font-${op.opId}`}
        value={op.font}
        onChange={(event) => onChange({ font: event.target.value as AddTextOp['font'] })}
        className="h-9 rounded-md border border-field-border bg-surface px-2 text-body-sm text-on-surface"
      >
        {TEXT_FONTS.map((font) => (
          <option key={font.id} value={font.id}>
            {font.label}
          </option>
        ))}
      </select>
      <label className="sr-only" htmlFor={`size-${op.opId}`}>
        Size
      </label>
      <input
        id={`size-${op.opId}`}
        type="number"
        min={6}
        max={72}
        value={op.fontSize}
        onChange={(event) => onChange({ fontSize: Number(event.target.value) })}
        className="h-9 w-16 rounded-md border border-border bg-surface px-2 text-body-sm tabular-nums text-on-surface"
      />
      <label className="sr-only" htmlFor={`color-${op.opId}`}>
        Color
      </label>
      <input
        id={`color-${op.opId}`}
        type="color"
        value={op.color}
        onChange={(event) => onChange({ color: event.target.value })}
        className="h-9 w-9 cursor-pointer rounded-md border border-border bg-surface p-1"
      />
      <button
        type="button"
        aria-pressed={op.bold}
        aria-label="Bold"
        onClick={() => onChange({ bold: !op.bold })}
        className="flex h-9 w-9 items-center justify-center rounded-md text-on-surface hover:bg-surface-container"
      >
        <MaterialIcon name="format_bold" size={18} />
      </button>
      <button
        type="button"
        aria-pressed={op.italic}
        aria-label="Italic"
        onClick={() => onChange({ italic: !op.italic })}
        className="flex h-9 w-9 items-center justify-center rounded-md text-on-surface hover:bg-surface-container"
      >
        <MaterialIcon name="format_italic" size={18} />
      </button>
      {(['left', 'center', 'right'] as const).map((align) => (
        <button
          key={align}
          type="button"
          aria-pressed={op.align === align}
          aria-label={`Align ${align}`}
          onClick={() => onChange({ align })}
          className="flex h-9 w-9 items-center justify-center rounded-md text-on-surface hover:bg-surface-container"
        >
          <MaterialIcon name={`format_align_${align}`} size={18} />
        </button>
      ))}
      <button
        type="button"
        aria-label="Delete text"
        onClick={onDelete}
        className="flex h-9 w-9 items-center justify-center rounded-md text-error hover:bg-surface-container"
      >
        <MaterialIcon name="delete" size={18} />
      </button>
    </div>
  )
}
