'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Download, FileText, Calendar, User, Trash2, AlertCircle, Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'
const PdfViewer = dynamic(() => import('@/components/PdfViewer'), { ssr: false })
import { getDocument, type Document } from '@/lib/api/documents'
import { useDeleteDocument, useDownloadDocument } from '@/hooks/useDocuments'
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
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function DocumentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const documentId = params?.id as string

  // Fetch document from API
  const { data: documentData, isLoading, error } = useQuery({
    queryKey: ['document', documentId],
    queryFn: () => getDocument(documentId),
    enabled: !!documentId,
  })

  // Use the hooks for mutations
  const deleteDocumentMutation = useDeleteDocument()
  const downloadDocumentMutation = useDownloadDocument()

  const handleDownload = () => {
    if (documentId) {
      downloadDocumentMutation.mutate(documentId)
    }
  }

  const handleDelete = () => {
    if (documentId && confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      deleteDocumentMutation.mutate(documentId, {
        onSuccess: () => {
          router.push('/dashboard/documents')
        }
      })
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-white shadow-sm">
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading document...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error || !documentData) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-gray-400 mb-4">
              <FileText className="h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Document not found</h3>
            <p className="text-gray-600 text-center mb-4">
              The document you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Button asChild>
              <a href="/dashboard/documents">Back to Documents</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Document Header */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-red-600 text-sm font-bold">PDF</span>
              </div>
              <div>
                <CardTitle className="text-xl">Document: {documentData.file_name}</CardTitle>
                <div className="flex items-center space-x-4 mt-2">
                  <Badge className={getStatusColor(documentData.status)}>
                    {documentData.status}
                  </Badge>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-1" />
                    Created: {documentData.created_at ? formatDate(documentData.created_at) : 'Unknown'}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-1" />
                    You
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Document Metadata */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Document Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">File Name</label>
              <p className="text-gray-900">{documentData.file_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">File Size</label>
              <p className="text-gray-900">{formatFileSize(documentData.file_size)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">File Type</label>
              <p className="text-gray-900">PDF</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <Badge className={getStatusColor(documentData.status)}>
                {documentData.status}
              </Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Owner</label>
              <p className="text-gray-900">You</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Created</label>
              <p className="text-gray-900">
                {documentData.created_at ? formatDate(documentData.created_at) : 'Unknown'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PDF Preview */}
      <Card className="bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Document Preview</h3>
            {documentData.file_url ? (
              <PdfViewer url={documentData.file_url} />
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 min-h-[500px] flex items-center justify-center">
                <div className="text-center">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">No preview available</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card className="bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Actions</h3>
              <p className="text-sm text-gray-600">
                Download the document or delete it
              </p>
            </div>
            <div className="flex space-x-3">
              <Button 
                onClick={handleDownload} 
                disabled={downloadDocumentMutation.isPending}
                className="flex items-center space-x-2"
              >
                {downloadDocumentMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span>Download</span>
              </Button>
              <Button 
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteDocumentMutation.isPending}
                className="flex items-center space-x-2"
              >
                {deleteDocumentMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span>Delete</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
