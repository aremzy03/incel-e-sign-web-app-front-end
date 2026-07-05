'use client'

import { MaterialIcon } from '@/components/ui/material-icon'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SigningInlineConfirmProps {
  open: boolean
  signatureImage?: string
  fieldLabel?: string
  contextLabel?: string
  isSubmitting?: boolean
  onConfirm: () => void
  onChangeSignature: () => void
  onDismiss: () => void
  className?: string
}

export function SigningInlineConfirm({
  open,
  signatureImage,
  fieldLabel = 'Signature field',
  contextLabel,
  isSubmitting = false,
  onConfirm,
  onChangeSignature,
  onDismiss,
  className,
}: SigningInlineConfirmProps) {
  if (!open) return null

  return (
    <div
      className={cn(
        'fixed bottom-[72px] left-0 right-0 z-40 border-t border-outline-variant bg-surface-container-lowest px-4 py-3 shadow-lg md:px-8',
        className,
      )}
      role="region"
      aria-label="Confirm signature"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {signatureImage ? (
            <img
              src={signatureImage}
              alt="Selected signature"
              className="h-12 w-28 shrink-0 rounded-md border border-outline-variant bg-white object-contain p-1"
            />
          ) : (
            <div className="flex h-12 w-28 shrink-0 items-center justify-center rounded-md border border-dashed border-outline-variant text-xs text-muted">
              No signature
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate font-label-sm text-label-sm font-semibold text-on-surface">
              {fieldLabel}
            </p>
            {contextLabel ? (
              <p className="truncate font-caption-xs text-caption-xs text-muted">{contextLabel}</p>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onDismiss} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onChangeSignature} disabled={isSubmitting}>
            Change signature
          </Button>
          <Button type="button" size="sm" onClick={onConfirm} disabled={isSubmitting} className="gap-1">
            {isSubmitting ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Signing…
              </>
            ) : (
              <>
                <MaterialIcon name="draw" size={16} />
                Sign this field
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
