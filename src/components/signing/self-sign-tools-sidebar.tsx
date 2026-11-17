'use client'

import { MaterialIcon } from '@/components/ui/material-icon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SelfSignFieldTool } from '@/components/signing/self-sign-field-tool'
import { cn } from '@/lib/utils'
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
  onClose?: () => void
  onChangeDocument?: () => void
}

const PRIMARY_TOOLS = [
  { type: 'signature', label: 'Signature', description: 'Your signature', icon: 'edit_square' },
  { type: 'initials', label: 'Initials', description: 'Your initials', icon: 'gesture' },
  { type: 'date', label: 'Date', description: 'A date on the page', icon: 'calendar_today' },
] as const

const MORE_TOOLS = [
  { type: 'text', label: 'Text', description: 'A line of text', icon: 'text_fields' },
  { type: 'designation', label: 'Designation', description: 'Job title on the page', icon: 'badge' },
] as const

export const selfSignCommitButtonClass =
  'flex h-12 items-center justify-center gap-2 rounded-xl bg-primary font-label-sm text-on-primary shadow-authority transition-transform duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-primary-hover active:translate-y-0 active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-your-turn focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:scale-100 motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100'

const iconButtonClass =
  'flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:bg-surface-container hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-your-turn focus-visible:ring-offset-2'

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
  onClose,
  onChangeDocument,
}: SelfSignToolsSidebarProps) {
  const showFieldSettings =
    activeField && activeField.type !== 'signature' && onFieldSettingsChange

  return (
    <aside className="z-20 flex h-full w-[300px] max-w-full shrink-0 flex-col border-l border-border bg-surface-container-lowest">
      <div className="border-b border-border p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-headline-lg text-headline-lg text-primary">
              <MaterialIcon name="handyman" size={22} className="text-secondary" />
              Your Tools
            </h2>
            <p className="mt-1 font-body-sm text-body-sm text-muted">Drag tools or click to apply</p>
          </div>
          {onClose ? (
            <button type="button" onClick={onClose} className={iconButtonClass} aria-label="Close fields">
              <MaterialIcon name="close" size={20} />
            </button>
          ) : null}
        </div>
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
          <div className="mb-4 font-label-xs text-muted">More fields</div>
          <div className="space-y-3">
            {MORE_TOOLS.map((tool) => (
              <SelfSignFieldTool
                key={tool.type}
                fieldType={tool.type}
                label={tool.label}
                description={tool.description}
                icon={tool.icon}
                disabled={!hasDocuments}
                onClick={() => onAddField(tool.type)}
              />
            ))}
          </div>
        </div>

        {showFieldSettings ? (
          <div className="rounded-xl border border-border bg-surface-container-low p-4 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="font-label-sm text-on-surface">Field settings</div>
                <div className="font-caption-xs capitalize text-muted">{activeField.type}</div>
              </div>
              {onClearActiveField ? (
                <button
                  type="button"
                  onClick={onClearActiveField}
                  className={iconButtonClass}
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
                    onClick={() => onFieldSettingsChange(activeField.id, { required: true })}
                  >
                    Yes
                  </Button>
                  <Button
                    type="button"
                    variant={!activeField.required ? 'default' : 'outline'}
                    onClick={() => onFieldSettingsChange(activeField.id, { required: false })}
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
                    onValueChange={(v) => onFieldSettingsChange(activeField.id, { font_family: v })}
                  >
                    <SelectTrigger className="h-10 text-xs">
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
                    className="h-10 text-xs"
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
                  className="h-10 text-xs"
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
                    onValueChange={(v) => onFieldSettingsChange(activeField.id, { date_format: v })}
                  >
                    <SelectTrigger className="h-10 text-xs">
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
                      className="h-10 text-xs"
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
                      className="h-10 text-xs"
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
              {activeField.type === 'designation' ? (
                <div>
                  <Label className="text-xs">Max length</Label>
                  <Input
                    type="number"
                    className="h-10 text-xs"
                    value={activeField.max_length ?? ''}
                    onChange={(e) =>
                      onFieldSettingsChange(activeField.id, {
                        max_length: Number(e.target.value) || undefined,
                      })
                    }
                  />
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <div className="border-t border-border bg-surface-container-low p-6">
        {validationMessage ? <p className="mb-3 text-xs text-error">{validationMessage}</p> : null}
        <div className="flex flex-col gap-3">
          {onChangeDocument ? (
            <button
              type="button"
              onClick={onChangeDocument}
              className="flex h-10 w-full items-center justify-center rounded-xl border border-outline-variant bg-surface-container-lowest font-label-sm text-primary hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-your-turn focus-visible:ring-offset-2"
            >
              Change document
            </button>
          ) : null}
          <button
            type="button"
            onClick={onSignComplete}
            disabled={signing || hasValidationErrors}
            className={cn(selfSignCommitButtonClass, 'w-full')}
          >
            {signing ? 'Signing…' : 'Sign & Complete'}
            <MaterialIcon name="check_circle" size={20} />
          </button>
        </div>
      </div>
    </aside>
  )
}
