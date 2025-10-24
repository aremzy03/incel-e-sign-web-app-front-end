'use client'

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, Upload, FileText, Plus, Check } from 'lucide-react'
import { useUploadDocument, useDocuments } from '@/hooks/useDocuments'
import { Document } from '@/lib/api/documents'
import { toast } from 'react-hot-toast'

interface DocumentUploadZoneProps {
  uploadedDocuments: Document[]
  onDocumentAdd: (document: Document) => void
  onDocumentRemove: (documentId: string) => void
  onDocumentSelect: (document: Document) => void
}

export function DocumentUploadZone({
  uploadedDocuments,
  onDocumentAdd,
  onDocumentRemove,
  onDocumentSelect,
}: DocumentUploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const [showExistingDocuments, setShowExistingDocuments] = useState(false)
  const uploadMutation = useUploadDocument()
  const { data: existingDocuments, isLoading: loadingExisting } = useDocuments()

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setIsDragActive(false)
      
      for (const file of acceptedFiles) {
        if (file.type !== 'application/pdf') {
          toast.error(`${file.name} is not a PDF file`)
          continue
        }

        try {
        const result = await uploadMutation.mutateAsync(file)
        onDocumentAdd(result.data as Document)
        toast.success(`${file.name} uploaded successfully`)
        } catch (error) {
          console.error('Upload error:', error)
          toast.error(`Failed to upload ${file.name}`)
        }
      }
    },
    [uploadMutation, onDocumentAdd]
  )

  const { getRootProps, getInputProps, isDragActive: dropzoneActive } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: true
  })

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      onDrop(Array.from(files))
    }
  }

  const handleExistingDocumentSelect = (document: Document) => {
    const isAlreadyAdded = uploadedDocuments.some(doc => doc.id === document.id)
    if (isAlreadyAdded) {
      toast.error('Document already added')
      return
    }
    onDocumentAdd(document)
    toast.success(`Added ${document.file_name}`)
  }

  return (
    <div className="space-y-4 w-full min-w-0">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Documents</h3>
        <Badge variant="secondary">{uploadedDocuments.length}</Badge>
      </div>

      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors w-full min-w-0
          ${dropzoneActive || isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
        `}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 mb-1">
          {dropzoneActive ? 'Drop PDF files here' : 'Drag & drop PDF files here'}
        </p>
        <p className="text-xs text-gray-500">or click to browse</p>
      </div>

      {/* Upload Buttons */}
      <div className="flex items-center gap-2 w-full min-w-0">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 min-w-0"
          onClick={() => document.getElementById('file-input')?.click()}
          disabled={uploadMutation.isPending}
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="truncate">{uploadMutation.isPending ? 'Uploading...' : 'Upload PDF'}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowExistingDocuments(!showExistingDocuments)}
          className="flex-1 min-w-0"
        >
          <FileText className="h-4 w-4 mr-2" />
          <span className="truncate">{showExistingDocuments ? 'Hide' : 'Browse'} Existing</span>
        </Button>
        <input
          id="file-input"
          type="file"
          accept=".pdf"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {/* Existing Documents Browser */}
      {showExistingDocuments && (
        <div className="space-y-2 w-full">
          <h4 className="text-xs font-medium text-gray-700">Existing Documents:</h4>
          {loadingExisting ? (
            <div className="text-xs text-gray-500 text-center py-4">Loading documents...</div>
          ) : existingDocuments && existingDocuments.length > 0 ? (
            <div className="space-y-1 max-h-32 overflow-y-auto w-full">
              {existingDocuments.map((doc) => {
                const isAlreadyAdded = uploadedDocuments.some(addedDoc => addedDoc.id === doc.id)
                return (
                  <div key={doc.id} className={`p-2 border rounded w-full ${isAlreadyAdded ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center gap-2 w-full">
                      <FileText className="h-3 w-3 text-gray-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="text-xs font-medium text-gray-900 truncate">
                          {doc.file_name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {(doc.file_size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {isAlreadyAdded ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <Check className="h-3 w-3" />
                            <span className="text-xs">Added</span>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 text-blue-500 hover:text-blue-700 flex-shrink-0"
                            onClick={() => handleExistingDocumentSelect(doc)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-xs text-gray-500 text-center py-4">No existing documents found</div>
          )}
        </div>
      )}

      {/* Selected Documents List */}
      {uploadedDocuments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-700">Selected Documents:</h4>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {uploadedDocuments.map((doc) => (
              <Card key={doc.id} className="p-2">
                <CardContent className="p-0">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">
                        {doc.file_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(doc.file_size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => onDocumentSelect(doc)}
                      >
                        <FileText className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        onClick={() => onDocumentRemove(doc.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Merge Documents Option */}
      {uploadedDocuments.length > 1 && (
        <div className="pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => {
              // TODO: Implement document merge functionality
              toast('Document merge feature coming soon!')
            }}
          >
            Merge Documents
          </Button>
        </div>
      )}
    </div>
  )
}
