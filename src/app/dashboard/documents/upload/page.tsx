'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MaterialIcon } from '@/components/ui/material-icon'
import { PageHeader, FileDropzone, UploadQueue } from '@/components/library'
import { useDocumentUploadQueue } from '@/hooks/useDocumentUploadQueue'
import toast from 'react-hot-toast'

export default function DocumentUploadPage() {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadedId, setUploadedId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { queue, isUploading, error, uploadFile, removeFromQueue } = useDocumentUploadQueue({
    onSuccess: (result) => {
      setUploadedId(result.data.id)
      toast.success('Document uploaded successfully')
    },
    onError: (message) => {
      toast.error(message)
    },
  })

  const handleFileSelect = useCallback(
    async (file: File) => {
      setUploadedId(null)
      await uploadFile(file)
    },
    [uploadFile],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) handleFileSelect(files[0])
    },
    [handleFileSelect],
  )

  const handleBrowseClick = () => fileInputRef.current?.click()

  const handleRemove = (id: string) => {
    removeFromQueue(id)
    setUploadedId(null)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Upload Documents"
        subtitle="Add PDF or Word files to your document library"
        actions={
          <Button variant="outline" asChild>
            <Link href="/dashboard/documents">
              <MaterialIcon name="arrow_back" size={18} className="mr-2" />
              Back to Documents
            </Link>
          </Button>
        }
      />

      <div className="rounded-xl border border-border bg-surface-container-lowest p-6 shadow-card">
        <FileDropzone
          onFileSelect={handleFileSelect}
          isDragOver={isDragOver}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onBrowseClick={handleBrowseClick}
          error={error}
          disabled={isUploading}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFileSelect(file)
          }}
        />

        {queue.length > 0 && (
          <div className="mt-6">
            <UploadQueue items={queue} onRemove={handleRemove} />
          </div>
        )}

        {uploadedId && (
          <div className="mt-6 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
            <Button variant="outline" asChild className="sm:flex-1">
              <Link href={`/dashboard/envelopes/self-sign?documentId=${uploadedId}`}>
                Sign Myself
              </Link>
            </Button>
            <Button asChild className="bg-secondary hover:bg-accent-hover sm:flex-1">
              <Link href={`/dashboard/envelopes/create?documentId=${uploadedId}`}>
                Create Envelope
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
