'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AsyncStatePanel } from '@/components/library'
import { classifyError } from '@/lib/errors'
import { getDocument } from '@/lib/api/documents'
import { useAuthReady } from '@/hooks/useAuthReady'
import { useDownloadDocument } from '@/hooks/useDocuments'
import { SelfSignEditorHeader } from '@/components/signing/self-sign-editor-header'
import {
  SIGNING_ZOOM_DEFAULT,
  SIGNING_ZOOM_MAX,
  SIGNING_ZOOM_MIN,
  SIGNING_ZOOM_STEP,
  SigningToolbar,
} from '@/components/signing/signing-toolbar'
import type { DocumentPageInfo } from '@/components/envelope/VerticalPDFViewer'
import { PdfLoadingIndicator } from '@/components/pdf/PdfLoadingIndicator'
import { DocumentViewNavSidebar } from '@/components/documents/document-view-nav-sidebar'
import {
  DocumentStatusBadge,
  DocumentViewDetailsSidebar,
} from '@/components/documents/document-view-details-sidebar'

const VerticalPDFViewer = dynamic(
  () => import('@/components/envelope/VerticalPDFViewer').then((m) => m.VerticalPDFViewer),
  {
    ssr: false,
    loading: () => (
      <div className="pdf-canvas-scroll-area-editor flex w-full flex-col items-center">
        <PdfLoadingIndicator label="Loading document…" />
      </div>
    ),
  },
)

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
  const { status: authStatus } = useAuthReady()

  const { data: documentData, isLoading, error, refetch } = useQuery({
    queryKey: ['document', documentId],
    queryFn: () => getDocument(documentId),
    enabled: !!documentId && authStatus !== 'loading',
  })
  const documentError = error ? classifyError(error, 'Failed to load document') : null

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

  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(SIGNING_ZOOM_MAX, z + SIGNING_ZOOM_STEP))
  }, [])

  const zoomOut = useCallback(() => {
    setZoom((z) => Math.max(SIGNING_ZOOM_MIN, z - SIGNING_ZOOM_STEP))
  }, [])

  const noop = useCallback(() => {}, [])

  if (isLoading || authStatus === 'loading') {
    return (
      <div className="flex h-dvh items-center justify-center bg-bg px-4">
        <AsyncStatePanel variant="loading" title="Loading document" />
      </div>
    )
  }

  if (documentError?.isNotFound) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center bg-bg px-4">
        <AsyncStatePanel
          variant="notFound"
          title="Document not found"
          description="The document you're looking for doesn't exist or has been removed."
          secondaryAction={
            <Button asChild>
              <Link href="/dashboard/documents">Back to Documents</Link>
            </Button>
          }
        />
      </div>
    )
  }

  if (documentError) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center bg-bg px-4">
        <AsyncStatePanel
          variant="error"
          title="Unable to load document"
          description={documentError.message}
          primaryAction={
            <Button type="button" onClick={() => void refetch()}>
              Retry
            </Button>
          }
          secondaryAction={
            <Button asChild variant="outline">
              <Link href="/dashboard/documents">Back to Documents</Link>
            </Button>
          }
        />
      </div>
    )
  }

  if (!documentData) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center bg-bg px-4">
        <AsyncStatePanel
          variant="notFound"
          title="Document unavailable"
          description="We couldn't find the document requested for this view."
          secondaryAction={
            <Button asChild variant="outline">
              <Link href="/dashboard/documents">Back to Documents</Link>
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-bg text-on-surface">
      <h1 className="sr-only">{documentDisplayTitle}</h1>
      <SelfSignEditorHeader
        documentTitle={documentDisplayTitle}
        zoom={zoom}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        pageIndicator={pageIndicator}
        onExit={() => router.push('/dashboard/documents')}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
        <div className="hidden h-full md:flex">
          <DocumentViewNavSidebar documentTitle={documentDisplayTitle} documentId={documentData.id} />
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-border bg-surface-container-lowest px-4 py-3 md:hidden">
            <div className="flex items-center gap-3">
              <p
                className="min-w-0 flex-1 truncate text-label-sm text-on-surface"
                title={documentDisplayTitle}
                aria-hidden="true"
              >
                {documentDisplayTitle}
              </p>
              <DocumentStatusBadge status={documentData.status} />
            </div>
            <div className="mt-3 overflow-x-auto">
              <SigningToolbar
                className="min-w-max"
                zoom={zoom}
                onZoomIn={zoomIn}
                onZoomOut={zoomOut}
                pageIndicator={pageIndicator}
              />
            </div>
          </div>

          <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-bg">
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
        </div>

        <DocumentViewDetailsSidebar
          document={documentData}
          onDownload={handleDownload}
          isDownloading={downloadDocumentMutation.isPending}
          editHref={documentData.status === 'draft' ? `/dashboard/documents/${documentData.id}/edit` : undefined}
        />
      </div>
    </div>
  )
}
