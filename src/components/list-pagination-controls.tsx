'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
    <div className={cn('flex items-center justify-between mt-4', className)}>
      <div className="text-sm text-gray-600">
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
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onNext}
          disabled={!hasNext}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
