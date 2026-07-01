'use client'

import { MaterialIcon } from '@/components/ui/material-icon'
import { cn } from '@/lib/utils'

export const SIGNING_ZOOM_DEFAULT = 100
export const SIGNING_ZOOM_STEP = 10
export const SIGNING_ZOOM_MIN = 50
export const SIGNING_ZOOM_MAX = 200

export interface SigningToolbarProps {
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  pageIndicator?: string
  minZoom?: number
  maxZoom?: number
  className?: string
}

export function SigningToolbar({
  zoom,
  onZoomIn,
  onZoomOut,
  pageIndicator,
  minZoom = SIGNING_ZOOM_MIN,
  maxZoom = SIGNING_ZOOM_MAX,
  className,
}: SigningToolbarProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-full border border-outline-variant bg-surface-container-low px-4 py-1.5',
        className,
      )}
    >
      <button
        type="button"
        className="flex items-center justify-center rounded p-1 text-on-surface-variant transition-colors hover:bg-surface-variant disabled:cursor-not-allowed disabled:opacity-40"
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
        className="flex items-center justify-center rounded p-1 text-on-surface-variant transition-colors hover:bg-surface-variant disabled:cursor-not-allowed disabled:opacity-40"
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
          <span className="font-label-sm text-label-sm text-on-surface">{pageIndicator}</span>
        </>
      ) : null}
    </div>
  )
}
