'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import type { Envelope } from '@/lib/api/envelopes'
import type { EnvelopeDocumentResponse } from '@/lib/api/envelopes'
import { MaterialIcon } from '@/components/ui/material-icon'
import { cn } from '@/lib/utils'

const deskCard =
  'rounded-xl border border-border bg-surface-container-lowest p-6 shadow-card'
const deskTitle = 'font-headline-xl text-headline-xl text-on-surface'
const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-your-turn focus-visible:ring-offset-2'
const iconAction =
  'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface hover:text-secondary'

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
  const text = description?.trim()
  return (
    <section className={deskCard}>
      <h3 className={cn(deskTitle, 'mb-4')}>Envelope Details</h3>
      <p
        className={cn(
          'font-body-base text-body-base text-on-surface max-w-[65ch]',
          !text && 'text-muted'
        )}
      >
        {text || 'No description provided for this envelope.'}
      </p>
    </section>
  )
}

interface EnvelopeDocumentsCardProps {
  documents: EnvelopeDocumentResponse[]
  isLoading?: boolean
  errorMessage?: string | null
  errorAction?: ReactNode
  envelope: Envelope
  isSelfSign?: boolean
}

export function EnvelopeDocumentsCard({
  documents,
  isLoading,
  errorMessage,
  errorAction,
  envelope,
  isSelfSign,
}: EnvelopeDocumentsCardProps) {
  return (
    <section className={deskCard}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className={deskTitle}>Documents</h3>
        <span className="font-body-sm text-body-sm text-muted shrink-0">
          {documents.length} {documents.length === 1 ? 'file' : 'files'}
        </span>
      </div>

      {isLoading ? (
        <p className="font-body-sm text-body-sm text-muted">
          Loading documents…
        </p>
      ) : errorMessage ? (
        <div className="border-error/20 bg-error-light space-y-3 rounded-xl border p-4">
          <p className="font-body-sm text-body-sm text-error">{errorMessage}</p>
          {errorAction}
        </div>
      ) : documents.length === 0 ? (
        <p className="font-body-sm text-body-sm text-muted">
          No documents in this envelope.
        </p>
      ) : (
        <div className="divide-border divide-y">
          {documents.map((doc) => {
            const signedUrl =
              (
                doc as EnvelopeDocumentResponse & {
                  document_signed_file_url?: string
                }
              ).document_signed_file_url || doc.signed_file_url
            const useSignedDirectLink =
              isSelfSign && envelope.status === 'completed' && !!signedUrl
            const href = useSignedDirectLink
              ? signedUrl!
              : envelope.status === 'completed' && envelope.pdf_lock_password
                ? `/dashboard/documents/${doc.id}?pdf_password=${encodeURIComponent(envelope.pdf_lock_password)}`
                : `/dashboard/documents/${doc.id}`

            return (
              <div
                key={doc.id}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="border-border bg-surface flex h-12 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border">
                    <MaterialIcon
                      name="picture_as_pdf"
                      size={22}
                      className="text-muted"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-label-sm text-label-sm text-on-surface truncate">
                      {doc.file_name ||
                        doc.document_file_name ||
                        `Document ${doc.id}`}
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
                    className={cn(iconAction, focusRing)}
                    aria-label="Download signed document"
                    title="Download signed document"
                  >
                    <MaterialIcon name="download" size={22} />
                  </a>
                ) : (
                  <Link
                    href={href}
                    prefetch={false}
                    className={cn(iconAction, focusRing)}
                    aria-label="Open document"
                    title="Open document"
                  >
                    <MaterialIcon name="visibility" size={22} />
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
    Boolean(
      (envelope as Envelope & { pdf_password_protection_enabled?: boolean })
        .pdf_password_protection_enabled
    )

  return (
    <section className={deskCard}>
      <h3 className={cn(deskTitle, 'mb-4')}>Settings</h3>
      <div className="flex items-center justify-between gap-3">
        <div className="text-on-surface flex items-center gap-2">
          <MaterialIcon name="lock" size={20} className="text-muted" />
          <span className="font-body-base text-body-base">
            Password Protection
          </span>
        </div>
        <span
          className={cn(
            'font-label-xs inline-flex items-center rounded-full px-2.5 py-0.5 font-semibold',
            passwordEnabled
              ? 'bg-success-light text-success'
              : 'bg-surface text-status-draft'
          )}
        >
          {passwordEnabled ? 'ON' : 'OFF'}
        </span>
      </div>
      {envelope.pdf_lock_password ? (
        <p className="font-caption-xs text-caption-xs text-muted mt-3">
          Completed PDFs require password:{' '}
          <span className="text-on-surface break-all font-medium">
            {envelope.pdf_lock_password}
          </span>
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
    <div className="mt-8 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
      {!isCompleted ? (
        <p className="font-caption-xs text-caption-xs text-muted">
          Available when completed
        </p>
      ) : null}
      <button
        type="button"
        disabled={!isCompleted}
        className={cn(
          'border-outline-variant bg-surface-container-lowest font-label-sm text-label-sm text-primary inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4',
          focusRing,
          isCompleted ? 'hover:bg-surface' : 'cursor-not-allowed opacity-50'
        )}
      >
        <MaterialIcon name="cloud_download" size={20} />
        Download All
      </button>
    </div>
  )
}
