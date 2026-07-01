'use client'

import { useState, useCallback, useMemo } from 'react'
import { useDocuments } from '@/hooks/useDocuments'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { MaterialIcon } from '@/components/ui/material-icon'
import { WizardDocumentUpload } from '../WizardDocumentUpload'
import { useEnvelopeWizard } from '../envelope-wizard-context'
import { formatFileSize, getDocumentBadgeLabel } from '../wizard-utils'

export function StepSelectDocuments() {
  const {
    uploadedDocuments,
    addDocument,
    removeDocument,
    reorderDocument,
    handleMergeDocuments,
    isMerging,
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

  return (
    <div className="grid grid-cols-12 gap-8">
      <section className="col-span-12 flex flex-col space-y-6 lg:col-span-7">
        <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface-container-lowest shadow-sm">
          <div className="border-b border-border p-6">
            <h2 className="mb-4 text-headline-lg font-semibold text-primary">Select from Library</h2>
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

          <div className="wizard-custom-scrollbar max-h-[400px] flex-1 overflow-y-auto">
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
        <div className="flex min-h-[500px] flex-col rounded-xl border border-border bg-surface-container-lowest p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-headline-lg font-semibold text-primary">Selected Documents</h2>
            <span className="rounded-full bg-primary px-3 py-1 text-label-sm font-medium text-on-primary">
              {uploadedDocuments.length} {uploadedDocuments.length === 1 ? 'File' : 'Files'}
            </span>
          </div>

          {uploadedDocuments.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <MaterialIcon name="description" size={40} className="mb-3 text-outline-variant" />
              <p className="text-sm text-muted">Select documents from the library or upload new files.</p>
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
                  <div className="relative mr-4 flex h-16 w-12 items-center justify-center overflow-hidden rounded border border-border bg-white shadow-sm">
                    <div className="absolute inset-0 bg-primary/5" />
                    <MaterialIcon name="description" size={24} className="text-primary/30" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-label-sm font-medium text-primary">{doc.file_name}</div>
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
            <div className="mt-8 space-y-4 border-t border-border pt-6">
              <div className="flex items-center justify-between rounded-lg bg-primary-light p-3">
                <div className="flex flex-col">
                  <span className="text-label-sm font-medium text-primary">Merge into single PDF</span>
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
  )
}
