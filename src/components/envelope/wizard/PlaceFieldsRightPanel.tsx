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
import { getRecipientInitials } from './wizard-utils'
import type { DocumentPageInfo } from '@/components/envelope/VerticalPDFViewer'

const PdfPageThumbnail = dynamic(
  () => import('@/components/envelope/PdfPageThumbnail').then((m) => m.PdfPageThumbnail),
  {
    ssr: false,
    loading: () => (
      <div className="flex aspect-[3/4] w-full items-center justify-center rounded-lg border border-border bg-surface-container text-caption-xs text-muted">
        …
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
  const { recipients, activeRecipientId, setActiveRecipientId } = useEnvelopeWizard()

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
            {sortedRecipients.map((recipient) => (
              <SelectItem key={recipient.id} value={String(recipient.id)}>
                {recipient.name || recipient.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
        <h3 className="mb-4 shrink-0 text-label-sm font-medium uppercase tracking-wider text-muted">
          Pages
        </h3>
        <div className="wizard-custom-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto pr-2">
          {pages.length === 0 ? (
            <p className="text-caption-xs text-muted">Loading pages…</p>
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
                    documentId={page.documentId}
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
