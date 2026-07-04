'use client'

import Link from 'next/link'
import { MaterialIcon } from '@/components/ui/material-icon'
import { resolveSignatureImage } from '@/hooks/signing'
import type { SigningFieldChecklistItem } from '@/lib/signing/signing-field-checklist'
import { cn } from '@/lib/utils'

interface SigningFieldsSidebarProps {
  completedCount: number
  totalCount: number
  fieldItems: SigningFieldChecklistItem[]
  activeFieldId?: string
  signatures: unknown[]
  selectedSignature: unknown
  onSelectSignature: (sig: unknown) => void
  onFieldSelect?: (item: SigningFieldChecklistItem) => void
  onUploadClick: () => void
  isUploading?: boolean
  manageHref?: string
  className?: string
}

export function SigningFieldsSidebar({
  completedCount,
  totalCount,
  fieldItems,
  activeFieldId,
  signatures,
  selectedSignature,
  onSelectSignature,
  onFieldSelect,
  onUploadClick,
  isUploading = false,
  manageHref,
  className,
}: SigningFieldsSidebarProps) {
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const selectedId =
    selectedSignature && typeof selectedSignature === 'object'
      ? String(
          (selectedSignature as Record<string, unknown>).id ??
            (selectedSignature as Record<string, unknown>).signature_id ??
            '',
        )
      : ''

  return (
    <aside
      className={cn(
        'hidden w-sidebar-width shrink-0 flex-col overflow-y-auto border-l border-outline-variant bg-surface-container-lowest shadow-lg md:flex',
        className,
      )}
    >
      <div className="border-b border-outline-variant bg-surface-container-low p-6">
        <h3 className="font-headline-lg text-headline-lg text-primary">Your Fields</h3>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-2 flex-grow overflow-hidden rounded-full bg-outline-variant">
            <div className="h-full bg-status-your-turn transition-all" style={{ width: `${progress}%` }} />
          </div>
          <span className="font-label-sm text-label-sm text-on-surface">
            {completedCount} of {totalCount}
          </span>
        </div>
      </div>

      {fieldItems.length > 0 ? (
        <div className="space-y-2 p-4">
          {fieldItems.map((item) => {
            const isActive = item.id === activeFieldId && !item.completed
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onFieldSelect?.(item)}
                className={cn(
                  'flex w-full cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition-colors',
                  item.completed
                    ? 'border-success-light bg-success-light/20 opacity-70'
                    : isActive
                      ? 'border-status-your-turn bg-accent-light/40 ring-2 ring-status-your-turn/20'
                      : 'border-outline-variant bg-surface-container-lowest hover:bg-surface-container',
                )}
              >
                <MaterialIcon
                  name={item.completed ? 'check_circle' : 'pending'}
                  size={20}
                  className={item.completed ? 'text-status-completed' : 'text-status-your-turn'}
                  fill={item.completed}
                />
                <span
                  className={cn(
                    'font-body-sm text-body-sm text-on-surface',
                    item.completed && 'line-through',
                    isActive && 'font-semibold',
                  )}
                >
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      ) : null}

      <div className="mt-4 px-6 py-2">
        <div className="h-px bg-outline-variant" />
      </div>

      <div className="flex flex-1 flex-col space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h4 className="font-label-sm text-label-sm font-bold uppercase text-primary">Saved Signatures</h4>
          {manageHref ? (
            <Link href={manageHref} className="font-label-xs text-label-xs text-status-your-turn hover:underline">
              Manage
            </Link>
          ) : null}
        </div>

        <div className="space-y-4">
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
                onClick={() => onSelectSignature(sig)}
                className={cn(
                  'relative flex h-24 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 p-4 shadow-inner transition-all',
                  isSelected
                    ? 'border-primary bg-primary-light'
                    : 'border-outline-variant bg-surface-container-lowest hover:bg-surface-container',
                )}
              >
                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt="Signature"
                    className="max-h-full max-w-full object-contain opacity-80 transition-opacity group-hover:opacity-100"
                  />
                ) : (
                  <span className="text-xs text-muted">No preview</span>
                )}
                {isSelected ? (
                  <div className="absolute right-2 top-2 text-primary">
                    <MaterialIcon name="check_circle" size={16} fill />
                  </div>
                ) : null}
              </button>
            )
          })}

          <button
            type="button"
            disabled={isUploading}
            onClick={onUploadClick}
            className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-outline-variant text-on-surface transition-colors hover:bg-surface-container disabled:opacity-50"
          >
            <MaterialIcon name="upload_file" size={20} />
            <span className="font-label-sm text-label-sm">
              {isUploading ? 'Uploading…' : 'Upload Image'}
            </span>
          </button>
        </div>

        <div className="mt-auto">
          <div className="rounded-xl border border-outline-variant bg-surface-container p-4">
            <p className="font-caption-xs text-caption-xs text-on-surface-variant">
              By signing, you agree this is a legally binding signature under the ESIGN Act and UETA.
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
