'use client'

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { X, Upload, FileText, Plus, Check, Loader2 } from 'lucide-react'
import { useDocuments } from '@/hooks/useDocuments'
import { Document, getDocument, uploadDocument } from '@/lib/api/documents'
import { toast } from 'react-hot-toast'

interface DocumentUploadZoneProps {
  uploadedDocuments: Document[]
  onDocumentAdd: (document: Document) => void
  onDocumentRemove: (documentId: string) => void
  onDocumentSelect: (document: Document) => void
  onMergeDocuments?: () => void
  isMerging?: boolean
}

type UploadState = {
  fileName: string
  percent: number
  index: number
  total: number
} | null

export function DocumentUploadZone({
  uploadedDocuments,
  onDocumentAdd,
  onDocumentRemove,
  onDocumentSelect,
  onMergeDocuments,
  isMerging = false,
}: DocumentUploadZoneProps) {
  const queryClient = useQueryClient()
  const [isDragActive, setIsDragActive] = useState(false)
  const [showExistingDocuments, setShowExistingDocuments] = useState(false)
  const [uploadState, setUploadState] = useState<UploadState>(null)
  const [addingDocumentId, setAddingDocumentId] = useState<string | null>(null)
  const { data: existingDocumentsData, isLoading: loadingExisting } = useDocuments({
    page: 1,
    pageSize: 100,
  })

  const isUploading = uploadState !== null
  const isBusy = isUploading || isMerging || addingDocumentId !== null

  const existingDocuments: Document[] = existingDocumentsData?.results ?? []

  const selectableExistingDocuments = existingDocuments.filter(doc => {
    const status = (doc.status || '').toLowerCase()
    // Only allow draft or rejected documents to be reused in new envelopes
    return status === 'draft' || status === 'rejected'
  })

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (isBusy) return
      setIsDragActive(false)

      const validFiles: File[] = []
      for (const file of acceptedFiles) {
        const allowedMimeTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ]
        const allowedExtensions = ['.pdf', '.doc', '.docx']

        const fileName = file.name.toLowerCase()
        const hasAllowedExtension = allowedExtensions.some((ext) => fileName.endsWith(ext))
        const hasAllowedMimeType = allowedMimeTypes.includes(file.type)

        if (!(hasAllowedMimeType || hasAllowedExtension)) {
          toast.error(`${file.name} is not a supported file type. Only PDF or Word (.doc, .docx) files are allowed.`)
          continue
        }
        validFiles.push(file)
      }

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i]
        setUploadState({
          fileName: file.name,
          percent: 0,
          index: i + 1,
          total: validFiles.length,
        })

        try {
          const result = await uploadDocument(file, (percent) => {
            setUploadState((prev) =>
              prev ? { ...prev, percent } : null,
            )
          })
          onDocumentAdd(result.data as Document)
          toast.success(`${file.name} uploaded successfully`)
          await queryClient.invalidateQueries({ queryKey: ['documents'] })
        } catch (error: any) {
          console.error('Upload error:', error)
          const errorMessage =
            error?.response?.data?.detail ||
            error?.response?.data?.message ||
            `Failed to upload ${file.name}`
          toast.error(errorMessage)
        }
      }

      setUploadState(null)
    },
    [isBusy, onDocumentAdd, queryClient],
  )

  const { getRootProps, getInputProps, isDragActive: dropzoneActive } = useDropzone({
    onDrop,
    onDragEnter: () => {
      if (!isBusy) setIsDragActive(true)
    },
    onDragLeave: () => setIsDragActive(false),
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    multiple: true,
    disabled: isBusy,
  })

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      onDrop(Array.from(files))
      event.target.value = ''
    }
  }

  const handleExistingDocumentSelect = async (document: Document) => {
    if (isBusy) return

    const isAlreadyAdded = uploadedDocuments.some(doc => doc.id === document.id)
    if (isAlreadyAdded) {
      toast.error('Document already added')
      return
    }

    setAddingDocumentId(document.id)
    try {
      const fresh = await getDocument(document.id)
      onDocumentAdd(fresh)
      toast.success(`Added ${fresh.file_name}`)
    } catch (error) {
      console.error('Failed to add existing document:', error)
      toast.error('Failed to add document')
    } finally {
      setAddingDocumentId(null)
    }
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
          border-2 border-dashed rounded-lg p-6 text-center transition-colors w-full min-w-0
          ${isBusy ? 'pointer-events-none opacity-60 cursor-not-allowed' : 'cursor-pointer'}
          ${dropzoneActive || isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
          }
        `}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 mb-1">
          {isUploading
            ? 'Upload in progress…'
            : dropzoneActive
              ? 'Drop PDF or Word files here'
              : 'Drag & drop PDF or Word files here'}
        </p>
        <p className="text-xs text-gray-500">or click to browse</p>
      </div>

      {uploadState && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-600 gap-2">
            <span className="truncate">
              Uploading {uploadState.fileName}
              {uploadState.total > 1 ? ` (${uploadState.index}/${uploadState.total})` : ''}
            </span>
            <span className="flex-shrink-0">{uploadState.percent}%</span>
          </div>
          <Progress value={uploadState.percent} className="w-full" />
        </div>
      )}

      {/* Upload Buttons */}
      <div className="flex items-center gap-2 w-full min-w-0">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 min-w-0 h-8 px-2 text-xs"
          onClick={() => document.getElementById('file-input')?.click()}
          disabled={isBusy}
          title={isUploading ? 'Uploading…' : 'Upload document'}
        >
          {isUploading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Plus className="h-3 w-3" />
          )}
          <span className="sr-only">
            {isUploading ? 'Uploading documents' : 'Upload document'}
          </span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowExistingDocuments(!showExistingDocuments)}
          className="flex-1 min-w-0 h-8 px-2 text-xs"
          disabled={isBusy}
          title={showExistingDocuments ? 'Hide existing documents' : 'Browse existing documents'}
        >
          {showExistingDocuments ? (
            <X className="h-3 w-3" />
          ) : (
            <FileText className="h-3 w-3" />
          )}
          <span className="sr-only">
            {showExistingDocuments ? 'Hide existing documents' : 'Browse existing documents'}
          </span>
        </Button>
        <input
          id="file-input"
          type="file"
          accept=".pdf,.doc,.docx"
          multiple
          disabled={isBusy}
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {/* Existing Documents Browser */}
      {showExistingDocuments && (
        <div className="space-y-2 w-full">
          <h4 className="text-xs font-medium text-gray-700">Existing Documents:</h4>
          {loadingExisting ? (
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 py-4">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Loading documents…</span>
            </div>
          ) : selectableExistingDocuments.length > 0 ? (
            <div className="space-y-1 max-h-32 overflow-y-auto w-full">
              {selectableExistingDocuments.map((doc) => {
                const isAlreadyAdded = uploadedDocuments.some(addedDoc => addedDoc.id === doc.id)
                const isAdding = addingDocumentId === doc.id
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
                        ) : isAdding ? (
                          <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 text-blue-500 hover:text-blue-700 flex-shrink-0"
                            disabled={isBusy}
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
            <div className="text-xs text-gray-500 text-center py-4">
              No eligible documents found (draft or rejected only)
            </div>
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
                        disabled={isBusy}
                      >
                        <FileText className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        onClick={() => onDocumentRemove(doc.id)}
                        disabled={isBusy}
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
            disabled={!onMergeDocuments || isMerging || isBusy}
            onClick={() => onMergeDocuments?.()}
          >
            {isMerging && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
            {isMerging ? 'Merging…' : 'Merge Documents'}
          </Button>
        </div>
      )}
    </div>
  )
}
