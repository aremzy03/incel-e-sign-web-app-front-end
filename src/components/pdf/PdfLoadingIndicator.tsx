'use client'

import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PdfLoadingIndicatorProps {
  label?: string
  className?: string
  size?: 'sm' | 'md'
}

export function PdfLoadingIndicator({
  label = 'Loading document…',
  className,
  size = 'md',
}: PdfLoadingIndicatorProps) {
  const iconClass = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
  const textClass = size === 'sm' ? 'text-xs' : 'text-sm'

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 text-gray-600',
        size === 'md' && 'py-8',
        size === 'sm' && 'py-2',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className={cn(iconClass, 'animate-spin flex-shrink-0')} />
      <span className={textClass}>{label}</span>
    </div>
  )
}
