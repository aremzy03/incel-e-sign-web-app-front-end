'use client'

import { MaterialIcon } from '@/components/ui/material-icon'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SigningProcessingOverlayProps {
  open: boolean
  title?: string
  message?: string
  phase?: 'polling' | 'timeout' | 'failed'
  errorMessage?: string | null
  onRetry?: () => void
  onKeepWaiting?: () => void
  className?: string
}

export function SigningProcessingOverlay({
  open,
  title = 'Signing your document…',
  message = 'Please wait while we embed your signature. This may take a moment.',
  phase = 'polling',
  errorMessage,
  onRetry,
  onKeepWaiting,
  className,
}: SigningProcessingOverlayProps) {
  if (!open) return null

  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4',
        className,
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="signing-processing-title"
    >
      <div className="w-full max-w-md rounded-xl border border-border bg-surface-container-lowest p-6 shadow-lg">
        {phase === 'failed' ? (
          <>
            <div className="mb-4 flex items-center gap-3 text-error">
              <MaterialIcon name="error" size={24} />
              <h2 id="signing-processing-title" className="font-headline-sm text-headline-sm">
                Signing failed
              </h2>
            </div>
            <p className="mb-6 text-body-sm text-muted">
              {errorMessage || 'Something went wrong while signing your document.'}
            </p>
            {onRetry ? (
              <Button onClick={onRetry} className="w-full">
                Retry
              </Button>
            ) : null}
          </>
        ) : phase === 'timeout' ? (
          <>
            <div className="mb-4 flex items-center gap-3 text-status-your-turn">
              <MaterialIcon name="schedule" size={24} />
              <h2 id="signing-processing-title" className="font-headline-sm text-headline-sm">
                Still processing…
              </h2>
            </div>
            <p className="mb-6 text-body-sm text-muted">
              Signing is taking longer than usual. Your document is still being processed.
            </p>
            {onKeepWaiting ? (
              <Button onClick={onKeepWaiting} className="w-full">
                Keep waiting
              </Button>
            ) : null}
          </>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-3">
              <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <h2 id="signing-processing-title" className="font-headline-sm text-headline-sm">
                {title}
              </h2>
            </div>
            <p className="text-body-sm text-muted">{message}</p>
          </>
        )}
      </div>
    </div>
  )
}
