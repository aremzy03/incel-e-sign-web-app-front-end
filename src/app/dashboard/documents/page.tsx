'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MaterialIcon } from '@/components/ui/material-icon'
import type { MaterialIconName } from '@/components/ui/material-icon'
import { DocumentPreviewModal } from '@/components/documents/DocumentPreviewModal'
import {
  ViewToggle,
  DataTable,
  StatusBadge,
  EmptyState,
} from '@/components/library'
import type { DataTableColumn } from '@/components/library'
import { type Document } from '@/lib/api/documents'
import {
  useDocuments,
  useDeleteDocument,
  useDownloadDocument,
  useMergeDocuments,
  type DocumentStatusTab,
} from '@/hooks/useDocuments'

const PAGE_SIZE = 10
const STATUS_ORDER: DocumentStatusTab[] = ['all', 'draft', 'sent', 'completed', 'rejected']

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

const formatDate = (dateString: string): string =>
  new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

function formatStatusLabel(status: string): string {
  const words = status.replace(/[_-]+/g, ' ').trim()
  if (!words) return 'Draft'
  return words.replace(/\b\w/g, (char) => char.toUpperCase())
}

const statusPillClass = 'normal-case tracking-normal py-0.5 font-semibold'

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
}

function getFileTypeIcon(fileName: string): MaterialIconName {
  const ext = fileName.split('.').pop()?.toLowerCase()
  return ext === 'pdf' ? 'picture_as_pdf' : 'description'
}

function FileTypeMark({ fileName, size = 20 }: { fileName: string; size?: number }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-muted">
      <MaterialIcon name={getFileTypeIcon(fileName)} size={size} />
    </div>
  )
}

function OwnerCell({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-label-xs text-muted">
        {getInitials(name)}
      </div>
      <span className="text-body-sm text-on-surface">{name}</span>
    </div>
  )
}

const outlineButtonClass =
  'border border-outline-variant bg-surface-container-lowest text-primary hover:bg-surface'

export default function DocumentsPage() {
  const { data: session } = useSession()
  const ownerName = session?.user?.full_name || session?.user?.email || 'You'

  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeStatus, setActiveStatus] = useState<DocumentStatusTab>('all')
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const listStatus = activeStatus === 'all' ? undefined : activeStatus

  const { data, isLoading, error, refetch, isFetching } = useDocuments({
    page,
    pageSize: PAGE_SIZE,
    status: listStatus,
  })

  const deleteDocumentMutation = useDeleteDocument()
  const downloadDocumentMutation = useDownloadDocument()
  const mergeDocumentsMutation = useMergeDocuments()

  const documents = data?.results ?? []
  const totalCount = data?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const rangeStart = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(page * PAGE_SIZE, totalCount)

  const handleDocumentClick = (document: Document) => {
    setSelectedDocument(document)
    setIsModalOpen(true)
  }

  const handleDeleteDocument = (documentId: string) => {
    if (confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      deleteDocumentMutation.mutate(documentId)
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(documentId)
        return next
      })
    }
  }

  const handleDownloadDocument = (documentId: string) => {
    const doc = documents.find((d) => d.id === documentId)
    if (!doc) return
    downloadDocumentMutation.mutate({ id: documentId, fileName: doc.file_name })
  }

  const handleMergeSelected = useCallback(async () => {
    if (selectedIds.size < 2) return

    const selectedDocs = documents.filter((doc) => selectedIds.has(doc.id))
    const mergeName =
      selectedDocs.length === 2
        ? `${selectedDocs[0].file_name.replace(/\.[^.]+$/, '')}_merged.pdf`
        : 'merged.pdf'

    try {
      await mergeDocumentsMutation.mutateAsync({
        documentIds: selectedDocs.map((doc) => doc.id),
        name: mergeName,
      })
      setSelectedIds(new Set())
    } catch {
      // Error toast handled in mutation
    }
  }, [documents, mergeDocumentsMutation, selectedIds])

  const filterOptions = STATUS_ORDER.map((status) => ({
    value: status,
    label: status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1),
  }))

  const columns: DataTableColumn<Document>[] = [
    {
      key: 'type',
      header: 'Type',
      hideOnMobile: true,
      render: (doc) => <FileTypeMark fileName={doc.file_name} />,
    },
    {
      key: 'name',
      header: 'Filename',
      render: (doc) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            handleDocumentClick(doc)
          }}
          className="max-w-[240px] truncate rounded-lg text-left text-body-sm font-medium text-on-surface hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-your-turn focus-visible:ring-offset-2"
          title={doc.file_name}
        >
          {doc.file_name}
        </button>
      ),
    },
    {
      key: 'size',
      header: 'Size',
      hideOnMobile: true,
      render: (doc) => (
        <span className="text-body-sm tabular-nums text-muted">{formatFileSize(doc.file_size)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (doc) => (
        <StatusBadge
          status={doc.status || 'draft'}
          label={formatStatusLabel(doc.status || 'draft')}
          className={statusPillClass}
        />
      ),
    },
    {
      key: 'owner',
      header: 'Owner',
      hideOnMobile: true,
      render: () => <OwnerCell name={ownerName} />,
    },
    {
      key: 'created',
      header: 'Created Date',
      render: (doc) => (
        <span className="text-body-sm tabular-nums text-muted">
          {doc.created_at ? formatDate(doc.created_at) : 'Unknown'}
        </span>
      ),
    },
  ]

  const canMerge =
    viewMode === 'table' && selectedIds.size >= 2 && !mergeDocumentsMutation.isPending

  return (
    <div className="mx-auto max-w-max-content-width space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          variant="outline"
          disabled={!canMerge}
          onClick={handleMergeSelected}
          className={outlineButtonClass}
        >
          <MaterialIcon name="merge" size={18} />
          {mergeDocumentsMutation.isPending ? 'Merging…' : 'Merge Selected'}
        </Button>
        <Button asChild className="bg-secondary text-on-secondary hover:bg-accent-hover">
          <Link href="/dashboard/documents/upload" prefetch={false}>
            <MaterialIcon name="upload" size={18} />
            Upload
          </Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface-container-lowest shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-6">
          <div
            className="inline-flex min-w-0 max-w-full gap-2 overflow-x-auto"
            role="group"
            aria-label="Filter documents by status"
          >
            {filterOptions.map((option) => {
              const isActive = activeStatus === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setActiveStatus(option.value)
                    setPage(1)
                  }}
                  className={`inline-flex h-10 shrink-0 items-center rounded-xl border bg-surface-container-lowest px-4 text-label-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-your-turn focus-visible:ring-offset-2 ${
                    isActive
                      ? 'border-primary'
                      : 'border-outline-variant hover:bg-surface'
                  }`}
                  aria-pressed={isActive}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
          <ViewToggle view={viewMode} onChange={setViewMode} className="shrink-0" />
        </div>

        {isLoading && !data ? (
          <div className="flex items-center justify-center py-16 text-body-sm text-muted">
            <MaterialIcon name="progress_activity" size={24} className="animate-spin" />
            <span className="ml-2">Loading documents…</span>
          </div>
        ) : error && !data ? (
          <div className="p-6">
            <EmptyState
              icon="error"
              title="Failed to load documents"
              description="Please try refreshing the page."
              action={
                <Button onClick={() => refetch()} variant="outline" className={outlineButtonClass}>
                  Retry
                </Button>
              }
            />
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-2 p-6 sm:grid-cols-2 lg:grid-cols-3">
            {documents.length === 0 ? (
              <div className="col-span-full">
                <EmptyState
                  icon="description"
                  title="No documents found"
                  description="Upload your first document to get started."
                  action={
                    <Button asChild className="bg-secondary text-on-secondary hover:bg-accent-hover">
                      <Link href="/dashboard/documents/upload" prefetch={false}>Upload Your First Document</Link>
                    </Button>
                  }
                />
              </div>
            ) : (
              documents.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => handleDocumentClick(doc)}
                  className="rounded-xl p-4 text-left transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-your-turn focus-visible:ring-offset-2"
                >
                  <FileTypeMark fileName={doc.file_name} />
                  <p className="mt-3 truncate text-body-sm font-medium text-on-surface">{doc.file_name}</p>
                  <div className="mt-2">
                    <StatusBadge
                      status={doc.status || 'draft'}
                      label={formatStatusLabel(doc.status || 'draft')}
                      className={statusPillClass}
                    />
                  </div>
                </button>
              ))
            )}
          </div>
        ) : documents.length > 0 ? (
          <div className="p-3 md:p-0">
            <DataTable
              columns={columns}
              data={documents}
              keyExtractor={(d) => d.id}
              selectable
              selectedKeys={selectedIds}
              onSelectionChange={setSelectedIds}
              rowActions={(doc) => (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted hover:bg-surface"
                      aria-label="Row actions"
                    >
                      <MaterialIcon name="more_vert" size={18} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleDocumentClick(doc)}>
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownloadDocument(doc.id)}>
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-error"
                      onClick={() => handleDeleteDocument(doc.id)}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            />
          </div>
        ) : (
          <div className="p-6">
            <EmptyState
              icon="description"
              title="No documents found"
              description={
                activeStatus === 'all'
                  ? 'Upload your first document to get started with digital signing.'
                  : 'No documents match your current filters.'
              }
              action={
                activeStatus === 'all' ? (
                  <Button asChild className="bg-secondary text-on-secondary hover:bg-accent-hover">
                    <Link href="/dashboard/documents/upload" prefetch={false}>Upload Your First Document</Link>
                  </Button>
                ) : undefined
              }
            />
          </div>
        )}

        {documents.length > 0 && (
          <div className="flex flex-col gap-4 border-t border-border p-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-body-sm text-muted">
              Showing{' '}
              <span className="font-medium tabular-nums text-on-surface">
                {rangeStart}-{rangeEnd}
              </span>{' '}
              of <span className="font-medium tabular-nums text-on-surface">{totalCount}</span> documents
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!data?.previous && page <= 1}
                  aria-label="Previous page"
                  className={outlineButtonClass}
                >
                  <MaterialIcon name="chevron_left" size={18} />
                </Button>
                <span className="flex h-10 min-w-10 items-center justify-center rounded-xl border border-outline-variant bg-surface-container-lowest px-3 text-label-sm font-medium tabular-nums text-primary">
                  {page}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={!data?.next && page >= totalPages}
                  aria-label="Next page"
                  className={outlineButtonClass}
                >
                  <MaterialIcon name="chevron_right" size={18} />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {isFetching && data && (
        <p className="text-caption-xs text-muted">Updating…</p>
      )}

      <DocumentPreviewModal
        document={selectedDocument}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedDocument(null)
        }}
      />
    </div>
  )
}
