'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MaterialIcon } from '@/components/ui/material-icon'
import { Loader2 } from 'lucide-react'

import { Document as ApiDocument } from '@/lib/api/documents'
import { useDownloadDocument } from '@/hooks/useDocuments'

const VerticalPDFViewer = dynamic(
  () => import('@/components/envelope/VerticalPDFViewer').then((m) => m.VerticalPDFViewer),
  { ssr: false },
)

interface DocumentPreviewModalProps {
  document: ApiDocument | null
  isOpen: boolean
  onClose: () => void
  pdfPassword?: string
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

export function DocumentPreviewModal({ document, isOpen, onClose, pdfPassword }: DocumentPreviewModalProps) {
  const [mounted, setMounted] = useState(false)
  const downloadDocumentMutation = useDownloadDocument()

  useEffect(() => {
    setMounted(true)
  }, [])

  const noop = useCallback(() => {}, [])

  const viewerDocuments = useMemo(
    () => (document && isOpen ? [document] : []),
    [document, isOpen],
  )

  const handleDownload = useCallback(() => {
    if (document) {
      downloadDocumentMutation.mutate({ id: document.id, fileName: document.file_name })
    }
  }, [document, downloadDocumentMutation])

  if (!document) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[90vh] max-w-5xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border bg-surface-container-lowest px-6 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-light">
              <MaterialIcon name="picture_as_pdf" size={22} className="text-primary" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="truncate font-headline-lg text-headline-lg text-primary">
                {document.file_name}
              </DialogTitle>
              <DialogDescription className="font-body-sm text-body-sm text-muted">
                Document preview
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-surface-container-low" style={{ height: 'min(60vh, 640px)' }}>
          {mounted ? (
            <VerticalPDFViewer
              documents={viewerDocuments}
              fieldPositions={{}}
              recipients={[]}
              activeFieldId={null}
              onFieldSelect={noop}
              onFieldPositionChange={noop}
              onFieldDelete={noop}
              onFieldDrop={noop}
              pdfPassword={pdfPassword}
              editorLayout
              readOnly
            />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted" />
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-border bg-surface-container-lowest px-6 py-4">
          <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <div className="mb-1 text-[11px] font-bold uppercase tracking-widest text-muted">Status</div>
              <Badge className={getStatusColor(document.status)}>{document.status}</Badge>
            </div>
            <div>
              <div className="mb-1 text-[11px] font-bold uppercase tracking-widest text-muted">Size</div>
              <p className="font-body-sm text-body-sm text-on-surface">
                {document.file_size ? formatFileSize(document.file_size) : 'Unknown'}
              </p>
            </div>
            <div>
              <div className="mb-1 text-[11px] font-bold uppercase tracking-widest text-muted">Type</div>
              <p className="font-body-sm text-body-sm text-on-surface">PDF</p>
            </div>
            <div>
              <div className="mb-1 text-[11px] font-bold uppercase tracking-widest text-muted">Created</div>
              <p className="font-body-sm text-body-sm text-on-surface">
                {document.created_at ? new Date(document.created_at).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              onClick={handleDownload}
              disabled={downloadDocumentMutation.isPending}
              className="gap-2"
            >
              {downloadDocumentMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MaterialIcon name="download" size={18} />
              )}
              Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
