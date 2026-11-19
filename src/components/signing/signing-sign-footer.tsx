'use client'

import { useEffect, useRef, useState } from 'react'
import { MaterialIcon } from '@/components/ui/material-icon'
import { cn } from '@/lib/utils'

interface SigningSignFooterProps {
  completedCount: number
  totalCount: number
  canComplete: boolean
  isSubmitting?: boolean
  remainingCount?: number
  onDecline: () => void
  onComplete: () => void
  onSaveText?: () => void
  canSaveText?: boolean
  savingText?: boolean
  addTextMode?: boolean
  onToggleAddText?: () => void
}

export function SigningSignFooter({
  completedCount,
  totalCount,
  canComplete,
  isSubmitting = false,
  remainingCount = 0,
  onDecline,
  onComplete,
  onSaveText,
  canSaveText = false,
  savingText = false,
  addTextMode = false,
  onToggleAddText,
}: SigningSignFooterProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  useEffect(() => {
    if (!menuOpen) return
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [menuOpen])

  const disabledTitle =
    !canComplete && remainingCount > 0
      ? `Complete ${remainingCount} remaining field${remainingCount === 1 ? '' : 's'}`
      : !canComplete
        ? 'Select a signature and complete all fields'
        : undefined

  return (
    <footer className="fixed bottom-0 left-0 z-50 flex h-[72px] w-full items-center gap-2 border-t border-outline-variant bg-surface-container-lowest px-3 md:gap-0 md:px-8">
      {/* Phones: progress is a thin bar along the top edge so the actions have room. */}
      <div
        className="absolute inset-x-0 top-0 h-1 bg-outline-variant md:hidden"
        role="progressbar"
        aria-label="Signing progress"
        aria-valuemin={0}
        aria-valuemax={totalCount}
        aria-valuenow={completedCount}
      >
        <div className="h-full bg-status-your-turn transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex shrink-0 items-center gap-2 md:w-1/3">
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-1 rounded-lg border border-outline-variant px-3 py-2 font-label-sm text-label-sm text-on-surface-variant transition-colors hover:bg-surface-container"
            aria-label="More actions"
            aria-expanded={menuOpen}
          >
            <MaterialIcon name="more_horiz" size={20} />
            <span className="hidden sm:inline">More</span>
          </button>
          {menuOpen ? (
            <div className="absolute bottom-full left-0 mb-2 min-w-[160px] rounded-lg border border-outline-variant bg-surface-container-lowest py-1 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  onDecline()
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-left font-label-sm text-label-sm text-error hover:bg-error-light/30"
              >
                <MaterialIcon name="warning" size={18} />
                Decline to sign
              </button>
            </div>
          ) : null}
        </div>
        {onToggleAddText ? (
          <button
            type="button"
            onClick={onToggleAddText}
            aria-pressed={addTextMode}
            className={cn(
              'flex items-center gap-1 rounded-lg border px-3 py-2 font-label-sm text-label-sm transition-colors',
              addTextMode
                ? 'border-secondary bg-secondary text-on-secondary'
                : 'border-outline-variant text-on-surface-variant hover:bg-surface-container',
            )}
          >
            <MaterialIcon name="text_fields" size={18} />
            <span className="hidden sm:inline">Add text</span>
          </button>
        ) : null}
      </div>

      <div className="hidden w-1/3 flex-col items-center gap-1 md:flex">
        <span className="font-label-sm text-label-sm font-semibold uppercase tracking-widest text-on-surface">
          Progress
        </span>
        <div className="flex w-full max-w-[200px] items-center gap-4">
          <div className="h-1.5 flex-grow overflow-hidden rounded-full bg-outline-variant">
            <div
              className="h-full bg-status-your-turn transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="font-label-xs text-label-xs text-on-surface-variant">
            {completedCount}/{totalCount}
          </span>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 justify-end gap-2 md:w-1/3 md:flex-none">
        {onSaveText ? (
          <button
            type="button"
            disabled={!canSaveText || savingText || isSubmitting}
            onClick={onSaveText}
            className={cn(
              'whitespace-nowrap rounded-lg border border-outline-variant px-3 py-3 font-label-sm text-label-sm text-on-surface md:px-4',
              canSaveText && !savingText && !isSubmitting
                ? 'hover:bg-surface-container'
                : 'cursor-not-allowed opacity-50',
            )}
          >
            {savingText ? 'Saving…' : 'Save text'}
          </button>
        ) : null}
        <button
          type="button"
          disabled={!canComplete || isSubmitting}
          title={disabledTitle}
          onClick={onComplete}
          className={cn(
            'flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-3 font-label-sm text-label-sm shadow-md transition-all md:px-8',
            canComplete && !isSubmitting
              ? 'bg-secondary text-on-secondary hover:bg-accent-hover active:scale-95'
              : 'cursor-not-allowed bg-primary/40 text-on-primary',
          )}
        >
          {isSubmitting ? (
            <span>Processing…</span>
          ) : (
            <>
              <span className="sm:hidden" aria-hidden="true">Sign</span>
              <span className="sr-only sm:not-sr-only">Sign document</span>
            </>
          )}
          <MaterialIcon name="verified" size={18} />
        </button>
      </div>
    </footer>
  )
}
