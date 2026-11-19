'use client'

import type { ReactNode } from 'react'
import { MaterialIcon } from '@/components/ui/material-icon'
import { FieldTypeSettings } from '@/components/envelope/FieldTypeSettings'
import { FIELD_TYPE_LABELS } from '@/components/envelope/field-editor-themes'
import { InitialsPicker } from '@/components/signing/initials-picker'
import { SelfSignFieldTool } from '@/components/signing/self-sign-field-tool'
import type { InitialsChoice } from '@/lib/fields/stamps'
import { cn } from '@/lib/utils'
import type { CreatableFieldType, FieldPosition } from '@/types/envelope'

export const SIGN_TOOLS: Array<{ type: CreatableFieldType; label: string; description: string; icon: string }> = [
  { type: 'signature', label: 'Signature', description: 'Your saved signature', icon: 'edit_square' },
  { type: 'initials', label: 'Initials', description: 'In the style you pick below', icon: 'gesture' },
  { type: 'date', label: 'Date signed', description: 'Added when you sign', icon: 'calendar_today' },
  { type: 'designation', label: 'Designation', description: 'Your job title', icon: 'badge' },
]

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-your-turn focus-visible:ring-offset-2'

export const primaryActionClass = cn(
  'flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-label-sm text-on-primary shadow-authority',
  'transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50',
  focusRing,
)

export const secondaryActionClass = cn(
  'flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest',
  'font-label-sm text-primary transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-50',
  focusRing,
)

export interface EditorToolsSidebarProps {
  /** Add text. `null` hides the group; a string explains why editing is unavailable. */
  edit: {
    placing: boolean
    onTogglePlacing: () => void
    unavailableReason?: string | null
    /** Present when existing text can be rewritten (plan-full-text-rewrite). */
    rewrite?: {
      reading: boolean
      changeCount: number
      noEditableText: boolean
      /** Pages whose text is in too many pieces to edit. */
      tooManyPiecesPages: number[]
      findOpen: boolean
      onToggleFind: () => void
      /** The find & replace panel, rendered under the tools while open. */
      findPanel: ReactNode
    } | null
  } | null
  /** Sign tools. `null` hides the group (e.g. preparing a document in the envelope wizard). */
  sign: {
    onAddField: (type: CreatableFieldType) => void
    activeField: FieldPosition | null
    onFieldChange: (fieldId: string, patch: Partial<FieldPosition>) => void
    onClearActiveField: () => void
    initials: { fullName: string | null | undefined; choice: InitialsChoice; onChange: (next: InitialsChoice) => void } | null
  } | null
  /** Shown above the actions. */
  message?: string | null
  saveEdits?: { visible: boolean; saving: boolean; onSave: () => void; onDiscard: () => void }
  signComplete?: { disabled: boolean; busyLabel: string | null; onSign: () => void }
  /** Wizard mode: one action that saves and returns. */
  done?: { label: string; busy: boolean; onDone: () => void }
  onClose?: () => void
  className?: string
}

export function EditorToolsSidebar({
  edit,
  sign,
  message,
  saveEdits,
  signComplete,
  done,
  onClose,
  className,
}: EditorToolsSidebarProps) {
  const activeField = sign?.activeField && sign.activeField.type !== 'signature' ? sign.activeField : null

  return (
    <aside
      aria-label="Editing tools"
      className={cn(
        'z-20 flex h-full w-[300px] max-w-full shrink-0 flex-col border-l border-border bg-surface-container-lowest',
        className,
      )}
    >
      {onClose ? (
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-label-sm text-on-surface">Tools</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close tools"
            className={cn('flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:bg-surface-container', focusRing)}
          >
            <MaterialIcon name="close" size={20} />
          </button>
        </div>
      ) : null}

      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        {/* The selected field's settings come first so they're in view. */}
        {sign && activeField ? (
          <section className="rounded-xl border border-border bg-surface-container-low p-4 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="font-label-sm text-on-surface">Field settings</div>
                <div className="text-xs text-muted">{FIELD_TYPE_LABELS[activeField.type]}</div>
              </div>
              <button
                type="button"
                onClick={sign.onClearActiveField}
                aria-label="Close field settings"
                className={cn('flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:bg-surface-container', focusRing)}
              >
                <MaterialIcon name="close" size={18} />
              </button>
            </div>
            <FieldTypeSettings
              field={activeField}
              signerLabel="you"
              onChange={(patch) => sign.onFieldChange(activeField.id, patch)}
            />
          </section>
        ) : null}
        {edit ? (
          <section aria-labelledby="editor-edit-tools" className="space-y-3">
            <h2 id="editor-edit-tools" className="px-1 font-label-xs uppercase tracking-wide text-muted">
              Edit document
            </h2>
            {edit.unavailableReason ? (
              <p className="rounded-lg bg-surface-container px-3 py-2 text-xs text-on-surface-variant">
                {edit.unavailableReason}
              </p>
            ) : (
              <>
                {edit.rewrite ? (
                  <div className="flex w-full items-start gap-3 rounded-xl border border-border bg-surface-container-lowest p-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-container text-on-surface-variant">
                      <MaterialIcon name="edit" size={22} />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-label-sm text-on-surface">Edit text</span>
                      <span className="block text-xs text-muted">
                        {edit.rewrite.reading
                          ? 'Reading the document’s text…'
                          : edit.rewrite.noEditableText
                            ? 'No editable text found. You can still add text.'
                            : 'Click any word on the page to change or delete it.'}
                      </span>
                      {edit.rewrite.changeCount > 0 ? (
                        <span className="mt-1 block text-xs font-medium text-your-turn-text">
                          {edit.rewrite.changeCount} text {edit.rewrite.changeCount === 1 ? 'change' : 'changes'} not saved yet
                        </span>
                      ) : null}
                      {edit.rewrite.tooManyPiecesPages.length > 0 ? (
                        <span className="mt-1 block text-xs text-warning-text">
                          {edit.rewrite.tooManyPiecesPages.length === 1
                            ? `Page ${edit.rewrite.tooManyPiecesPages[0]} has`
                            : `Pages ${edit.rewrite.tooManyPiecesPages.join(', ')} have`}{' '}
                          too many text pieces to edit. You can still add text there.
                        </span>
                      ) : null}
                    </span>
                  </div>
                ) : null}
                {edit.rewrite && !edit.rewrite.noEditableText ? (
                  edit.rewrite.findOpen ? (
                    edit.rewrite.findPanel
                  ) : (
                    <button
                      type="button"
                      onClick={edit.rewrite.onToggleFind}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl border border-border bg-surface-container-lowest p-4 text-left shadow-card transition-colors hover:border-secondary',
                        focusRing,
                      )}
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container text-on-surface-variant">
                        <MaterialIcon name="search" size={22} />
                      </span>
                      <span>
                        <span className="block font-label-sm text-on-surface">Find & replace</span>
                        <span className="block text-xs text-muted">Change a word everywhere it appears</span>
                      </span>
                    </button>
                  )
                ) : null}
                <button
                  type="button"
                  aria-pressed={edit.placing}
                  onClick={edit.onTogglePlacing}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border p-4 text-left shadow-card transition-colors',
                    edit.placing
                      ? 'border-primary bg-primary text-on-primary'
                      : 'border-border bg-surface-container-lowest hover:border-secondary',
                    focusRing,
                  )}
                >
                  <span
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg',
                      edit.placing ? 'bg-primary-hover' : 'bg-surface-container text-on-surface-variant',
                    )}
                  >
                    <MaterialIcon name="text_fields" size={22} />
                  </span>
                  <span>
                    <span className="block font-label-sm">Add text</span>
                    <span className={cn('block text-xs', edit.placing ? 'text-on-primary/80' : 'text-muted')}>
                      {edit.placing ? 'Click the page to place a box' : 'Type anywhere on the page'}
                    </span>
                  </span>
                </button>
              </>
            )}
          </section>
        ) : null}

        {sign ? (
          <section aria-labelledby="editor-sign-tools" className="space-y-3">
            <h2 id="editor-sign-tools" className="px-1 font-label-xs uppercase tracking-wide text-muted">
              Sign
            </h2>
            <p className="px-1 text-xs text-muted">Drag onto the page, or click to add to the page you’re viewing.</p>
            {SIGN_TOOLS.map((tool) => (
              <SelfSignFieldTool
                key={tool.type}
                fieldType={tool.type}
                label={tool.label}
                description={tool.description}
                icon={tool.icon}
                highlighted={tool.type === 'signature'}
                onClick={() => sign.onAddField(tool.type)}
              />
            ))}
          </section>
        ) : null}

        {sign?.initials ? (
          <section
            aria-labelledby="editor-initials-title"
            className="rounded-xl border border-border bg-surface-container-low p-4"
          >
            <h3 id="editor-initials-title" className="mb-3 font-label-sm text-on-surface">
              Your initials
            </h3>
            <InitialsPicker
              fullName={sign.initials.fullName}
              value={sign.initials.choice}
              onChange={sign.initials.onChange}
            />
          </section>
        ) : null}

      </div>

      <div className="space-y-3 border-t border-border bg-surface-container-low p-4">
        {message ? <p className="text-xs text-error-text">{message}</p> : null}
        {saveEdits?.visible ? (
          <button type="button" onClick={saveEdits.onSave} disabled={saveEdits.saving} className={secondaryActionClass}>
            {saveEdits.saving ? 'Saving…' : 'Save changes'}
          </button>
        ) : null}
        {saveEdits?.visible && !saveEdits.saving ? (
          <button
            type="button"
            onClick={saveEdits.onDiscard}
            className={cn('w-full rounded-lg py-1 text-center text-xs text-muted hover:text-on-surface', focusRing)}
          >
            Discard unsaved text
          </button>
        ) : null}
        {signComplete ? (
          <button type="button" onClick={signComplete.onSign} disabled={signComplete.disabled} className={primaryActionClass}>
            {signComplete.busyLabel ?? 'Sign & complete'}
            {signComplete.busyLabel ? null : <MaterialIcon name="check_circle" size={20} />}
          </button>
        ) : null}
        {done ? (
          <button type="button" onClick={done.onDone} disabled={done.busy} className={primaryActionClass}>
            {done.busy ? 'Saving…' : done.label}
          </button>
        ) : null}
      </div>
    </aside>
  )
}
