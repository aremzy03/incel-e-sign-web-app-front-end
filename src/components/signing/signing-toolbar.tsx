'use client'

import { MaterialIcon } from '@/components/ui/material-icon'
import { cn } from '@/lib/utils'

export const SIGNING_ZOOM_DEFAULT = 100
export const SIGNING_ZOOM_STEP = 10
export const SIGNING_ZOOM_MIN = 50
export const SIGNING_ZOOM_MAX = 200

export interface SigningDocumentTab {
  id: string
  label: string
}

export interface SigningToolbarProps {
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  pageIndicator?: string
  documents?: SigningDocumentTab[]
  activeDocumentId?: string
  onDocumentSelect?: (documentId: string) => void
  minZoom?: number
  maxZoom?: number
  className?: string
}

export function SigningToolbar({
  zoom,
  onZoomIn,
  onZoomOut,
  pageIndicator,
  documents = [],
  activeDocumentId,
  onDocumentSelect,
  minZoom = SIGNING_ZOOM_MIN,
  maxZoom = SIGNING_ZOOM_MAX,
  className,
}: SigningToolbarProps) {
  const showDocTabs = documents.length > 1

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      {showDocTabs ? (
        <div className="flex max-w-full gap-1 overflow-x-auto rounded-full border border-outline-variant bg-surface-container-low px-2 py-1">
          {documents.map((doc) => (
            <button
              key={doc.id}
              type="button"
              onClick={() => onDocumentSelect?.(doc.id)}
              className={cn(
                'shrink-0 cursor-pointer rounded-full px-3 py-1 font-label-xs text-label-xs transition-colors',
                activeDocumentId === doc.id
                  ? 'bg-primary text-on-primary'
                  : 'text-on-surface-variant hover:bg-surface-container',
              )}
              title={doc.label}
            >
              <span className="max-w-[120px] truncate">{doc.label}</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex items-center gap-4 rounded-full border border-outline-variant bg-surface-container-low px-4 py-1.5">
        <button
          type="button"
          className="flex cursor-pointer items-center justify-center rounded p-1 text-on-surface-variant transition-colors hover:bg-surface-variant disabled:cursor-not-allowed disabled:opacity-40"
          title="Zoom out"
          aria-label="Zoom out"
          onClick={onZoomOut}
          disabled={zoom <= minZoom}
        >
          <MaterialIcon name="remove" size={20} />
        </button>
        <span className="min-w-[3rem] px-2 text-center font-label-sm text-label-sm text-on-surface">
          {zoom}%
        </span>
        <button
          type="button"
          className="flex cursor-pointer items-center justify-center rounded p-1 text-on-surface-variant transition-colors hover:bg-surface-variant disabled:cursor-not-allowed disabled:opacity-40"
          title="Zoom in"
          aria-label="Zoom in"
          onClick={onZoomIn}
          disabled={zoom >= maxZoom}
        >
          <MaterialIcon name="add" size={20} />
        </button>
        {pageIndicator ? (
          <>
            <div className="mx-1 h-4 w-px bg-outline-variant" />
            <span className="max-w-[200px] truncate font-label-sm text-label-sm text-on-surface lg:max-w-[280px]">
              {pageIndicator}
            </span>
          </>
        ) : null}
      </div>
    </div>
  )
}
