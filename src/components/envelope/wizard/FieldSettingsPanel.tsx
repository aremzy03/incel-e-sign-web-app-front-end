'use client'

import { Button } from '@/components/ui/button'
import { FieldTypeSettings } from '@/components/envelope/FieldTypeSettings'
import { FIELD_TYPE_LABELS } from '@/components/envelope/field-editor-themes'
import { MaterialIcon } from '@/components/ui/material-icon'
import { useEnvelopeWizard } from './envelope-wizard-context'

interface FieldSettingsPanelProps {
  embedded?: boolean
}

export function FieldSettingsPanel({ embedded = false }: FieldSettingsPanelProps) {
  const {
    activeField,
    recipients,
    setActiveFieldId,
    handleFieldPositionChange,
  } = useEnvelopeWizard()

  if (!activeField || activeField.type === 'signature') return null

  const content = (
    <div className="space-y-3 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-on-surface">Field Properties</div>
          <div className="mt-0.5 text-xs text-muted">{FIELD_TYPE_LABELS[activeField.type]}</div>
        </div>
        {!embedded && (
          <Button variant="ghost" size="icon" aria-label="Close field settings" onClick={() => setActiveFieldId(null)}>
            <MaterialIcon name="close" size={18} />
          </Button>
        )}
      </div>

      <div className="text-xs text-muted">
        Assigned:{' '}
        {recipients.find((r) => r.id.toString() === activeField.assignedTo)?.name || 'Unassigned'}
      </div>

      <FieldTypeSettings
        field={activeField}
        onChange={(patch) => handleFieldPositionChange(activeField.id, patch)}
      />
    </div>
  )

  if (embedded) return content

  return (
    <div className="flex h-full flex-col border-l border-border bg-surface-container-lowest">
      <div className="flex-1 overflow-y-auto p-4">{content}</div>
    </div>
  )
}
