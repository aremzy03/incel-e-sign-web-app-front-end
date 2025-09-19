'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, FileText, Calendar, User } from 'lucide-react'

// Dummy document data - in a real app this would come from an API
const dummyDocuments = [
  {
    id: 1,
    fileName: 'contract.pdf',
    status: 'Draft',
    uploadedAt: '2025-09-16',
    size: '2.3 MB',
    uploadedBy: 'John Doe'
  },
  {
    id: 2,
    fileName: 'nda.pdf',
    status: 'Sent',
    uploadedAt: '2025-09-15',
    size: '1.8 MB',
    uploadedBy: 'Jane Smith'
  },
  {
    id: 3,
    fileName: 'invoice.pdf',
    status: 'Signed',
    uploadedAt: '2025-09-14',
    size: '0.9 MB',
    uploadedBy: 'Bob Johnson'
  }
]

// Mock user data - in a real app this would come from auth context
const mockUser = {
  id: '1',
  email: 'admin@example.com',
  first_name: 'Admin',
  last_name: 'User',
  role: 'admin', // Change to 'user' to test non-admin behavior
  created_at: '2025-01-01',
  updated_at: '2025-01-01'
}

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

export default function DocumentReviewPage() {
  const params = useParams()
  const documentId = parseInt(params?.id as string)
  
  // Find the document by ID
  const document = dummyDocuments.find(doc => doc.id === documentId)
  
  // If document not found, show error state
  if (!document) {
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

  const handleDownload = () => {
    console.log(`Downloading ${document.fileName}`)
    // In a real app, this would trigger the actual download
  }

  const handleViewAuditTrail = () => {
    console.log(`Viewing audit trail for ${document.fileName}`)
    // In a real app, this would navigate to the audit trail page
  }

  const isAdmin = mockUser.role === 'admin'

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
                <CardTitle className="text-xl">Document: {document.fileName}</CardTitle>
                <div className="flex items-center space-x-4 mt-2">
                  <Badge className={getStatusColor(document.status)}>
                    {document.status}
                  </Badge>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-1" />
                    Uploaded: {document.uploadedAt}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-1" />
                    {document.uploadedBy}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* PDF Preview */}
      <Card className="bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Document Preview</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 min-h-[500px] flex items-center justify-center">
              <div className="text-center">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">PDF Preview Placeholder</p>
                <p className="text-sm text-gray-500 mt-2">
                  In a real implementation, this would show an embedded PDF viewer
                </p>
                <div className="mt-4 text-xs text-gray-400">
                  File: {document.fileName} ({document.size})
                </div>
              </div>
            </div>
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
                Download the document or view its audit trail
              </p>
            </div>
            <div className="flex space-x-3">
              <Button onClick={handleDownload} className="flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Download</span>
              </Button>
              {isAdmin && (
                <Button 
                  variant="outline" 
                  onClick={handleViewAuditTrail}
                  className="flex items-center space-x-2"
                >
                  <FileText className="h-4 w-4" />
                  <span>View Audit Trail</span>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
