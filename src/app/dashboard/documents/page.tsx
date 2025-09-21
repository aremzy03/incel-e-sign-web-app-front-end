'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { type Document } from '@/lib/api/documents'
import { useDocuments, useDeleteDocument, useDownloadDocument } from '@/hooks/useDocuments'
import toast from 'react-hot-toast'

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'draft':
      return 'bg-gray-100 text-gray-800'
    case 'sent':
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
    day: 'numeric'
  })
}

export default function DocumentsPage() {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Fetch documents from API using the hook
  const { data: documentsData, isLoading, error, refetch } = useDocuments()

  // Debug: Log when documents are fetched
  useEffect(() => {
    console.log('Documents page - Documents data updated:', {
      documentsCount: documentsData?.length || 0,
      isLoading,
      error: error?.message
    })
  }, [documentsData, isLoading, error])

  // Use the hooks for mutations
  const deleteDocumentMutation = useDeleteDocument()
  const downloadDocumentMutation = useDownloadDocument()

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
    downloadDocumentMutation.mutate(documentId)
  }

  const documents = documentsData || []

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
            <p className="text-gray-600 mt-1">
              Manage your uploaded documents and track their status
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/documents/upload">
              Upload New Document
            </Link>
          </Button>
        </div>
        
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

  // Error state
  if (error) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
            <p className="text-gray-600 mt-1">
              Manage your uploaded documents and track their status
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/documents/upload">
              Upload New Document
            </Link>
          </Button>
        </div>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load documents. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600 mt-1">
            Manage your uploaded documents and track their status
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={() => {
              console.log('Manual refresh triggered')
              refetch()
            }}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button asChild>
            <Link href="/dashboard/documents/upload">
              Upload New Document
            </Link>
          </Button>
        </div>
      </div>

      {/* Documents Table */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Your Documents</CardTitle>
          <CardDescription>
            View and manage all your uploaded documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                          <span className="text-red-600 text-sm font-bold">PDF</span>
                        </div>
                        <span className="text-gray-900">{document.file_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      You
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(document.status)}>
                        {document.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {formatFileSize(document.file_size)}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {document.created_at ? formatDate(document.created_at) : 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDocumentClick(document)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadDocument(document.id)}
                          disabled={downloadDocumentMutation.isPending}
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
                          className="text-red-600 hover:text-red-700"
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
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
              <p className="text-gray-600 text-center mb-4">
                Upload your first document to get started with digital signing
              </p>
              <Button asChild>
                <Link href="/dashboard/documents/upload">
                  Upload Your First Document
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        document={selectedDocument}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  )
}
