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
  PageHeader,
  SegmentedControl,
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

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
}

function getFileTypeDisplay(fileName: string): {
  icon: MaterialIconName
  bg: string
  color: string
  fill?: boolean
} {
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') {
    return { icon: 'picture_as_pdf', bg: 'bg-error-light', color: 'text-error', fill: true }
  }
  return { icon: 'description', bg: 'bg-info-light', color: 'text-info', fill: true }
}

function OwnerCell({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface-container text-[10px] font-semibold text-muted">
        {getInitials(name)}
      </div>
      <span className="text-body-sm">{name}</span>
    </div>
  )
}

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
      render: (doc) => {
        const fileType = getFileTypeDisplay(doc.file_name)
        return (
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${fileType.bg}`}
          >
            <MaterialIcon
              name={fileType.icon}
              size={20}
              fill={fileType.fill}
              className={fileType.color}
            />
          </div>
        )
      },
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
          className="max-w-[240px] truncate text-left text-body-sm font-medium text-primary hover:underline"
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
        <span className="text-body-sm text-muted">{formatFileSize(doc.file_size)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (doc) => <StatusBadge status={doc.status || 'draft'} />,
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
        <span className="text-body-sm text-muted">
          {doc.created_at ? formatDate(doc.created_at) : 'Unknown'}
        </span>
      ),
    },
  ]

  const canMerge =
    viewMode === 'table' && selectedIds.size >= 2 && !mergeDocumentsMutation.isPending

  return (
    <div className="mx-auto max-w-max-content-width space-y-8">
      <PageHeader
        title="Documents"
        subtitle="Manage and track your electronic signatures and legal documents."
        actions={
          <>
            <Button
              variant="outline"
              disabled={!canMerge}
              onClick={handleMergeSelected}
              className="border-border px-6 py-2.5"
            >
              <MaterialIcon name="merge" size={18} className="mr-2" />
              {mergeDocumentsMutation.isPending ? 'Merging…' : 'Merge Selected'}
            </Button>
            <Button asChild className="bg-secondary px-6 py-2.5 hover:bg-accent-hover">
              <Link href="/dashboard/documents/upload">
                <MaterialIcon name="upload" size={18} className="mr-2" />
                Upload
              </Link>
            </Button>
          </>
        }
      />

      <div className="overflow-hidden rounded-xl border border-border bg-surface-container-lowest shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-4">
          <SegmentedControl
            options={filterOptions}
            value={activeStatus}
            onChange={(v) => {
              setActiveStatus(v as DocumentStatusTab)
              setPage(1)
            }}
          />
          <ViewToggle view={viewMode} onChange={setViewMode} />
        </div>

        {isLoading && !data ? (
          <div className="flex items-center justify-center py-16 text-muted">
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
                <Button onClick={() => refetch()} variant="outline">
                  Retry
                </Button>
              }
            />
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
            {documents.length === 0 ? (
              <EmptyState
                icon="description"
                title="No documents found"
                description="Upload your first document to get started."
                action={
                  <Button asChild>
                    <Link href="/dashboard/documents/upload">Upload Your First Document</Link>
                  </Button>
                }
              />
            ) : (
              documents.map((doc) => {
                const fileType = getFileTypeDisplay(doc.file_name)
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => handleDocumentClick(doc)}
                    className="rounded-xl border border-border bg-surface-container-low p-4 text-left transition-shadow hover:shadow-raised"
                  >
                    <div
                      className={`mb-3 flex h-12 w-12 items-center justify-center rounded-lg ${fileType.bg}`}
                    >
                      <MaterialIcon
                        name={fileType.icon}
                        size={24}
                        fill={fileType.fill}
                        className={fileType.color}
                      />
                    </div>
                    <p className="truncate font-medium text-primary">{doc.file_name}</p>
                    <div className="mt-2">
                      <StatusBadge status={doc.status || 'draft'} />
                    </div>
                  </button>
                )
              })
            )}
          </div>
        ) : documents.length > 0 ? (
          <>
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
                      size="sm"
                      className="h-8 w-8 rounded-full p-0 text-muted hover:bg-surface-container-high"
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
          </>
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
                  <Button asChild>
                    <Link href="/dashboard/documents/upload">Upload Your First Document</Link>
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
              <span className="font-bold text-on-surface">
                {rangeStart}-{rangeEnd}
              </span>{' '}
              of <span className="font-bold text-on-surface">{totalCount}</span> documents
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
                  className="rounded-lg"
                >
                  <MaterialIcon name="chevron_left" size={18} />
                </Button>
                <span className="flex h-10 min-w-10 items-center justify-center rounded-lg bg-secondary px-3 text-body-sm font-bold text-on-secondary">
                  {page}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={!data?.next && page >= totalPages}
                  aria-label="Next page"
                  className="rounded-lg"
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
