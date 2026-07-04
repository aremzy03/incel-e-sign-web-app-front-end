'use client'

import { useCallback, useRef, useState } from 'react'
import type { UploadQueueItemData } from '@/components/library'
import { uploadDocument, type DocumentUploadResponse } from '@/lib/api/documents'

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx']
const MAX_FILE_SIZE = 20 * 1024 * 1024

export function validateDocumentUploadFile(file: File): string | null {
  const fileName = file.name.toLowerCase()
  const hasAllowedExtension = ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext))
  const hasAllowedMimeType = ALLOWED_MIME_TYPES.includes(file.type)

  if (!(hasAllowedMimeType || hasAllowedExtension)) {
    return 'Only PDF or Word (.doc, .docx) files are allowed'
  }

  if (file.size > MAX_FILE_SIZE) {
    return 'File size must be less than 20MB'
  }

  return null
}

function getUploadErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const axiosErr = err as {
      response?: { data?: { detail?: string; message?: string } }
      message?: string
    }
    return (
      axiosErr.response?.data?.detail ||
      axiosErr.response?.data?.message ||
      axiosErr.message ||
      'Upload failed'
    )
  }

  if (err instanceof Error) {
    return err.message
  }

  return 'Upload failed'
}

interface UseDocumentUploadQueueOptions {
  onSuccess?: (result: DocumentUploadResponse, file: File) => void | Promise<void>
  onError?: (message: string, file: File) => void
}

export function useDocumentUploadQueue(options: UseDocumentUploadQueueOptions = {}) {
  const [queue, setQueue] = useState<UploadQueueItemData[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const optionsRef = useRef(options)
  optionsRef.current = options

  const removeFromQueue = useCallback((id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id))
    setError(null)
  }, [])

  const uploadFile = useCallback(
    async (file: File): Promise<DocumentUploadResponse | null> => {
      setError(null)
      const validationError = validateDocumentUploadFile(file)
      if (validationError) {
        setError(validationError)
        optionsRef.current.onError?.(validationError, file)
        return null
      }

      const itemId = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      const isWord = /\.(doc|docx)$/i.test(file.name)

      setQueue((prev) => [
        ...prev,
        {
          id: itemId,
          fileName: file.name,
          status: 'uploading',
          progress: 0,
        },
      ])
      setIsUploading(true)

      const progressInterval = setInterval(() => {
        setQueue((prev) =>
          prev.map((item) =>
            item.id === itemId
              ? { ...item, progress: Math.min((item.progress ?? 0) + 10, 90) }
              : item,
          ),
        )
      }, 200)

      try {
        const result = await uploadDocument(file)
        clearInterval(progressInterval)

        if (isWord) {
          setQueue((prev) =>
            prev.map((item) =>
              item.id === itemId ? { ...item, status: 'converting', progress: undefined } : item,
            ),
          )
          await new Promise((resolve) => setTimeout(resolve, 800))
        }

        setQueue((prev) =>
          prev.map((item) =>
            item.id === itemId ? { ...item, status: 'success', progress: 100 } : item,
          ),
        )

        try {
          await optionsRef.current.onSuccess?.(result, file)
        } catch (callbackErr) {
          console.error('Upload succeeded but onSuccess callback failed:', callbackErr)
        }

        return result
      } catch (err: unknown) {
        clearInterval(progressInterval)
        const message = getUploadErrorMessage(err)
        setError(message)
        setQueue((prev) =>
          prev.map((item) =>
            item.id === itemId ? { ...item, status: 'error', error: message } : item,
          ),
        )
        optionsRef.current.onError?.(message, file)
        return null
      } finally {
        setIsUploading(false)
      }
    },
    [],
  )

  const clearQueue = useCallback(() => {
    setQueue([])
    setError(null)
  }, [])

  return {
    queue,
    isUploading,
    error,
    uploadFile,
    removeFromQueue,
    clearQueue,
  }
}
