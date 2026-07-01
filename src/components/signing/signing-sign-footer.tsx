'use client'

import Link from 'next/link'
import { MaterialIcon } from '@/components/ui/material-icon'
import { cn } from '@/lib/utils'

interface SigningSignFooterProps {
  completedCount: number
  totalCount: number
  canComplete: boolean
  isSubmitting?: boolean
  onDecline: () => void
  onFinishLater: () => void
  onComplete: () => void
}

export function SigningSignFooter({
  completedCount,
  totalCount,
  canComplete,
  isSubmitting = false,
  onDecline,
  onFinishLater,
  onComplete,
}: SigningSignFooterProps) {
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <footer className="fixed bottom-0 left-0 z-50 flex h-[72px] w-full items-center border-t border-outline-variant bg-surface-container-lowest px-4 md:px-8">
      <div className="flex w-1/3 items-center gap-4">
        <button
          type="button"
          onClick={onDecline}
          className="rounded-lg border border-error px-4 py-2 font-label-sm text-label-sm text-error transition-colors hover:bg-error-light md:px-6"
        >
          Decline
        </button>
        <button
          type="button"
          onClick={onFinishLater}
          className="hidden font-label-sm text-label-sm text-on-surface-variant hover:underline md:inline"
        >
          Finish Later
        </button>
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
          onClick={onComplete}
          className={cn(
            'flex items-center gap-2 rounded-lg px-6 py-3 font-label-sm text-label-sm shadow-md transition-all md:px-8',
            canComplete && !isSubmitting
              ? 'bg-secondary text-on-secondary hover:bg-accent-hover active:scale-95'
              : 'cursor-not-allowed bg-primary/40 text-on-primary',
          )}
        >
          <span>{isSubmitting ? 'Processing…' : 'Complete Signing'}</span>
          <MaterialIcon name="verified" size={18} />
        </button>
      </div>
    </footer>
  )
}
