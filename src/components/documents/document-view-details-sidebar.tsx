'use client'

import { Loader2 } from 'lucide-react'
import { MaterialIcon } from '@/components/ui/material-icon'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Document } from '@/lib/api/documents'

interface DocumentViewDetailsSidebarProps {
  document: Document
  onDownload: () => void
  isDownloading: boolean
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'draft':
      return 'bg-surface-container-low text-body'
    case 'pending':
    case 'sent':
      return 'bg-info-light text-secondary'
    case 'completed':
    case 'signed':
      return 'bg-green-100 text-green-800'
    case 'rejected':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-surface-container-low text-body'
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
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
}: DocumentViewDetailsSidebarProps) {
  return (
    <aside className="z-20 flex w-[300px] shrink-0 flex-col border-l border-border bg-surface-container-lowest">
      <div className="border-b border-border p-6">
        <h3 className="flex items-center gap-2 font-headline-lg text-headline-lg text-primary">
          <MaterialIcon name="info" size={22} className="text-secondary" />
          Document Details
        </h3>
        <p className="mt-1 font-body-sm text-body-sm text-muted">Metadata and download</p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        <div>
          <div className="mb-1 text-[11px] font-bold uppercase tracking-widest text-muted">File Name</div>
          <p className="break-all font-body-sm text-body-sm text-on-surface">{document.file_name}</p>
        </div>

        <div>
          <div className="mb-1 text-[11px] font-bold uppercase tracking-widest text-muted">Status</div>
          <Badge className={getStatusColor(document.status)}>{document.status}</Badge>
        </div>

        <div>
          <div className="mb-1 text-[11px] font-bold uppercase tracking-widest text-muted">File Size</div>
          <p className="font-body-sm text-body-sm text-on-surface">{formatFileSize(document.file_size)}</p>
        </div>

        <div>
          <div className="mb-1 text-[11px] font-bold uppercase tracking-widest text-muted">File Type</div>
          <p className="font-body-sm text-body-sm text-on-surface">PDF</p>
        </div>

        <div>
          <div className="mb-1 text-[11px] font-bold uppercase tracking-widest text-muted">Created</div>
          <p className="font-body-sm text-body-sm text-on-surface">
            {document.created_at ? formatDate(document.created_at) : 'Unknown'}
          </p>
        </div>
      </div>

      <div className="border-t border-border p-6">
        <Button
          onClick={onDownload}
          disabled={isDownloading}
          className="flex w-full items-center justify-center gap-2"
        >
          {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MaterialIcon name="download" size={18} />}
          <span>Download</span>
        </Button>
      </div>
    </aside>
  )
}
