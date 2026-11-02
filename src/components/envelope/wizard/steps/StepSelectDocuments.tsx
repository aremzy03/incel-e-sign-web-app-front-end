'use client'

import { useState, useCallback, useMemo } from 'react'
import { useDocuments } from '@/hooks/useDocuments'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { RecipientSearch } from '@/components/contacts/RecipientSearch'
import { MaterialIcon } from '@/components/ui/material-icon'
import { WizardDocumentUpload } from '../WizardDocumentUpload'
import { useEnvelopeWizard } from '../envelope-wizard-context'
import {
  formatFileSize,
  getDefaultEnvelopeNamePreview,
  getDocumentBadgeLabel,
  getRecipientInitials,
} from '../wizard-utils'

export function StepSelectDocuments() {
  const {
    uploadedDocuments,
    addDocument,
    removeDocument,
    reorderDocument,
    handleMergeDocuments,
    isMerging,
    recipients,
    addRecipient,
    removeRecipient,
    reorderRecipient,
    envelopeName,
    setEnvelopeName,
    description,
    setDescription,
    pdfPasswordProtectionEnabled,
    setPdfPasswordProtectionEnabled,
  } = useEnvelopeWizard()

  const [mergeEnabled, setMergeEnabled] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { data: libraryData, isLoading: loadingLibrary } = useDocuments({
    page: 1,
    pageSize: 100,
  })

  const libraryDocuments = useMemo(() => {
    const results = libraryData?.results ?? []
    return results.filter((doc) => {
      const status = (doc.status || '').toLowerCase()
      return status === 'draft' || status === 'rejected'
    })
  }, [libraryData])

  const filteredLibrary = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return libraryDocuments
    return libraryDocuments.filter((doc) => doc.file_name.toLowerCase().includes(q))
  }, [libraryDocuments, searchQuery])

  const selectedIds = useMemo(
    () => new Set(uploadedDocuments.map((d) => d.id)),
    [uploadedDocuments],
  )

  const toggleLibraryDoc = useCallback(
    (doc: (typeof libraryDocuments)[0]) => {
      if (selectedIds.has(doc.id)) {
        removeDocument(doc.id)
      } else {
        addDocument(doc)
      }
    },
    [selectedIds, addDocument, removeDocument],
  )

  const sortedRecipients = useMemo(
    () => [...recipients].sort((a, b) => a.order - b.order),
    [recipients],
  )

  const defaultNamePlaceholder = useMemo(
    () => getDefaultEnvelopeNamePreview(uploadedDocuments),
    [uploadedDocuments],
  )

  return (
    <div className="space-y-8">
      {/* Row 1: Documents (Library + Upload on left, Selected Documents on right) */}
      <div className="grid grid-cols-12 gap-8">
        <section className="col-span-12 flex flex-col space-y-6 lg:col-span-7">
          <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface-container-lowest shadow-sm">
            <div className="border-b border-border p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-headline-lg font-semibold text-primary">
                  1. Select from Library
                </h2>
                <span className="text-caption-xs text-muted">
                  Or upload a new PDF below
                </span>
              </div>
              <div className="relative">
                <MaterialIcon
                  name="search"
                  size={20}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search templates and documents..."
                  className="border-none bg-surface pl-10 focus-visible:ring-secondary"
                />
              </div>
            </div>

            <div className="wizard-custom-scrollbar max-h-[320px] flex-1 overflow-y-auto">
              {loadingLibrary ? (
                <p className="p-6 text-sm text-muted">Loading library…</p>
              ) : filteredLibrary.length === 0 ? (
                <p className="p-6 text-sm text-muted">No documents match your search.</p>
              ) : (
                <div className="divide-y divide-border">
                  {filteredLibrary.map((doc) => {
                    const selected = selectedIds.has(doc.id)
                    const badge = getDocumentBadgeLabel(doc.status)
                    return (
                      <label
                        key={doc.id}
                        className={`group flex cursor-pointer items-center p-4 transition-colors hover:bg-primary-light ${
                          selected ? 'bg-secondary/5' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleLibraryDoc(doc)}
                          className="mr-4 h-5 w-5 rounded border-outline text-secondary focus:ring-secondary"
                        />
                        <MaterialIcon
                          name="description"
                          size={22}
                          className="mr-3 text-on-surface-variant group-hover:text-primary"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-label-sm font-medium text-primary">
                            {doc.file_name}
                          </div>
                          <div className="text-caption-xs text-on-surface-variant">
                            {formatFileSize(doc.file_size)}
                          </div>
                        </div>
                        {badge && (
                          <span className="rounded bg-surface-container px-2 py-1 text-[10px] font-bold uppercase text-on-surface-variant">
                            {badge}
                          </span>
                        )}
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <WizardDocumentUpload onDocumentAdd={addDocument} disabled={isMerging} />
        </section>

        <aside className="col-span-12 space-y-6 lg:col-span-5">
          <div className="flex min-h-[420px] flex-col rounded-xl border border-border bg-surface-container-lowest p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-headline-lg font-semibold text-primary">Selected Documents</h2>
              <span className="rounded-full bg-primary px-3 py-1 text-label-sm font-medium text-on-primary">
                {uploadedDocuments.length} {uploadedDocuments.length === 1 ? 'File' : 'Files'}
              </span>
            </div>

            {uploadedDocuments.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <MaterialIcon name="description" size={40} className="mb-3 text-outline-variant" />
                <p className="text-sm text-muted">
                  Select documents from the library or upload new files.
                </p>
              </div>
            ) : (
              <div className="flex-1 space-y-3">
                {uploadedDocuments.map((doc, index) => (
                  <div
                    key={doc.id}
                    className="group relative flex items-center rounded-xl border border-transparent bg-surface p-4 transition-all hover:border-secondary"
                  >
                    <button
                      type="button"
                      className="drag-handle mr-2 p-1 text-outline-variant hover:text-on-surface-variant"
                      aria-label="Reorder document"
                      onClick={() => reorderDocument(doc.id, 'up')}
                      disabled={index === 0}
                    >
                      <MaterialIcon name="drag_indicator" size={20} />
                    </button>
                    <div className="relative mr-4 flex h-14 w-11 items-center justify-center overflow-hidden rounded border border-border bg-white shadow-sm">
                      <div className="absolute inset-0 bg-primary/5" />
                      <MaterialIcon name="description" size={22} className="text-primary/30" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-label-sm font-medium text-primary">
                        {doc.file_name}
                      </div>
                      <div className="text-caption-xs text-on-surface-variant">
                        {formatFileSize(doc.file_size)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDocument(doc.id)}
                      className="p-2 text-outline-variant transition-colors hover:text-error"
                      aria-label={`Remove ${doc.file_name}`}
                    >
                      <MaterialIcon name="delete" size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {uploadedDocuments.length >= 2 && (
              <div className="mt-6 space-y-3 border-t border-border pt-5">
                <div className="flex items-center justify-between rounded-lg bg-primary-light p-3">
                  <div className="flex flex-col">
                    <span className="text-label-sm font-medium text-primary">
                      Merge into single PDF
                    </span>
                    <span className="text-[11px] text-on-surface-variant">
                      Signers receive one document
                    </span>
                  </div>
                  <Switch
                    id="merge-toggle"
                    checked={mergeEnabled}
                    onCheckedChange={(checked) => {
                      setMergeEnabled(checked)
                      if (checked) void handleMergeDocuments()
                    }}
                    disabled={isMerging}
                    aria-label="Merge into single PDF"
                  />
                </div>
                {isMerging && (
                  <p className="text-caption-xs text-secondary">Merging documents…</p>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Row 2: Recipients & Signing Order (left) + Envelope Details & Security (right) */}
      <div className="grid grid-cols-12 gap-8">
        <section className="col-span-12 space-y-6 lg:col-span-7">
          <div className="rounded-xl border border-border bg-surface-container-lowest p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-headline-lg font-semibold text-primary">
                  2. Signing Order &amp; Recipients
                </h2>
                <p className="mt-0.5 text-caption-xs text-on-surface-variant">
                  Signers receive the envelope sequentially in the order listed below.
                </p>
              </div>
              <span className="rounded-full bg-secondary/10 px-3 py-1 text-label-sm font-medium text-secondary">
                {recipients.length} signer(s)
              </span>
            </div>

            <div className="mb-6">
              <Label className="mb-1.5 block text-label-sm text-on-surface-variant">
                Add New Recipient
              </Label>
              <RecipientSearch
                onSelect={(r) => {
                  addRecipient({ email: r.email, name: r.name })
                }}
              />
            </div>

            {sortedRecipients.length === 0 ? (
              <div className="rounded-xl border border-dashed border-outline-variant py-8 text-center">
                <MaterialIcon name="group_add" size={32} className="mx-auto mb-2 text-outline-variant" />
                <p className="text-sm text-muted">
                  No recipients added yet. Search by email or name above to add signers.
                </p>
              </div>
            ) : (
              <div className="relative space-y-4">
                {sortedRecipients.map((recipient, index) => {
                  const isLast = index === sortedRecipients.length - 1
                  const orderNumber = index + 1
                  return (
                    <div
                      key={recipient.id}
                      className={`relative flex items-start gap-4 ${
                        isLast ? 'signing-order-line-last' : 'signing-order-line'
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <div
                          className={`z-10 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold shadow-sm ${
                            orderNumber === 1
                              ? 'bg-secondary text-on-secondary'
                              : 'border-2 border-primary-container bg-primary-container text-on-primary-container'
                          }`}
                        >
                          {orderNumber}
                        </div>
                      </div>

                      <div className="group flex flex-1 items-center gap-3 rounded-xl border border-outline-variant bg-background p-3.5 transition-all hover:shadow-sm">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-outline text-xs font-bold text-primary"
                          style={{ backgroundColor: `${recipient.color}22` }}
                        >
                          {getRecipientInitials(recipient.name, recipient.email)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-label-sm font-medium text-primary">
                            {recipient.name || recipient.email}
                          </p>
                          <p className="truncate text-caption-xs text-on-surface-variant">
                            {recipient.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
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
                            className="p-1.5 text-outline-variant transition-colors hover:text-error"
                            aria-label="Remove recipient"
                          >
                            <MaterialIcon name="delete" size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        <aside className="col-span-12 space-y-6 lg:col-span-5">
          <div className="rounded-xl border border-border bg-surface-container-lowest p-6 shadow-sm">
            <div className="mb-4 flex items-center">
              <MaterialIcon name="tune" size={22} className="mr-2 text-primary" />
              <h2 className="text-headline-lg font-semibold text-primary">
                3. Envelope Details &amp; Security
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="envelope-name"
                  className="mb-1.5 block text-label-sm text-on-surface-variant"
                >
                  Envelope Name <span className="text-caption-xs text-muted">(Optional)</span>
                </Label>
                <Input
                  id="envelope-name"
                  value={envelopeName}
                  onChange={(e) => setEnvelopeName(e.target.value)}
                  placeholder={defaultNamePlaceholder}
                  className="border-outline-variant bg-background focus-visible:ring-secondary"
                />
                {uploadedDocuments.length > 0 && !envelopeName.trim() && (
                  <p className="mt-1 text-caption-xs text-muted">
                    Defaults to <span className="font-medium text-primary">{defaultNamePlaceholder}</span> if left blank.
                  </p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="envelope-description"
                  className="mb-1.5 block text-label-sm text-on-surface-variant"
                >
                  Description / Notes <span className="text-caption-xs text-muted">(Optional)</span>
                </Label>
                <Textarea
                  id="envelope-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief summary or instructions for recipients..."
                  rows={3}
                  className="border-outline-variant bg-background focus-visible:ring-secondary"
                />
              </div>

              <div className="pt-2">
                <div className="flex items-start justify-between rounded-lg bg-primary-light p-4">
                  <div className="flex-grow pr-4">
                    <div className="flex items-center gap-1.5">
                      <MaterialIcon name="security" size={18} className="text-primary" />
                      <h4 className="text-label-sm font-bold text-primary">
                        PDF Password Protection
                      </h4>
                    </div>
                    <p className="mt-1 text-caption-xs text-on-primary-fixed-variant">
                      Completed PDFs will be password-protected once all recipients sign.
                    </p>
                  </div>
                  <Switch
                    checked={pdfPasswordProtectionEnabled}
                    onCheckedChange={setPdfPasswordProtectionEnabled}
                    aria-label="Enable PDF password protection"
                  />
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
