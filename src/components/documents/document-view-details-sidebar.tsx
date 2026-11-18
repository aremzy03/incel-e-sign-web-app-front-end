'use client'

import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { MaterialIcon } from '@/components/ui/material-icon'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Document } from '@/lib/api/documents'

interface DocumentViewDetailsSidebarProps {
  document: Document
  onDownload: () => void
  isDownloading: boolean
  editHref?: string
  className?: string
}

function statusBadgeVariant(
  status: string,
): 'draft' | 'pending' | 'completed' | 'rejected' | 'outline' {
  switch (status.toLowerCase()) {
    case 'draft':
      return 'draft'
    case 'pending':
    case 'sent':
      return 'pending'
    case 'completed':
    case 'signed':
      return 'completed'
    case 'rejected':
      return 'rejected'
    default:
      return 'outline'
  }
}

export function DocumentStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={statusBadgeVariant(status)} className="shrink-0 capitalize">
      {status}
    </Badge>
  )
}

const formatFileSize = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes < 0) return 'Unknown'
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k)))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function DocumentViewDetailsSidebar({
  document,
  onDownload,
  isDownloading,
  editHref,
  className,
}: DocumentViewDetailsSidebarProps) {
  return (
    <aside
      aria-label="Document details"
      className={cn(
        'flex h-[min(16rem,36vh)] w-full min-h-0 shrink-0 flex-col overflow-hidden border-t border-border bg-bg',
        'md:h-full md:w-[300px] md:border-l md:border-t-0',
        className,
      )}
    >
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-4">
        <section className="rounded-xl border border-border bg-surface-container-lowest p-6 shadow-card">
          <h2 className="text-headline-xl text-on-surface">Document Details</h2>
          <p className="mt-1.5 text-body-sm text-muted">Metadata and download</p>

          <dl className="mt-6 space-y-5">
            <div>
              <dt className="text-label-xs text-muted">File Name</dt>
              <dd className="mt-1 break-words text-body-sm text-on-surface">{document.file_name}</dd>
            </div>

            <div>
              <dt className="text-label-xs text-muted">Status</dt>
              <dd className="mt-1">
                <DocumentStatusBadge status={document.status} />
              </dd>
            </div>

            <div>
              <dt className="text-label-xs text-muted">File Size</dt>
              <dd className="mt-1 text-body-sm tabular-nums text-on-surface">
                {formatFileSize(document.file_size)}
              </dd>
            </div>

            <div>
              <dt className="text-label-xs text-muted">File Type</dt>
              <dd className="mt-1 text-body-sm text-on-surface">PDF</dd>
            </div>

            <div>
              <dt className="text-label-xs text-muted">Created</dt>
              <dd className="mt-1 text-body-sm tabular-nums text-on-surface">
                {document.created_at ? formatDate(document.created_at) : 'Unknown'}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <div className="shrink-0 space-y-2 border-t border-border p-4">
        {editHref ? (
          <Button asChild variant="outline" className="flex w-full items-center justify-center gap-2">
            <Link href={editHref}>Add text</Link>
          </Button>
        ) : null}
        <Button
          onClick={onDownload}
          disabled={isDownloading}
          aria-busy={isDownloading}
          className="flex w-full items-center justify-center gap-2"
        >
          {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MaterialIcon name="download" size={20} />}
          <span>Download</span>
        </Button>
      </div>
    </aside>
  )
}
