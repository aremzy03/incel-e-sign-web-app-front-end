'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { RecipientSearch } from '@/components/contacts/RecipientSearch'
import { MaterialIcon } from '@/components/ui/material-icon'
import { EnvelopeWizardStepper } from '../EnvelopeWizardStepper'
import { useEnvelopeWizard } from '../envelope-wizard-context'
import { getRecipientInitials } from '../wizard-utils'

export function StepAddRecipients() {
  const {
    recipients,
    envelopeName,
    setEnvelopeName,
    description,
    setDescription,
    addRecipient,
    removeRecipient,
    reorderRecipient,
  } = useEnvelopeWizard()

  const sortedRecipients = [...recipients].sort((a, b) => a.order - b.order)

  return (
    <div className="space-y-8">
      <EnvelopeWizardStepper variant="centered" className="mb-4" />

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 space-y-6 lg:col-span-4">
          <div className="rounded-xl border border-border bg-surface-container-lowest p-6 shadow-sm">
            <h3 className="mb-4 text-headline-lg font-semibold text-primary">Envelope Details</h3>
            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="envelope-name"
                  className="mb-1.5 block text-label-sm text-on-surface-variant"
                >
                  Envelope Name
                </Label>
                <Input
                  id="envelope-name"
                  value={envelopeName}
                  onChange={(e) => setEnvelopeName(e.target.value)}
                  placeholder="e.g. Q4 Commercial Lease Agreement"
                  className="border-outline-variant bg-background focus-visible:ring-secondary"
                />
              </div>
              <div>
                <Label
                  htmlFor="envelope-description"
                  className="mb-1.5 block text-label-sm text-on-surface-variant"
                >
                  Internal Description
                </Label>
                <Textarea
                  id="envelope-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief summary for internal tracking..."
                  rows={4}
                  className="border-outline-variant bg-background focus-visible:ring-secondary"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-primary p-6 text-on-primary shadow-md">
            <div className="mb-2 flex items-center gap-3">
              <MaterialIcon name="info" size={20} className="text-secondary-fixed" />
              <p className="text-label-sm font-medium text-secondary-fixed">Sequential Signing</p>
            </div>
            <p className="text-body-sm leading-relaxed opacity-80">
              Signers will sign one at a time in the specified order. Once a recipient completes
              their action, the document is automatically routed to the next person.
            </p>
          </div>
        </div>

        <div className="col-span-12 space-y-6 lg:col-span-8">
          <div className="rounded-xl border border-border bg-surface-container-lowest p-8 shadow-sm">
            <div className="mb-8 flex items-center justify-between">
              <h3 className="text-headline-lg font-semibold text-primary">Signing Order</h3>
              <span className="text-label-sm text-muted">{recipients.length} signer(s)</span>
            </div>

            {sortedRecipients.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">No recipients added yet.</p>
            ) : (
              <div className="relative space-y-6">
                {sortedRecipients.map((recipient, index) => {
                  const isLast = index === sortedRecipients.length - 1
                  const orderNumber = index + 1
                  return (
                    <div
                      key={recipient.id}
                      className={`relative flex items-start gap-6 ${
                        isLast ? 'signing-order-line-last' : 'signing-order-line'
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <div
                          className={`z-10 flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold shadow-sm ${
                            orderNumber === 1
                              ? 'bg-secondary text-on-secondary'
                              : 'border-2 border-primary-container bg-primary-container text-on-primary-container'
                          }`}
                        >
                          {orderNumber}
                        </div>
                      </div>

                      <div className="group flex flex-1 items-center gap-4 rounded-xl border border-outline-variant bg-background p-4 transition-all hover:shadow-md">
                        <div className="text-outline-variant group-hover:text-on-surface-variant">
                          <MaterialIcon name="drag_indicator" size={22} />
                        </div>
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-outline text-sm font-bold text-primary"
                          style={{ backgroundColor: `${recipient.color}22` }}
                        >
                          {getRecipientInitials(recipient.name, recipient.email)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-label-sm font-medium text-primary">
                            {recipient.name || recipient.email}
                          </p>
                          <p className="truncate text-caption-xs text-on-surface-variant">
                            {recipient.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={index === 0}
                            onClick={() => reorderRecipient(recipient.id, 'up')}
                            aria-label="Move recipient up"
                          >
                            <MaterialIcon name="expand_more" size={18} className="rotate-180" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={index === sortedRecipients.length - 1}
                            onClick={() => reorderRecipient(recipient.id, 'down')}
                            aria-label="Move recipient down"
                          >
                            <MaterialIcon name="expand_more" size={18} />
                          </Button>
                          <button
                            type="button"
                            onClick={() => removeRecipient(recipient.id)}
                            className="text-error opacity-0 transition-opacity group-hover:opacity-100"
                            aria-label="Remove recipient"
                          >
                            <MaterialIcon name="delete" size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="mt-10 border-t border-dashed border-outline-variant pt-8">
              <Label className="mb-1.5 block text-label-sm text-on-surface-variant">
                Add New Recipient
              </Label>
              <RecipientSearch
                onSelect={(r) => {
                  addRecipient({ email: r.email, name: r.name })
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
