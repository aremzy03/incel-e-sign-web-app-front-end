'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Trash2, Download, Eye, AlertCircle, Loader2, RefreshCw } from 'lucide-react'
import { DocumentPreviewModal } from '@/components/documents/DocumentPreviewModal'
import { ListPaginationControls } from '@/components/list-pagination-controls'
import { type Document } from '@/lib/api/documents'
import {
  useDocuments,
  useDocumentStatusCounts,
  useDeleteDocument,
  useDownloadDocument,
  type DocumentStatusTab,
} from '@/hooks/useDocuments'

const PAGE_SIZE = 20

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'draft':
      return 'bg-gray-100 text-gray-800'
    case 'sent':
    case 'pending':
      return 'bg-blue-100 text-blue-800'
    case 'completed':
    case 'signed':
      return 'bg-green-100 text-green-800'
    case 'rejected':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const STATUS_ORDER: DocumentStatusTab[] = ['all', 'draft', 'sent', 'completed', 'rejected']

export default function DocumentsPage() {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeStatus, setActiveStatus] = useState<DocumentStatusTab>('all')
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPage(1)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [searchTerm])

  const listStatus = activeStatus === 'all' ? undefined : activeStatus

  const { data, isLoading, error, refetch, isFetching } = useDocuments({
    page,
    pageSize: PAGE_SIZE,
    status: listStatus,
    search: debouncedSearch || undefined,
  })

  const { counts: statusCounts } = useDocumentStatusCounts(debouncedSearch || undefined)

  const deleteDocumentMutation = useDeleteDocument()
  const downloadDocumentMutation = useDownloadDocument()

  const documents = data?.results ?? []
  const totalCount = data?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const handleDocumentClick = (document: Document) => {
    setSelectedDocument(document)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedDocument(null)
  }

  const handleDeleteDocument = (documentId: string) => {
    if (confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      deleteDocumentMutation.mutate(documentId)
    }
  }

  const handleDownloadDocument = (documentId: string) => {
    const doc = documents.find((d) => d.id === documentId)
    if (!doc) return
    downloadDocumentMutation.mutate({ id: documentId, fileName: doc.file_name })
  }

  const handleStatusChange = (status: DocumentStatusTab) => {
    setActiveStatus(status)
    setPage(1)
  }

  if (isLoading && !data) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <PageHeader onRefresh={refetch} />
        <Card className="bg-white shadow-sm">
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading documents...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <PageHeader onRefresh={refetch} />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load documents. Please try again.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader onRefresh={refetch} isRefreshing={isFetching} />

      <Card className="bg-white shadow-sm">
        <CardHeader className="pb-0 space-y-4">
          <div>
            <CardTitle>Your Documents</CardTitle>
            <CardDescription>
              {totalCount} document{totalCount === 1 ? '' : 's'}
              {debouncedSearch ? ` matching "${debouncedSearch}"` : ''}
            </CardDescription>
          </div>
          <Input
            type="search"
            placeholder="Search by file name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent className="pt-4">
          <div className="mb-4 flex flex-wrap gap-2">
            {STATUS_ORDER.map((status) => {
              const label = status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)
              const count = statusCounts[status]
              const isActive = activeStatus === status
              return (
                <Button
                  key={status}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusChange(status)}
                  className="flex items-center gap-2"
                >
                  {label}
                  <span className="rounded-full bg-gray-100 px-2 text-xs text-gray-600">{count}</span>
                </Button>
              )
            })}
          </div>

          {documents.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px] max-w-[200px]">File Name</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((document) => (
                    <TableRow key={document.id}>
                      <TableCell className="font-medium w-[200px] max-w-[200px]">
                        <div className="flex items-center space-x-2 min-w-0">
                          <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center flex-shrink-0">
                            <span className="text-red-600 text-sm font-bold">PDF</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDocumentClick(document)}
                            className="text-blue-600 hover:underline truncate text-left"
                            title={document.file_name}
                          >
                            {document.file_name}
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">You</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(document.status || 'draft')}>
                          {(document.status || 'draft').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {formatFileSize(document.file_size)}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {document.created_at ? formatDate(document.created_at) : 'Unknown'}
                      </TableCell>
                      <TableCell className="text-right w-[120px]">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDocumentClick(document)}
                            className="h-8 w-8 p-0 flex items-center justify-center flex-shrink-0"
                            title="View document"
                            aria-label="View document"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadDocument(document.id)}
                            disabled={downloadDocumentMutation.isPending}
                            className="h-8 w-8 p-0 flex items-center justify-center flex-shrink-0"
                            title="Download document"
                            aria-label="Download document"
                          >
                            {downloadDocumentMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDocument(document.id)}
                            disabled={deleteDocumentMutation.isPending}
                            className="h-8 w-8 p-0 flex items-center justify-center flex-shrink-0 text-red-600 hover:text-red-700"
                            title="Delete document"
                            aria-label="Delete document"
                          >
                            {deleteDocumentMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <ListPaginationControls
                page={page}
                totalPages={totalPages}
                hasPrevious={Boolean(data?.previous) || page > 1}
                hasNext={Boolean(data?.next) || page < totalPages}
                onPrevious={() => setPage((p) => Math.max(1, p - 1))}
                onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
                totalCount={totalCount}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
              <p className="text-gray-600 text-center mb-4">
                {activeStatus === 'all' && !debouncedSearch
                  ? 'Upload your first document to get started with digital signing.'
                  : `No documents match your current filters.`}
              </p>
              {activeStatus === 'all' && !debouncedSearch && (
                <Button asChild>
                  <Link href="/dashboard/documents/upload">Upload Your First Document</Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <DocumentPreviewModal document={selectedDocument} isOpen={isModalOpen} onClose={handleCloseModal} />
    </div>
  )
}

function PageHeader({
  onRefresh,
  isRefreshing,
}: {
  onRefresh: () => void
  isRefreshing?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
        <p className="text-gray-600 mt-1">Manage your uploaded documents and track their status</p>
      </div>
      <div className="flex items-center space-x-2">
        <Button onClick={onRefresh} variant="outline" size="sm" disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <Button asChild>
          <Link href="/dashboard/documents/upload">Upload New Document</Link>
        </Button>
      </div>
    </div>
  )
}
