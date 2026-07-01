'use client'

import { useEffect } from 'react'
import { MaterialIcon } from '@/components/ui/material-icon'
import { resolveSignatureImage } from '@/hooks/signing'
import { cn } from '@/lib/utils'

interface SigningMobileSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  completedCount: number
  totalCount: number
  signatures: unknown[]
  selectedSignature: unknown
  onSelectSignature: (sig: unknown) => void
  onUploadClick?: () => void
  isUploading?: boolean
}

export function SigningMobileSheet({
  open,
  onOpenChange,
  completedCount,
  totalCount,
  signatures,
  selectedSignature,
  onSelectSignature,
  onUploadClick,
  isUploading = false,
}: SigningMobileSheetProps) {
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const selectedId =
    selectedSignature && typeof selectedSignature === 'object'
      ? String(
          (selectedSignature as Record<string, unknown>).id ??
            (selectedSignature as Record<string, unknown>).signature_id ??
            '',
        )
      : ''

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onOpenChange])

  return (
    <>
      <button
        type="button"
        className="fixed bottom-[88px] right-4 z-40 flex items-center gap-2 rounded-full bg-secondary px-4 py-2.5 font-label-sm text-label-sm text-on-secondary shadow-lg md:hidden"
        onClick={() => onOpenChange(true)}
        aria-label="Open signature options"
      >
        <MaterialIcon name="gesture" size={18} />
        Signatures
      </button>

      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-[60] bg-black/50 md:hidden"
          aria-label="Close signature sheet"
          onClick={() => onOpenChange(false)}
        />
      ) : null}

      <div
        className={cn(
          'fixed bottom-0 left-0 z-[70] w-full rounded-t-3xl border-t border-outline-variant bg-surface-container-lowest p-6 shadow-2xl transition-transform duration-300 md:hidden',
          open ? 'translate-y-0' : 'translate-y-full pointer-events-none',
        )}
        aria-hidden={!open}
      >
        <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-outline-variant" />
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-headline-lg text-headline-lg text-primary">Your Fields</h3>
          <button
            type="button"
            className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
          >
            <MaterialIcon name="close" size={20} />
          </button>
        </div>

        <div className="mb-6 flex items-center gap-3">
          <div className="h-2 flex-grow overflow-hidden rounded-full bg-outline-variant">
            <div className="h-full bg-status-your-turn transition-all" style={{ width: `${progress}%` }} />
          </div>
          <span className="font-label-sm text-label-sm text-on-surface">
            {completedCount} of {totalCount}
          </span>
        </div>

        <p className="mb-3 font-label-sm text-label-sm uppercase text-on-surface-variant">Select signature</p>
        <div className="grid max-h-[40vh] grid-cols-2 gap-3 overflow-y-auto pb-2">
          {signatures.map((sig, idx) => {
            const sigId =
              sig && typeof sig === 'object'
                ? String(
                    (sig as Record<string, unknown>).id ??
                      (sig as Record<string, unknown>).signature_id ??
                      idx,
                  )
                : String(idx)
            const imageSrc = resolveSignatureImage(sig)
            const isSelected = selectedId === sigId

            return (
              <button
                key={sigId}
                type="button"
                onClick={() => {
                  onSelectSignature(sig)
                  onOpenChange(false)
                }}
                className={cn(
                  'rounded-xl border-2 p-3 transition-all',
                  isSelected
                    ? 'border-status-your-turn bg-accent-light/40 ring-2 ring-status-your-turn/20'
                    : 'border-border',
                )}
              >
                <div className="flex h-16 items-center justify-center rounded bg-surface">
                  {imageSrc ? (
                    <img src={imageSrc} alt="Signature" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span className="text-xs text-muted">No preview</span>
                  )}
                </div>
              </button>
            )
          })}
          {onUploadClick ? (
            <button
              type="button"
              disabled={isUploading}
              onClick={() => {
                onUploadClick()
                onOpenChange(false)
              }}
              className="col-span-2 flex h-12 items-center justify-center gap-2 rounded-xl border border-outline-variant text-on-surface disabled:opacity-50"
            >
              <MaterialIcon name="upload_file" size={20} />
              <span className="font-label-sm text-label-sm">
                {isUploading ? 'Uploading…' : 'Upload Image'}
              </span>
            </button>
          ) : null}
        </div>
      </div>
    </>
  )
}
