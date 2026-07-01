'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MaterialIcon } from '@/components/ui/material-icon'
import { getDocument } from '@/lib/api/documents'
import { useDownloadDocument } from '@/hooks/useDocuments'
import { SelfSignEditorHeader } from '@/components/signing/self-sign-editor-header'
import {
  SIGNING_ZOOM_DEFAULT,
  SIGNING_ZOOM_MAX,
  SIGNING_ZOOM_MIN,
  SIGNING_ZOOM_STEP,
} from '@/components/signing/signing-toolbar'
import { VerticalPDFViewer, type DocumentPageInfo } from '@/components/envelope/VerticalPDFViewer'
import { DocumentViewNavSidebar } from '@/components/documents/document-view-nav-sidebar'
import { DocumentViewDetailsSidebar } from '@/components/documents/document-view-details-sidebar'

export default function DocumentDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const documentId = params?.id as string
  const pdfPassword = searchParams?.get('pdf_password') || undefined

  const [mounted, setMounted] = useState(false)
  const [zoom, setZoom] = useState(SIGNING_ZOOM_DEFAULT)
  const [documentPages, setDocumentPages] = useState<DocumentPageInfo[]>([])
  const [activePageKey, setActivePageKey] = useState<string | null>(null)

  const { data: documentData, isLoading, error } = useQuery({
    queryKey: ['document', documentId],
    queryFn: () => getDocument(documentId),
    enabled: !!documentId,
  })

  const downloadDocumentMutation = useDownloadDocument()

  useEffect(() => {
    setMounted(true)
  }, [])

  const viewerDocuments = useMemo(
    () => (documentData ? [documentData] : []),
    [documentData],
  )

  const documentDisplayTitle = documentData?.file_name ?? 'Document'

  const pageIndicator = useMemo(() => {
    if (documentPages.length === 0) return 'Page 1 of 1'
    const active = activePageKey
      ? documentPages.find((p) => `${p.documentId}-${p.pageNumber}` === activePageKey)
      : documentPages[0]
    if (!active) return 'Page 1 of 1'
    return `Page ${active.pageNumber} of ${active.totalPages}`
  }, [documentPages, activePageKey])

  const handleDownload = useCallback(() => {
    if (documentId && documentData) {
      downloadDocumentMutation.mutate({ id: documentId, fileName: documentData.file_name })
    }
  }, [documentId, documentData, downloadDocumentMutation])

  const noop = useCallback(() => {}, [])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <div className="flex items-center gap-2 text-muted">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading document...</span>
        </div>
      </div>
    )
  }

  if (error || !documentData) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-surface px-4">
        <FileText className="mb-4 h-12 w-12 text-muted" />
        <h3 className="mb-2 text-lg font-medium text-on-surface">Document not found</h3>
        <p className="mb-4 text-center text-muted">
          The document you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Button asChild>
          <Link href="/dashboard/documents">Back to Documents</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-surface text-on-surface">
      <SelfSignEditorHeader
        documentTitle={documentDisplayTitle}
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(SIGNING_ZOOM_MAX, z + SIGNING_ZOOM_STEP))}
        onZoomOut={() => setZoom((z) => Math.max(SIGNING_ZOOM_MIN, z - SIGNING_ZOOM_STEP))}
        pageIndicator={pageIndicator}
        onExit={() => router.push('/dashboard/documents')}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="hidden md:flex">
          <DocumentViewNavSidebar documentTitle={documentDisplayTitle} />
        </div>

        <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-surface-container-low">
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
              viewerScale={zoom / 100}
              onPagesChange={setDocumentPages}
              activePageKey={activePageKey}
              onActivePageKeyChange={setActivePageKey}
            />
          ) : null}
        </main>

        <div className="hidden md:flex">
          <DocumentViewDetailsSidebar
            document={documentData}
            onDownload={handleDownload}
            isDownloading={downloadDocumentMutation.isPending}
          />
        </div>
      </div>

      <div className="flex shrink-0 border-t border-border bg-surface-container-lowest p-4 md:hidden">
        <Button
          onClick={handleDownload}
          disabled={downloadDocumentMutation.isPending}
          className="flex w-full items-center justify-center gap-2"
        >
          {downloadDocumentMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MaterialIcon name="download" size={18} />
          )}
          <span>Download</span>
        </Button>
      </div>
    </div>
  )
}
