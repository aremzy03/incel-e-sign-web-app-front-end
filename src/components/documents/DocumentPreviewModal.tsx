'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { useQuery } from '@tanstack/react-query'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { MaterialIcon } from '@/components/ui/material-icon'
import { AsyncStatePanel, StatusBadge } from '@/components/library'
import { Loader2 } from 'lucide-react'

import { Document as ApiDocument, getDocument } from '@/lib/api/documents'
import { useDownloadDocument } from '@/hooks/useDocuments'
import { shouldRetryAuthQuery } from '@/hooks/useAuthReady'
import { classifyError } from '@/lib/errors'

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

function formatStatusLabel(status: string): string {
  const words = status.replace(/[_-]+/g, ' ').trim()
  if (!words) return 'Draft'
  return words.replace(/\b\w/g, (char) => char.toUpperCase())
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

  const hasPreviewUrl = Boolean(
    document?.current_file_url || document?.signed_file_url || document?.file_url,
  )

  const {
    data: freshDocument,
    isLoading: isRefreshingPreviewDocument,
    error: previewDocumentError,
    refetch: refetchPreviewDocument,
  } = useQuery({
    queryKey: ['document', document?.id, 'preview-modal'],
    queryFn: () => getDocument(document!.id),
    enabled: isOpen && Boolean(document?.id) && !hasPreviewUrl,
    retry: shouldRetryAuthQuery,
    staleTime: 60_000,
  })

  const previewDocument = freshDocument ?? document
  const previewDocumentErrorState = previewDocumentError
    ? classifyError(previewDocumentError, 'Failed to prepare document preview')
    : null

  useEffect(() => {
    setMounted(true)
  }, [])

  const noop = useCallback(() => {}, [])

  const viewerDocuments = useMemo(
    () => (previewDocument && isOpen ? [previewDocument] : []),
    [previewDocument, isOpen],
  )

  const handleDownload = useCallback(() => {
    if (previewDocument) {
      downloadDocumentMutation.mutate({
        id: previewDocument.id,
        fileName: previewDocument.file_name,
      })
    }
  }, [previewDocument, downloadDocumentMutation])

  if (!document) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[90vh] max-w-5xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border bg-surface-container-lowest px-6 py-4">
          <div className="flex items-start gap-3 pr-8">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-muted">
              <MaterialIcon name="picture_as_pdf" size={20} />
            </div>
            <div className="min-w-0">
              <DialogTitle className="truncate text-headline-lg text-on-surface">
                {previewDocument?.file_name ?? document.file_name}
              </DialogTitle>
              <DialogDescription className="text-body-sm text-muted">
                Document preview
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-surface" style={{ height: 'min(60vh, 640px)' }}>
          {isRefreshingPreviewDocument && !freshDocument && !hasPreviewUrl ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted" />
            </div>
          ) : previewDocumentErrorState && !freshDocument && !hasPreviewUrl ? (
            <div className="flex flex-1 items-center justify-center p-6">
              <AsyncStatePanel
                variant={previewDocumentErrorState.isNotFound ? 'notFound' : 'error'}
                title={
                  previewDocumentErrorState.isNotFound
                    ? 'Preview not found'
                    : 'Unable to prepare preview'
                }
                description={
                  previewDocumentErrorState.isNotFound
                    ? 'This document is no longer available for preview. It may have been removed or replaced.'
                    : previewDocumentErrorState.message
                }
                primaryAction={
                  <Button type="button" onClick={() => void refetchPreviewDocument()}>
                    Retry Preview
                  </Button>
                }
              />
            </div>
          ) : mounted ? (
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
              <div className="mb-1 text-caption-xs text-muted">Status</div>
              <StatusBadge
                status={previewDocument?.status ?? document.status}
                label={formatStatusLabel(previewDocument?.status ?? document.status)}
                className="normal-case tracking-normal py-0.5 font-semibold"
              />
            </div>
            <div>
              <div className="mb-1 text-caption-xs text-muted">Size</div>
              <p className="text-body-sm tabular-nums text-on-surface">
                {(previewDocument?.file_size ?? document.file_size)
                  ? formatFileSize(previewDocument?.file_size ?? document.file_size)
                  : 'Unknown'}
              </p>
            </div>
            <div>
              <div className="mb-1 text-caption-xs text-muted">Type</div>
              <p className="text-body-sm text-on-surface">PDF</p>
            </div>
            <div>
              <div className="mb-1 text-caption-xs text-muted">Created</div>
              <p className="text-body-sm tabular-nums text-on-surface">
                {(previewDocument?.created_at ?? document.created_at)
                  ? new Date(previewDocument?.created_at ?? document.created_at).toLocaleDateString()
                  : 'Unknown'}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="border border-outline-variant bg-surface-container-lowest text-primary hover:bg-surface"
            >
              Close
            </Button>
            <Button
              onClick={handleDownload}
              disabled={downloadDocumentMutation.isPending}
              className="bg-secondary hover:bg-accent-hover"
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
