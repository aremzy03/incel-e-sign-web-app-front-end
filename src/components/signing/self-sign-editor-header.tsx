'use client'

import { MaterialIcon } from '@/components/ui/material-icon'
import { SigningToolbar } from '@/components/signing/signing-toolbar'

interface SelfSignEditorHeaderProps {
  documentTitle: string
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  pageIndicator?: string
  onExit: () => void
}

export function SelfSignEditorHeader({
  documentTitle,
  zoom,
  onZoomIn,
  onZoomOut,
  pageIndicator,
  onExit,
}: SelfSignEditorHeaderProps) {
  return (
    <header className="z-30 flex h-topbar-height w-full shrink-0 items-center justify-between border-b border-border bg-surface-container-lowest px-4 md:px-8">
      <div className="flex min-w-0 items-center gap-4 md:gap-6">
        <div className="shrink-0 font-headline-xl text-headline-xl font-bold text-primary">Incel E-Sign</div>
        <div className="hidden h-6 w-px bg-border md:block" />
        <div className="hidden min-w-0 items-center gap-2 md:flex">
          <MaterialIcon name="description" size={20} className="shrink-0 text-muted" />
          <span className="truncate font-label-sm text-label-sm text-on-surface">{documentTitle}</span>
        </div>
      </div>

      <SigningToolbar
        zoom={zoom}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        pageIndicator={pageIndicator}
        className="hidden bg-surface-container md:flex"
      />

      <div className="flex items-center gap-3 md:gap-4">
        <button
          type="button"
          className="cursor-pointer font-label-sm text-label-sm text-muted transition-colors hover:text-primary"
        >
          Help
        </button>
        <button
          type="button"
          onClick={onExit}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 font-label-sm text-label-sm text-on-surface-variant transition-colors hover:bg-surface-container-low md:px-4"
        >
          <MaterialIcon name="logout" size={18} />
          <span className="hidden sm:inline">Exit</span>
        </button>
      </div>
    </header>
  )
}
