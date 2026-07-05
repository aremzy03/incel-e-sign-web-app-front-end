'use client'

import { MaterialIcon } from '@/components/ui/material-icon'
import { useEnvelopeWizard } from '../envelope-wizard-context'
import { countRecipientFields, formatFileSize, getRecipientInitials } from '../wizard-utils'

export function StepReviewSend() {
  const {
    uploadedDocuments,
    recipients,
    fieldPositions,
    envelopeName,
    description,
    pdfPasswordProtectionEnabled,
    sendValidationErrors,
    goToStep,
  } = useEnvelopeWizard()

  const sortedRecipients = [...recipients].sort((a, b) => a.order - b.order)

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="text-headline-2xl font-semibold text-primary">Final Review</h3>
        <p className="mt-2 text-body-base text-muted">
          Double-check the document details and recipient assignments before sending the legal
          envelope.
        </p>
      </div>

      {sendValidationErrors.length > 0 && (
        <div className="rounded-xl border border-warning/40 bg-warning-light p-4">
          <div className="flex gap-2">
            <MaterialIcon name="warning" size={20} className="shrink-0 text-warning" />
            <div>
              <p className="text-sm font-medium text-on-surface">Action required</p>
              <ul className="mt-1 list-inside list-disc text-xs text-muted">
                {sendValidationErrors.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 flex flex-col gap-6 lg:col-span-4">
          <section className="rounded-xl border border-border bg-surface-container-lowest p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="flex items-center text-headline-lg font-semibold text-primary">
                <MaterialIcon name="description" size={22} className="mr-2 text-secondary" />
                Documents
              </h4>
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="text-label-sm font-medium text-secondary hover:underline"
              >
                Edit
              </button>
            </div>
            <div className="space-y-3">
              {uploadedDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center rounded-lg border border-border/50 bg-surface p-3"
                >
                  <MaterialIcon
                    name="picture_as_pdf"
                    size={22}
                    className="mr-3 text-primary-fixed-variant"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-label-sm font-bold text-primary">{doc.file_name}</p>
                    <p className="text-caption-xs text-muted">{formatFileSize(doc.file_size)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-surface-container-lowest p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="flex items-center text-headline-lg font-semibold text-primary">
                <MaterialIcon name="settings" size={22} className="mr-2 text-secondary" />
                Settings
              </h4>
              <button
                type="button"
                onClick={() => goToStep(4)}
                className="text-label-sm font-medium text-secondary hover:underline"
              >
                Edit
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/40 py-2">
                <div>
                  <p className="text-label-sm font-bold text-primary">Password Protection</p>
                  <p className="text-caption-xs text-muted">Require code to open</p>
                </div>
                <span
                  className={`rounded px-2 py-1 text-[11px] font-medium uppercase tracking-wider ${
                    pdfPasswordProtectionEnabled
                      ? 'bg-success-light text-success'
                      : 'bg-surface-container text-muted'
                  }`}
                >
                  {pdfPasswordProtectionEnabled ? 'On' : 'Off'}
                </span>
              </div>
              <div>
                <p className="mb-1 text-label-sm font-bold text-primary">Envelope Name</p>
                <p className="text-body-sm text-on-surface-variant">
                  {envelopeName || 'Untitled envelope'}
                </p>
              </div>
              {description && (
                <div>
                  <p className="mb-1 text-label-sm font-bold text-primary">Description</p>
                  <p className="text-body-sm text-on-surface-variant">{description}</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="col-span-12 flex flex-col gap-6 lg:col-span-8">
          <section className="flex-1 rounded-xl border border-border bg-surface-container-lowest p-8 shadow-sm">
            <div className="mb-8 flex items-center justify-between">
              <h4 className="flex items-center text-headline-lg font-semibold text-primary">
                <MaterialIcon name="group" size={22} className="mr-2 text-secondary" />
                Recipients &amp; Signing Order
              </h4>
              <button
                type="button"
                onClick={() => goToStep(2)}
                className="text-label-sm font-medium text-secondary hover:underline"
              >
                Manage Order
              </button>
            </div>

            <div className="relative space-y-12 pl-12">
              <div className="absolute bottom-2 left-5 top-2 w-0.5 bg-border" />

              {sortedRecipients.map((recipient, index) => {
                const fieldCount = countRecipientFields(fieldPositions, recipient.id)
                const hasNoFields = fieldCount === 0
                const displayName = recipient.name || recipient.email

                return (
                  <div key={recipient.id} className="relative">
                    <div className="absolute -left-12 z-10 flex h-10 w-10 items-center justify-center rounded-full border-4 border-surface-container-lowest bg-secondary text-body-sm font-bold text-white">
                      {index + 1}
                    </div>

                    <div
                      className={`flex flex-col justify-between rounded-xl bg-surface-container p-4 md:flex-row md:items-center ${
                        hasNoFields ? 'border border-error/20 ring-1 ring-error/10' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white text-sm font-bold"
                          style={{ backgroundColor: `${recipient.color}33`, color: recipient.color }}
                        >
                          {getRecipientInitials(recipient.name, recipient.email)}
                        </div>
                        <div>
                          <p className="text-label-sm font-bold text-primary">{displayName}</p>
                          <p className="text-caption-xs text-muted">{recipient.email}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2 md:mt-0">
                        {hasNoFields ? (
                          <div className="flex items-center rounded-full border border-error/20 bg-error-container px-3 py-1 text-label-sm font-bold text-error">
                            <MaterialIcon name="warning" size={16} className="mr-1" />
                            No fields placed for {displayName}
                          </div>
                        ) : (
                          <div className="flex items-center rounded-full border border-border bg-white px-3 py-1 text-label-sm font-medium text-primary">
                            <MaterialIcon name="edit_square" size={16} className="mr-1" />
                            {fieldCount} field{fieldCount === 1 ? '' : 's'} placed
                          </div>
                        )}
                        <div className="rounded-full border border-success/20 bg-success/10 px-3 py-1 text-label-sm font-medium text-success">
                          Signer
                        </div>
                      </div>
                    </div>

                    {hasNoFields && (
                      <div className="ml-4 mt-3 flex items-start text-caption-xs font-medium text-error">
                        <MaterialIcon name="info" size={14} className="mr-1" />
                        Action required: Drag signing fields onto the document for this recipient.
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => goToStep(3)}
                className="text-label-sm font-medium text-secondary hover:underline"
              >
                Edit fields
              </button>
            </div>
          </section>

          <div className="flex items-start rounded-xl border border-warning/20 bg-warning-light p-4">
            <MaterialIcon name="lightbulb" size={22} className="mr-3 mt-1 text-warning" />
            <div>
              <p className="text-label-sm font-bold text-tertiary">Quick Tip</p>
              <p className="text-body-sm text-on-tertiary-container">
                Sending this envelope will trigger notifications to all recipients in the order
                shown. You can still void the envelope after sending if needed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
