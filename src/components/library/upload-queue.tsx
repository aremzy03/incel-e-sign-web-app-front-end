import { cn } from '@/lib/utils'
import { MaterialIcon } from '@/components/ui/material-icon'
import { Progress } from '@/components/ui/progress'

export type UploadQueueItemStatus = 'uploading' | 'converting' | 'success' | 'error'

export interface UploadQueueItemData {
  id: string
  fileName: string
  status: UploadQueueItemStatus
  progress?: number
  error?: string
}

interface UploadQueueProps {
  items: UploadQueueItemData[]
  onRemove?: (id: string) => void
  className?: string
}

export function UploadQueue({ items, onRemove, className }: UploadQueueProps) {
  if (items.length === 0) return null

  return (
    <div className={cn('space-y-3', className)}>
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-4 rounded-xl border border-border bg-surface-container-lowest p-4"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-error-light/50">
            <MaterialIcon name="picture_as_pdf" size={24} fill className="text-error" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-label-sm font-medium text-on-surface">{item.fileName}</p>
            {item.status === 'uploading' && (
              <div className="mt-2 space-y-1">
                <Progress value={item.progress ?? 0} className="h-1.5" />
                <p className="text-caption-xs text-muted">Uploading… {item.progress ?? 0}%</p>
              </div>
            )}
            {item.status === 'converting' && (
              <p className="mt-1 flex items-center gap-1 text-caption-xs text-muted">
                <MaterialIcon name="progress_activity" size={14} className="animate-spin" />
                Converting to PDF…
              </p>
            )}
            {item.status === 'success' && (
              <p className="mt-1 flex items-center gap-1 text-caption-xs text-status-completed">
                <MaterialIcon name="check" size={14} />
                Ready to sign
              </p>
            )}
            {item.status === 'error' && (
              <p className="mt-1 text-caption-xs text-error">{item.error}</p>
            )}
          </div>
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="rounded-lg p-2 text-muted hover:bg-surface-container-low hover:text-error"
              aria-label={`Remove ${item.fileName}`}
            >
              <MaterialIcon name="delete" size={20} />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
