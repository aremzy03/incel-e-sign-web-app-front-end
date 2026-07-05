'use client'

import Link from 'next/link'
import { MaterialIcon } from '@/components/ui/material-icon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SelfSignFieldTool } from '@/components/signing/self-sign-field-tool'
import type { FieldPosition } from '@/types/envelope'

interface SelfSignToolsSidebarProps {
  hasDocuments: boolean
  signing: boolean
  hasValidationErrors: boolean
  validationMessage?: string | null
  onSignComplete: () => void
  onAddField: (fieldType: string) => void
  activeField?: FieldPosition | null
  onFieldSettingsChange?: (fieldId: string, position: Partial<FieldPosition>) => void
  onClearActiveField?: () => void
}

const PRIMARY_TOOLS = [
  { type: 'signature', label: 'Signature', description: 'Personal signature', icon: 'edit_square' },
  { type: 'initials', label: 'Initials', description: 'Mark each page', icon: 'vitals' },
  { type: 'date', label: 'Date', description: 'Auto-filled date', icon: 'calendar_today' },
] as const

export function SelfSignToolsSidebar({
  hasDocuments,
  signing,
  hasValidationErrors,
  validationMessage,
  onSignComplete,
  onAddField,
  activeField,
  onFieldSettingsChange,
  onClearActiveField,
}: SelfSignToolsSidebarProps) {
  const showFieldSettings =
    activeField && activeField.type !== 'signature' && onFieldSettingsChange

  return (
    <aside className="z-20 flex w-[300px] shrink-0 flex-col border-l border-border bg-surface-container-lowest">
      <div className="border-b border-border p-6">
        <h3 className="flex items-center gap-2 font-headline-lg text-headline-lg text-primary">
          <MaterialIcon name="handyman" size={22} className="text-secondary" />
          Your Tools
        </h3>
        <p className="mt-1 font-body-sm text-body-sm text-muted">Drag tools or click to apply</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {PRIMARY_TOOLS.map((tool) => (
          <SelfSignFieldTool
            key={tool.type}
            fieldType={tool.type}
            label={tool.label}
            description={tool.description}
            icon={tool.icon}
            disabled={!hasDocuments}
            highlighted={tool.type === 'signature'}
            onClick={() => onAddField(tool.type)}
          />
        ))}

        <div className="px-2 pb-2 pt-6">
          <div className="mb-4 text-[11px] font-bold uppercase tracking-widest text-muted">
            Text &amp; Fields
          </div>
          <SelfSignFieldTool
            fieldType="text"
            label="Text Input"
            icon="text_fields"
            disabled={!hasDocuments}
            onClick={() => onAddField('text')}
          />
        </div>

        {showFieldSettings ? (
          <div className="rounded-xl border border-border bg-surface-container-low p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="font-label-sm text-on-surface">Field settings</div>
                <div className="text-[11px] capitalize text-muted">{activeField.type}</div>
              </div>
              {onClearActiveField ? (
                <button
                  type="button"
                  onClick={onClearActiveField}
                  className="text-muted hover:text-on-surface"
                  aria-label="Close field settings"
                >
                  <MaterialIcon name="close" size={18} />
                </button>
              ) : null}
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Required</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={activeField.required ? 'default' : 'outline'}
                    size="sm"
                    onClick={() =>
                      onFieldSettingsChange(activeField.id, { required: true })
                    }
                  >
                    Yes
                  </Button>
                  <Button
                    type="button"
                    variant={!activeField.required ? 'default' : 'outline'}
                    size="sm"
                    onClick={() =>
                      onFieldSettingsChange(activeField.id, { required: false })
                    }
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
                    onValueChange={(v) =>
                      onFieldSettingsChange(activeField.id, { font_family: v })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Font" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Helvetica">Helvetica</SelectItem>
                      <SelectItem value="Arial">Arial</SelectItem>
                      <SelectItem value="Times New Roman">Times New Roman</SelectItem>
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
                      onFieldSettingsChange(activeField.id, {
                        font_size: Number(e.target.value) || undefined,
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Value</Label>
                <Input
                  className="h-8 text-xs"
                  value={activeField.prefill_value ?? ''}
                  onChange={(e) =>
                    onFieldSettingsChange(activeField.id, { prefill_value: e.target.value })
                  }
                />
              </div>
              {activeField.type === 'date' ? (
                <div>
                  <Label className="text-xs">Date format</Label>
                  <Select
                    value={activeField.date_format || ''}
                    onValueChange={(v) =>
                      onFieldSettingsChange(activeField.id, { date_format: v })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              {activeField.type === 'text' ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Placeholder</Label>
                    <Input
                      className="h-8 text-xs"
                      value={activeField.placeholder || ''}
                      onChange={(e) =>
                        onFieldSettingsChange(activeField.id, { placeholder: e.target.value })
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
                        onFieldSettingsChange(activeField.id, {
                          max_length: Number(e.target.value) || undefined,
                        })
                      }
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <div className="border-t border-border bg-surface-container-low p-6">
        {validationMessage ? (
          <p className="mb-3 text-[11px] text-error">{validationMessage}</p>
        ) : null}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onSignComplete}
            disabled={signing || hasValidationErrors}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-status-your-turn py-4 font-label-sm text-white shadow-lg shadow-status-your-turn/20 transition-all hover:bg-accent-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {signing ? 'Signing…' : 'Sign & Complete'}
            <MaterialIcon name="check_circle" size={20} />
          </button>
          <Link
            href="/dashboard/envelopes/create"
            className="py-2 text-center font-label-sm text-muted transition-colors hover:text-primary"
          >
            Send for Signature Instead
          </Link>
        </div>
      </div>
    </aside>
  )
}
