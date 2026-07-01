'use client'

import { useCallback } from 'react'
import { cn } from '@/lib/utils'
import { MaterialIcon } from '@/components/ui/material-icon'

interface FileDropzoneProps {
  onFileSelect: (file: File) => void
  isDragOver: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onBrowseClick: () => void
  error?: string | null
  disabled?: boolean
  accept?: string
  maxSizeLabel?: string
  className?: string
}

export function FileDropzone({
  onFileSelect,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onBrowseClick,
  error,
  disabled,
  accept = '.pdf,.doc,.docx',
  maxSizeLabel = '20MB',
  className,
}: FileDropzoneProps) {
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) onFileSelect(file)
    },
    [onFileSelect],
  )

  return (
    <div
      className={cn(
        'relative rounded-xl border-2 border-dashed p-8 text-center transition-colors',
        error
          ? 'border-error bg-error-light/30'
          : isDragOver
            ? 'drag-zone-active border-status-your-turn'
            : 'border-border bg-surface-container-low hover:border-outline',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className={cn(
            'flex h-16 w-16 items-center justify-center rounded-full',
            error ? 'bg-error-light text-error' : 'bg-surface-container text-secondary',
          )}
        >
          <MaterialIcon name={error ? 'error' : 'upload_file'} size={32} fill={!!error} />
        </div>
        {error ? (
          <div className="space-y-2">
            <p className="text-body-sm font-medium text-error">{error}</p>
            <button
              type="button"
              onClick={onBrowseClick}
              className="text-label-sm font-medium text-secondary hover:underline"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            <div>
              <p className="text-body-base font-medium text-on-surface">
                {isDragOver ? 'Drop your file here' : 'Drag and drop your file here'}
              </p>
              <p className="mt-1 text-body-sm text-muted">
                or{' '}
                <button
                  type="button"
                  onClick={onBrowseClick}
                  className="font-medium text-secondary hover:underline"
                >
                  browse files
                </button>
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-container px-3 py-1 text-caption-xs text-muted">
              <MaterialIcon name="info" size={14} />
              PDF, Word • Max {maxSizeLabel}
            </span>
          </>
        )}
      </div>
      <input
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="sr-only"
        id="file-dropzone-input"
        disabled={disabled}
      />
    </div>
  )
}
