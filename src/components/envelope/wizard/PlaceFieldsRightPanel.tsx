'use client'

import dynamic from 'next/dynamic'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useEnvelopeWizard } from './envelope-wizard-context'
import { PdfLoadingIndicator } from '@/components/pdf/PdfLoadingIndicator'
import { countRecipientFields, getRecipientInitials } from './wizard-utils'
import type { DocumentPageInfo } from '@/components/envelope/VerticalPDFViewer'

const PdfPageThumbnail = dynamic(
  () => import('@/components/envelope/PdfPageThumbnail').then((m) => m.PdfPageThumbnail),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-[3/4] w-full overflow-hidden rounded-lg border border-border bg-white shadow-sm">
        <PdfLoadingIndicator size="thumbnail" label="Loading page thumbnail…" />
      </div>
    ),
  },
)

interface PlaceFieldsRightPanelProps {
  pages: DocumentPageInfo[]
  activePageKey: string | null
  onPageSelect: (pageKey: string) => void
}

export function PlaceFieldsRightPanel({
  pages,
  activePageKey,
  onPageSelect,
}: PlaceFieldsRightPanelProps) {
  const {
    recipients,
    activeRecipientId,
    setActiveRecipientId,
    uploadedDocuments,
    fieldPositions,
  } = useEnvelopeWizard()

  const sortedRecipients = [...recipients].sort((a, b) => a.order - b.order)
  const activeRecipient = sortedRecipients.find((r) => r.id === activeRecipientId)

  return (
    <aside className="flex h-full min-h-0 w-[240px] shrink-0 flex-col border-l border-border bg-white">
      <div className="shrink-0 border-b border-border p-4">
        <label className="mb-2 block text-caption-xs text-muted">Place fields for:</label>
        <Select
          value={activeRecipientId != null ? String(activeRecipientId) : undefined}
          onValueChange={(value) => setActiveRecipientId(Number(value))}
        >
          <SelectTrigger className="h-auto rounded-xl border-border bg-surface p-3">
            <SelectValue placeholder="Select signer">
              {activeRecipient && (
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-on-secondary"
                    style={{ backgroundColor: activeRecipient.color }}
                  >
                    {getRecipientInitials(activeRecipient.name, activeRecipient.email)}
                  </div>
                  <span className="truncate text-label-sm font-medium text-primary">
                    {activeRecipient.name || activeRecipient.email}
                  </span>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {sortedRecipients.map((recipient) => {
              const count = countRecipientFields(fieldPositions, recipient.id)
              return (
                <SelectItem key={recipient.id} value={String(recipient.id)}>
                  {recipient.name || recipient.email} ({count} field{count === 1 ? '' : 's'})
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>

        {sortedRecipients.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {sortedRecipients.map((recipient) => {
              const count = countRecipientFields(fieldPositions, recipient.id)
              const isSelected = recipient.id === activeRecipientId
              return (
                <button
                  key={recipient.id}
                  type="button"
                  onClick={() => setActiveRecipientId(recipient.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-caption-xs transition-colors ${
                    isSelected
                      ? 'bg-secondary/10 font-semibold text-primary'
                      : 'text-on-surface-variant hover:bg-surface'
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2 truncate">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: recipient.color }}
                    />
                    <span className="truncate">{recipient.name || recipient.email}</span>
                  </span>
                  <span
                    className={`ml-2 shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      count > 0
                        ? 'bg-success/15 text-success'
                        : 'bg-warning-light text-warning'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
        <h3 className="mb-4 shrink-0 text-label-sm font-medium uppercase tracking-wider text-muted">
          Pages
        </h3>
        <div className="wizard-custom-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto pr-2">
          {pages.length === 0 ? (
            <div className="space-y-4">
              <div className="aspect-[3/4] w-full overflow-hidden rounded-lg border border-border bg-white shadow-sm">
                <PdfLoadingIndicator size="thumbnail" label="Loading pages…" />
              </div>
              <div className="aspect-[3/4] w-full overflow-hidden rounded-lg border border-border bg-white opacity-60 shadow-sm">
                <PdfLoadingIndicator size="thumbnail" label="Loading pages…" />
              </div>
            </div>
          ) : (
            pages.map((page) => {
              const pageKey = `${page.documentId}-${page.pageNumber}`
              const multipleDocuments = new Set(pages.map((p) => p.documentId)).size > 1
              return (
                <div key={pageKey}>
                  {page.pageNumber === 1 && multipleDocuments && (
                    <p className="mb-2 truncate text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">
                      {page.documentName}
                    </p>
                  )}
                  <PdfPageThumbnail
                    document={uploadedDocuments.find((doc) => doc.id === page.documentId)}
                    pageNumber={page.pageNumber}
                    isActive={activePageKey === pageKey}
                    onClick={() => onPageSelect(pageKey)}
                    label={`Page ${page.pageNumber}`}
                  />
                </div>
              )
            })
          )}
        </div>
      </div>
    </aside>
  )
}
