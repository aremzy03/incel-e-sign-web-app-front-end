'use client'

import { Button } from '@/components/ui/button'
import { MaterialIcon } from '@/components/ui/material-icon'
import { cn } from '@/lib/utils'

export interface ListPaginationControlsProps {
  page: number
  totalPages: number
  hasPrevious: boolean
  hasNext: boolean
  onPrevious: () => void
  onNext: () => void
  totalCount?: number
  className?: string
}

export function ListPaginationControls({
  page,
  totalPages,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  totalCount,
  className,
}: ListPaginationControlsProps) {
  const showFooter = totalPages > 1 || (totalCount !== undefined && totalCount > 0)

  if (!showFooter) {
    return null
  }

  return (
    <div className={cn('mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="text-body-sm text-muted">
        Page {page} of {totalPages}
        {totalCount !== undefined ? ` · ${totalCount} total` : ''}
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onPrevious}
          disabled={!hasPrevious}
          aria-label="Previous page"
        >
          <MaterialIcon name="chevron_left" size={18} />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onNext}
          disabled={!hasNext}
          aria-label="Next page"
        >
          <MaterialIcon name="chevron_right" size={18} />
        </Button>
      </div>
    </div>
  )
}
