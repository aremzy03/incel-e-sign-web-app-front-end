'use client'

import { FIELD_TYPES } from '@/types/envelope'
import { FieldPaletteItem } from '@/components/envelope/FieldPaletteItem'
import { FIELD_EDITOR_THEMES } from '@/components/envelope/field-editor-themes'
import { useEnvelopeWizard } from './envelope-wizard-context'

export function FieldPalettePanel() {
  const { uploadedDocuments } = useEnvelopeWizard()
  const disabled = uploadedDocuments.length === 0

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-surface-container-lowest p-4 wizard-custom-scrollbar">
      <h2 className="mb-6 shrink-0 text-label-sm font-medium uppercase tracking-wider text-muted">
        Field Palette
      </h2>
      <div className="space-y-3">
        {FIELD_TYPES.map((fieldType) => {
          const theme = FIELD_EDITOR_THEMES[fieldType.type]
          return (
            <FieldPaletteItem
              key={fieldType.type}
              item={fieldType}
              disabled={disabled}
              compact
              materialIcon={theme.materialIcon}
              colorClass={{
                container: theme.palette,
                icon: theme.icon,
                label: theme.label,
              }}
            />
          )
        })}
        {disabled && (
          <p className="text-xs text-muted">Add documents before placing fields.</p>
        )}
      </div>
      <div className="mt-auto shrink-0 border-t border-border pt-6">
        <p className="text-caption-xs leading-tight text-muted">
          Drag and drop fields onto the document to request information from signers.
        </p>
      </div>
    </div>
  )
}
