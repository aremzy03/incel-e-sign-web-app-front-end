'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useQueryClient } from '@tanstack/react-query'
import { MaterialIcon } from '@/components/ui/material-icon'
import { UploadQueue } from '@/components/library'
import { Document, type DocumentUploadResponse } from '@/lib/api/documents'
import { useDocumentUploadQueue } from '@/hooks/useDocumentUploadQueue'
import { toast } from 'react-hot-toast'

interface WizardDocumentUploadProps {
  onDocumentAdd: (document: Document) => void
  disabled?: boolean
}

export function WizardDocumentUpload({ onDocumentAdd, disabled = false }: WizardDocumentUploadProps) {
  const queryClient = useQueryClient()

  const { queue, isUploading, error, uploadFile, removeFromQueue } = useDocumentUploadQueue({
    onSuccess: (result: DocumentUploadResponse) => {
      onDocumentAdd(result.data as Document)
      // Refresh library in the background; do not block upload completion.
      void queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
    onError: (message, file) => {
      toast.error(message || `Failed to upload ${file.name}`)
    },
  })

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (disabled || isUploading) return

      for (const file of acceptedFiles) {
        const result = await uploadFile(file)
        if (result) {
          toast.success(`${file.name} uploaded successfully`)
        }
      }
    },
    [disabled, isUploading, uploadFile],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    multiple: true,
    disabled: disabled || isUploading,
  })

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-lowest p-12 shadow-sm transition-all hover:bg-primary-light ${
          isDragActive ? 'border-secondary bg-accent-light/30' : ''
        } ${disabled || isUploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container transition-colors group-hover:bg-secondary-container">
          <MaterialIcon name="upload_file" size={32} className="text-primary group-hover:text-on-secondary-container" />
        </div>
        <h3 className="text-headline-lg font-semibold text-primary">Upload New Document</h3>
        <p className="mt-2 max-w-sm text-center text-body-sm text-on-surface-variant">
          Drag and drop your files here or{' '}
          <span className="font-semibold text-secondary underline">browse files</span>. Supports PDF,
          DOCX, and Word up to 25MB.
        </p>
        {isUploading ? (
          <p className="mt-4 text-sm text-muted">Upload in progress…</p>
        ) : null}
      </div>

      {error ? <p className="text-sm text-error">{error}</p> : null}

      {queue.length > 0 ? <UploadQueue items={queue} onRemove={removeFromQueue} /> : null}
    </div>
  )
}
