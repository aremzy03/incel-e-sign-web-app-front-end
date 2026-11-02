'use client'

import { cn } from '@/lib/utils'

interface PdfLoadingIndicatorProps {
  label?: string
  className?: string
  size?: 'sm' | 'md' | 'thumbnail'
}

export function PdfLoadingIndicator({
  label = 'Loading document…',
  className,
  size = 'md',
}: PdfLoadingIndicatorProps) {
  if (size === 'thumbnail') {
    return (
      <div
        className={cn(
          'relative flex h-full w-full flex-col items-center justify-between overflow-hidden bg-white py-3',
          className,
        )}
        role="status"
        aria-live="polite"
        aria-label={label}
      >
        <div className="flex h-full w-[88%] flex-col justify-between">
          <div className="w-full space-y-2">
            <div className="h-2.5 w-2/3 animate-pulse rounded-sm bg-surface-container-high" />
            <div className="w-full space-y-1.5 pt-2">
              <div className="h-1.5 w-full animate-pulse rounded-sm bg-surface-container" />
              <div className="h-1.5 w-11/12 animate-pulse rounded-sm bg-surface-container" />
              <div className="h-1.5 w-4/5 animate-pulse rounded-sm bg-surface-container" />
              <div className="h-1.5 w-full animate-pulse rounded-sm bg-surface-container" />
              <div className="h-1.5 w-3/4 animate-pulse rounded-sm bg-surface-container" />
            </div>
          </div>
          <div className="flex w-full items-center justify-between border-t border-border/50 pt-2">
            <div className="h-3 w-1/3 animate-pulse rounded-sm border border-dashed border-outline-variant bg-surface" />
            <div className="h-3 w-1/4 animate-pulse rounded-sm bg-surface-container" />
          </div>
        </div>
        <div className="pdf-skeleton-shimmer z-10" />
        <span className="sr-only">{label}</span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex w-full flex-col items-center justify-center',
        size === 'md' && 'px-4 py-4',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          'pdf-page-frame relative !flex w-full flex-col !items-center !justify-between overflow-hidden rounded-sm bg-white py-10 sm:py-12',
          size === 'md'
            ? 'aspect-[1/1.414] max-w-[714px] min-h-[540px]'
            : 'aspect-[1/1.414] w-[595px] max-w-full min-h-[420px]',
        )}
      >
        <div className="mx-auto flex h-full w-[90%] flex-1 flex-col justify-between">
          {/* Top document header + paragraphs skeleton */}
          <div className="w-full space-y-6">
            <div className="flex w-full items-start justify-between border-b border-border/70 pb-6">
              <div className="w-2/3 space-y-2.5">
                <div className="h-5 w-3/5 animate-pulse rounded bg-surface-container-highest" />
                <div className="h-3 w-2/5 animate-pulse rounded bg-surface-container" />
              </div>
              <div className="h-8 w-24 shrink-0 animate-pulse rounded bg-surface-container" />
            </div>

            {/* Paragraph 1 */}
            <div className="w-full space-y-3 pt-2">
              <div className="h-3 w-1/4 animate-pulse rounded bg-surface-container-high" />
              <div className="h-2.5 w-full animate-pulse rounded bg-surface-container" />
              <div className="h-2.5 w-11/12 animate-pulse rounded bg-surface-container" />
              <div className="h-2.5 w-full animate-pulse rounded bg-surface-container" />
              <div className="h-2.5 w-4/5 animate-pulse rounded bg-surface-container" />
            </div>

            {/* Paragraph 2 */}
            <div className="w-full space-y-3 pt-4">
              <div className="h-3 w-1/3 animate-pulse rounded bg-surface-container-high" />
              <div className="h-2.5 w-full animate-pulse rounded bg-surface-container" />
              <div className="h-2.5 w-10/12 animate-pulse rounded bg-surface-container" />
              <div className="h-2.5 w-11/12 animate-pulse rounded bg-surface-container" />
              <div className="h-2.5 w-full animate-pulse rounded bg-surface-container" />
              <div className="h-2.5 w-2/3 animate-pulse rounded bg-surface-container" />
            </div>

            {/* Paragraph 3 */}
            <div className="hidden w-full space-y-3 pt-4 sm:block">
              <div className="h-2.5 w-11/12 animate-pulse rounded bg-surface-container" />
              <div className="h-2.5 w-full animate-pulse rounded bg-surface-container" />
              <div className="h-2.5 w-5/6 animate-pulse rounded bg-surface-container" />
              <div className="h-2.5 w-3/4 animate-pulse rounded bg-surface-container" />
            </div>
          </div>

          {/* Bottom signature blocks skeleton */}
          <div className="mt-8 grid w-full grid-cols-2 gap-8 border-t border-border/70 pt-6">
            <div className="w-full space-y-2.5">
              <div className="h-12 w-full animate-pulse rounded-lg border-2 border-dashed border-secondary/25 bg-secondary/5" />
              <div className="h-2.5 w-1/2 animate-pulse rounded bg-surface-container-high" />
            </div>
            <div className="w-full space-y-2.5">
              <div className="h-12 w-full animate-pulse rounded-lg border border-dashed border-outline-variant bg-surface/60" />
              <div className="h-2.5 w-2/5 animate-pulse rounded bg-surface-container-high" />
            </div>
          </div>
        </div>

        {/* Center status pill */}
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <div className="flex items-center gap-2.5 rounded-full border border-border/80 bg-white/95 px-4 py-2 shadow-md backdrop-blur-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-secondary" />
            </span>
            <span className="text-label-sm font-medium text-primary">{label}</span>
          </div>
        </div>

        {/* Full-sheet diagonal shimmer wave */}
        <div className="pdf-skeleton-shimmer z-10" />
      </div>
    </div>
  )
}
