'use client'

import { useMemo } from 'react'
import { useSession } from 'next-auth/react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import dynamic from 'next/dynamic'
const PdfViewer = dynamic(() => import('@/components/PdfViewer'), { ssr: false })

import { Document as ApiDocument } from '@/lib/api/documents'
import { getApiBaseUrl } from '@/lib/env'

interface DocumentPreviewModalProps {
  document: ApiDocument | null
  isOpen: boolean
  onClose: () => void
  /**
   * Optional password for opening password-protected PDFs when previewing.
   */
  pdfPassword?: string
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

export function DocumentPreviewModal({ document, isOpen, onClose, pdfPassword }: DocumentPreviewModalProps) {
  const { data: session } = useSession()
  const accessToken = session?.accessToken as string | undefined

  const previewUrl = useMemo(() => {
    if (!document || !isOpen) return null
    const base = getApiBaseUrl().replace(/\/$/, '')
    return `${base}/documents/${document.id}/preview/`
  }, [document, isOpen])

  const httpHeaders = useMemo(() => {
    if (!accessToken) return undefined
    return { Authorization: `Bearer ${accessToken}` }
  }, [accessToken])

  if (!document) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">
            {document.file_name}
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
            <div className="min-h-96 max-h-[65vh] overflow-auto bg-gray-100">
              {previewUrl ? (
                <div className="w-full p-4 flex justify-center">
                  <PdfViewer
                    url={previewUrl}
                    pdfPassword={pdfPassword}
                    httpHeaders={httpHeaders}
                  />
                </div>
              ) : (
                <div className="text-center text-gray-600">No preview available</div>
              )}
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
              <h4 className="text-sm font-medium text-gray-700">Created At</h4>
              <p className="text-sm text-gray-600">
                {document.created_at ? new Date(document.created_at).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">File Size</h4>
              <p className="text-sm text-gray-600">
                {document.file_size ? `${(document.file_size / (1024 * 1024)).toFixed(2)} MB` : 'Unknown'}
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">File Type</h4>
              <p className="text-sm text-gray-600">PDF Document</p>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Owner</h4>
              <p className="text-sm text-gray-600">You</p>
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
