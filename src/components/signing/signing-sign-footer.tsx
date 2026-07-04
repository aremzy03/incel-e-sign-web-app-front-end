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
}

export function SigningSignFooter({
  completedCount,
  totalCount,
  canComplete,
  isSubmitting = false,
  remainingCount = 0,
  onDecline,
  onComplete,
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
    <footer className="fixed bottom-0 left-0 z-50 flex h-[72px] w-full items-center border-t border-outline-variant bg-surface-container-lowest px-4 md:px-8">
      <div className="flex w-1/3 items-center gap-2">
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
      </div>

      <div className="flex w-1/3 flex-col items-center gap-1">
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

      <div className="flex w-1/3 justify-end">
        <button
          type="button"
          disabled={!canComplete || isSubmitting}
          title={disabledTitle}
          onClick={onComplete}
          className={cn(
            'flex items-center gap-2 rounded-lg px-6 py-3 font-label-sm text-label-sm shadow-md transition-all md:px-8',
            canComplete && !isSubmitting
              ? 'bg-secondary text-on-secondary hover:bg-accent-hover active:scale-95'
              : 'cursor-not-allowed bg-primary/40 text-on-primary',
          )}
        >
          <span>{isSubmitting ? 'Processing…' : 'Sign document'}</span>
          <MaterialIcon name="verified" size={18} />
        </button>
      </div>
    </footer>
  )
}
