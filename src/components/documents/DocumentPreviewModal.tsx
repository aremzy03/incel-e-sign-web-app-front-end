'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface Document {
  id: number
  fileName: string
  status: string
  uploadedAt: string
  size: string
}

interface DocumentPreviewModalProps {
  document: Document | null
  isOpen: boolean
  onClose: () => void
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

export function DocumentPreviewModal({ document, isOpen, onClose }: DocumentPreviewModalProps) {
  if (!document) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">
            {document.fileName}
          </DialogTitle>
          <DialogDescription>
            Document preview and details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* PDF Preview Area */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b">
              <h3 className="text-sm font-medium text-gray-700">PDF Preview</h3>
            </div>
            <div className="h-96 bg-gray-100 flex items-center justify-center">
              {/* PDF Preview Placeholder */}
              <div className="text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-600 font-medium">PDF Preview</p>
                <p className="text-sm text-gray-500 mt-1">
                  Document preview will be displayed here
                </p>
                {/* Future: Replace with actual PDF iframe */}
                {/* <iframe
                  src={`/api/documents/${document.id}/preview`}
                  className="w-full h-full"
                  title={`Preview of ${document.fileName}`}
                /> */}
              </div>
            </div>
          </div>

          {/* Document Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Status</h4>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  document.status
                )}`}
              >
                {document.status}
              </span>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Uploaded At</h4>
              <p className="text-sm text-gray-600">{document.uploadedAt}</p>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">File Size</h4>
              <p className="text-sm text-gray-600">{document.size}</p>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">File Type</h4>
              <p className="text-sm text-gray-600">PDF Document</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button>
              Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
