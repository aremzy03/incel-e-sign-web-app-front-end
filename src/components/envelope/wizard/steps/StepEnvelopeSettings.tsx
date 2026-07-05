'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { MaterialIcon } from '@/components/ui/material-icon'
import { useEnvelopeWizard } from '../envelope-wizard-context'
import { getRecipientInitials } from '../wizard-utils'

export function StepEnvelopeSettings() {
  const {
    envelopeName,
    setEnvelopeName,
    description,
    setDescription,
    pdfPasswordProtectionEnabled,
    setPdfPasswordProtectionEnabled,
    recipients,
    uploadedDocuments,
    goToStep,
  } = useEnvelopeWizard()

  const sortedRecipients = [...recipients].sort((a, b) => a.order - b.order)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-headline-xl font-semibold text-primary">Envelope Settings</h2>
        <p className="mt-1 text-body-sm text-on-surface-variant">
          Configure security and notification details for your envelope.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 space-y-6 lg:col-span-8">
          <div className="rounded-xl border border-border bg-surface-container-lowest p-6 shadow-sm">
            <div className="mb-4 flex items-center">
              <MaterialIcon name="security" size={22} className="mr-2 text-primary" />
              <h3 className="text-headline-lg font-semibold text-primary">Security Settings</h3>
            </div>
            <div className="flex items-start justify-between rounded-lg bg-primary-light p-4">
              <div className="flex-grow pr-4">
                <h4 className="font-bold text-primary">PDF Password Protection</h4>
                <p className="mt-1 text-body-sm text-on-primary-fixed-variant">
                  Completed PDFs will be password-protected. Password shown after signing.
                </p>
              </div>
              <Switch
                checked={pdfPasswordProtectionEnabled}
                onCheckedChange={setPdfPasswordProtectionEnabled}
                aria-label="Enable PDF password protection"
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface-container-lowest p-6 shadow-sm">
            <div className="mb-4 flex items-center">
              <MaterialIcon name="edit_square" size={22} className="mr-2 text-primary" />
              <h3 className="text-headline-lg font-semibold text-primary">Envelope Details</h3>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="mb-1 block text-label-sm text-on-surface-variant">
                  Envelope Name
                </Label>
                <Input
                  value={envelopeName}
                  onChange={(e) => setEnvelopeName(e.target.value)}
                  className="border-border bg-surface focus-visible:ring-secondary"
                />
              </div>
              <div>
                <Label className="mb-1 block text-label-sm text-on-surface-variant">
                  Description (Internal use only)
                </Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="border-border bg-surface focus-visible:ring-secondary"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 space-y-6 lg:col-span-4">
          <div className="rounded-xl border border-outline-variant bg-surface-container p-6">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center">
                <MaterialIcon name="table_rows" size={20} className="mr-2 text-primary" />
                <h3 className="text-label-sm font-bold uppercase tracking-wider text-primary">
                  Signing Order Summary
                </h3>
              </div>
              <button
                type="button"
                onClick={() => goToStep(2)}
                className="text-label-xs font-bold text-secondary hover:underline"
              >
                Edit
              </button>
            </div>

            <div className="relative space-y-3">
              <div className="absolute bottom-4 left-4 top-4 w-0.5 bg-outline-variant" />
              {sortedRecipients.map((recipient, index) => (
                <div
                  key={recipient.id}
                  className="relative flex items-center rounded-lg border border-border bg-surface-container-lowest p-3"
                >
                  <div className="z-10 mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-label-xs font-bold text-on-secondary">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body-sm font-bold text-primary">
                      {recipient.name || recipient.email}
                    </p>
                    <p className="truncate text-caption-xs text-on-surface-variant">
                      {recipient.email}
                    </p>
                  </div>
                  <div
                    className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                    style={{ backgroundColor: `${recipient.color}22`, color: recipient.color }}
                  >
                    {getRecipientInitials(recipient.name, recipient.email)}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 border-t border-outline-variant pt-6">
              <p className="text-caption-xs text-on-surface-variant">
                Total Documents: {uploadedDocuments.length}{' '}
                {uploadedDocuments.length === 1 ? 'Document' : 'Documents'}
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-primary p-6 text-on-primary shadow-md">
            <div className="mb-3 flex items-center gap-2">
              <MaterialIcon name="lightbulb" size={20} className="text-secondary-fixed" />
              <p className="text-label-sm font-medium text-secondary-fixed">Final Step Tips</p>
            </div>
            <ul className="space-y-2 text-body-sm opacity-80">
              <li className="flex gap-2">
                <MaterialIcon name="lightbulb" size={16} className="mt-0.5 shrink-0" />
                Review all details on the next step before sending for signature.
              </li>
              <li className="flex gap-2">
                <MaterialIcon name="lightbulb" size={16} className="mt-0.5 shrink-0" />
                Password protection adds a second layer of legal verification.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
