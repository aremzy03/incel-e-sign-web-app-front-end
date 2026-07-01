'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
          <div className="mt-0.5 text-xs capitalize text-muted">{activeField.type}</div>
        </div>
        {!embedded && (
          <Button variant="ghost" size="icon" onClick={() => setActiveFieldId(null)}>
            <MaterialIcon name="close" size={18} />
          </Button>
        )}
      </div>

      <div className="text-xs text-muted">
        Assigned:{' '}
        {recipients.find((r) => r.id.toString() === activeField.assignedTo)?.name || 'Unassigned'}
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Required</Label>
        <div className="flex gap-2">
          <Button
            variant={activeField.required ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFieldPositionChange(activeField.id, { required: true })}
          >
            Yes
          </Button>
          <Button
            variant={!activeField.required ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFieldPositionChange(activeField.id, { required: false })}
          >
            No
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Font family</Label>
          <Select
            value={activeField.font_family || ''}
            onValueChange={(v) => handleFieldPositionChange(activeField.id, { font_family: v })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select font" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Helvetica">Helvetica</SelectItem>
              <SelectItem value="Arial">Arial</SelectItem>
              <SelectItem value="Times New Roman">Times New Roman</SelectItem>
              <SelectItem value="Courier New">Courier New</SelectItem>
              <SelectItem value="Roboto">Roboto</SelectItem>
              <SelectItem value="Inter">Inter</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Font size</Label>
          <Input
            type="number"
            className="h-8 text-xs"
            value={activeField.font_size ?? ''}
            onChange={(e) =>
              handleFieldPositionChange(activeField.id, {
                font_size: Number(e.target.value) || undefined,
              })
            }
          />
        </div>
      </div>

      <div>
        <Label className="text-xs">Prefill value</Label>
        <Input
          className="h-8 text-xs"
          value={activeField.prefill_value ?? ''}
          onChange={(e) =>
            handleFieldPositionChange(activeField.id, { prefill_value: e.target.value })
          }
        />
      </div>

      {activeField.type === 'date' && (
        <div>
          <Label className="text-xs">Date format</Label>
          <Select
            value={activeField.date_format || ''}
            onValueChange={(v) => handleFieldPositionChange(activeField.id, { date_format: v })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
              <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {activeField.type === 'text' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Placeholder</Label>
            <Input
              className="h-8 text-xs"
              value={activeField.placeholder || ''}
              onChange={(e) =>
                handleFieldPositionChange(activeField.id, { placeholder: e.target.value })
              }
            />
          </div>
          <div>
            <Label className="text-xs">Max length</Label>
            <Input
              type="number"
              className="h-8 text-xs"
              value={activeField.max_length ?? ''}
              onChange={(e) =>
                handleFieldPositionChange(activeField.id, {
                  max_length: Number(e.target.value) || undefined,
                })
              }
            />
          </div>
        </div>
      )}

      {activeField.type === 'designation' && (
        <div>
          <Label className="text-xs">Max length</Label>
          <Input
            type="number"
            className="h-8 text-xs"
            value={activeField.max_length ?? ''}
            onChange={(e) =>
              handleFieldPositionChange(activeField.id, {
                max_length: Number(e.target.value) || undefined,
              })
            }
          />
        </div>
      )}
    </div>
  )

  if (embedded) return content

  return (
    <div className="flex h-full flex-col border-l border-border bg-surface-container-lowest">
      <div className="flex-1 overflow-y-auto p-4">{content}</div>
    </div>
  )
}
