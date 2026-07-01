'use client'

import Link from 'next/link'
import type { Envelope } from '@/lib/api/envelopes'
import type { EnvelopeDocumentResponse } from '@/lib/api/envelopes'
import { MaterialIcon } from '@/components/ui/material-icon'
import { cn } from '@/lib/utils'

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface EnvelopeDetailsCardProps {
  description?: string | null
}

export function EnvelopeDetailsCard({ description }: EnvelopeDetailsCardProps) {
  return (
    <section className="rounded-xl border border-border/50 bg-surface-container-lowest p-6 shadow-sm">
      <h3 className="mb-4 font-headline-lg text-headline-lg text-primary">Envelope Details</h3>
      <p className="font-body-base text-body-base leading-relaxed text-on-surface-variant">
        {description?.trim() || 'No description provided for this envelope.'}
      </p>
    </section>
  )
}

interface EnvelopeDocumentsCardProps {
  documents: EnvelopeDocumentResponse[]
  isLoading?: boolean
  envelope: Envelope
  isSelfSign?: boolean
}

export function EnvelopeDocumentsCard({
  documents,
  isLoading,
  envelope,
  isSelfSign,
}: EnvelopeDocumentsCardProps) {
  return (
    <section className="rounded-xl border border-border/50 bg-surface-container-lowest p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-headline-lg text-headline-lg text-primary">Documents</h3>
        <span className="font-label-sm text-label-sm text-on-surface-variant">
          {documents.length} {documents.length === 1 ? 'file' : 'files'}
        </span>
      </div>

      {isLoading ? (
        <p className="font-body-sm text-body-sm text-muted">Loading documents…</p>
      ) : documents.length === 0 ? (
        <p className="font-body-sm text-body-sm text-muted">No documents in this envelope.</p>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => {
            const signedUrl =
              (doc as EnvelopeDocumentResponse & { document_signed_file_url?: string })
                .document_signed_file_url || doc.signed_file_url
            const useSignedDirectLink = isSelfSign && envelope.status === 'completed' && !!signedUrl
            const href = useSignedDirectLink
              ? signedUrl!
              : envelope.status === 'completed' && envelope.pdf_lock_password
                ? `/dashboard/documents/${doc.id}?pdf_password=${encodeURIComponent(envelope.pdf_lock_password)}`
                : `/dashboard/documents/${doc.id}`

            return (
              <div
                key={doc.id}
                className="group flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:border-secondary hover:shadow-md"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-12 w-10 shrink-0 items-center justify-center overflow-hidden rounded border border-border bg-surface">
                    <MaterialIcon name="picture_as_pdf" size={22} className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-label-sm text-label-sm text-on-surface">
                      {doc.file_name || doc.document_file_name || `Document ${doc.id}`}
                    </p>
                    <p className="font-caption-xs text-caption-xs text-muted">
                      {formatFileSize(doc.file_size)} • PDF
                    </p>
                  </div>
                </div>
                {useSignedDirectLink ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-on-surface-variant transition-colors hover:text-primary"
                    aria-label="Download signed document"
                  >
                    <MaterialIcon name="download" size={22} />
                  </a>
                ) : (
                  <Link
                    href={href}
                    className="shrink-0 text-on-surface-variant transition-colors hover:text-primary"
                    aria-label="Open document"
                  >
                    <MaterialIcon name="download" size={22} />
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

interface EnvelopeSettingsCardProps {
  envelope: Envelope
  onCopyPassword?: () => void
}

export function EnvelopeSettingsCard({ envelope }: EnvelopeSettingsCardProps) {
  const passwordEnabled =
    Boolean(envelope.pdf_lock_password) ||
    Boolean((envelope as Envelope & { pdf_password_protection_enabled?: boolean }).pdf_password_protection_enabled)

  return (
    <section className="rounded-xl border border-border/50 bg-surface-container-lowest p-6 shadow-sm">
      <h3 className="mb-4 font-headline-lg text-headline-lg text-primary">Settings</h3>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-on-surface-variant">
          <MaterialIcon name="lock" size={20} />
          <span className="font-body-base text-body-base">Password Protection</span>
        </div>
        <span
          className={cn(
            'rounded-full border px-3 py-1 font-label-xs font-bold',
            passwordEnabled
              ? 'border-secondary-container bg-accent-light text-on-secondary-fixed-variant'
              : 'border-border bg-surface-container text-muted',
          )}
        >
          {passwordEnabled ? 'ON' : 'OFF'}
        </span>
      </div>
      {envelope.pdf_lock_password ? (
        <p className="mt-3 font-caption-xs text-caption-xs text-muted">
          Completed PDFs require password: <span className="font-medium text-on-surface">{envelope.pdf_lock_password}</span>
        </p>
      ) : null}
    </section>
  )
}

interface EnvelopeDownloadAllProps {
  isCompleted: boolean
}

export function EnvelopeDownloadAll({ isCompleted }: EnvelopeDownloadAllProps) {
  return (
    <div className="mt-12 flex justify-end">
      <button
        type="button"
        disabled={!isCompleted}
        className={cn(
          'flex items-center gap-2 rounded-xl border border-border px-8 py-3 font-label-sm text-label-sm transition-all',
          isCompleted
            ? 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
            : 'cursor-not-allowed bg-surface-container-high text-on-surface-variant opacity-60',
        )}
      >
        <MaterialIcon name="cloud_download" size={20} />
        Download All {isCompleted ? '' : '(Available when completed)'}
      </button>
    </div>
  )
}
