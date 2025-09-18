'use client'

import { useState } from 'react'
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
import { DocumentPreviewModal } from '@/components/documents/DocumentPreviewModal'

// Dummy data for documents
const dummyDocuments = [
  {
    id: 1,
    fileName: 'contract.pdf',
    status: 'Draft',
    uploadedAt: '2025-09-16',
    size: '2.3 MB'
  },
  {
    id: 2,
    fileName: 'nda.pdf',
    status: 'Sent',
    uploadedAt: '2025-09-15',
    size: '1.8 MB'
  },
  {
    id: 3,
    fileName: 'invoice.pdf',
    status: 'Signed',
    uploadedAt: '2025-09-14',
    size: '0.9 MB'
  },
  {
    id: 4,
    fileName: 'agreement.pdf',
    status: 'Draft',
    uploadedAt: '2025-09-13',
    size: '3.1 MB'
  },
  {
    id: 5,
    fileName: 'proposal.pdf',
    status: 'Sent',
    uploadedAt: '2025-09-12',
    size: '1.5 MB'
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Draft':
      return 'bg-gray-100 text-gray-800'
    case 'Sent':
      return 'bg-blue-100 text-blue-800'
    case 'Signed':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default function DocumentsPage() {
  const [selectedDocument, setSelectedDocument] = useState<typeof dummyDocuments[0] | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleDocumentClick = (documentId: number) => {
    const document = dummyDocuments.find(doc => doc.id === documentId)
    if (document) {
      setSelectedDocument(document)
      setIsModalOpen(true)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedDocument(null)
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
        <Button asChild>
          <Link href="/dashboard/documents/upload">
            Upload New Document
          </Link>
        </Button>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dummyDocuments.map((document) => (
                <TableRow
                  key={document.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleDocumentClick(document.id)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                        <span className="text-red-600 text-sm font-bold">PDF</span>
                      </div>
                      <span className="text-gray-900">{document.fileName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        document.status
                      )}`}
                    >
                      {document.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {document.size}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {document.uploadedAt}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Empty State (hidden when documents exist) */}
      {dummyDocuments.length === 0 && (
        <Card className="bg-white shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
            <p className="text-gray-600 text-center mb-4">
              Upload your first document to get started with digital signing
            </p>
            <Button asChild>
              <Link href="/dashboard/documents/upload">
                Upload Your First Document
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        document={selectedDocument}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  )
}
