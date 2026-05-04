import React from 'react'
import { cn } from '@/lib/utils'

/** Public asset (filename contains a space — encode as %20 in URL). */
const BRAND_LOGO_SRC = '/E%20sign%20logo.svg'

interface IncelLogoProps {
  className?: string
  size?: number
  variant?: 'icon' | 'full'
}

/**
 * INCEL E-Sign brand mark from `public/E sign logo.svg`.
 * Supports `size` and Tailwind `w-*` / `h-*` in `className` for dimensions.
 */
export function IncelLogo({ className = '', size, variant = 'full' }: IncelLogoProps) {
  let finalSize = size
  if (!finalSize && className) {
    const widthMatch = className.match(/w-(\d+)/)
    const heightMatch = className.match(/h-(\d+)/)
    if (widthMatch) {
      finalSize = parseInt(widthMatch[1], 10) * 4
    } else if (heightMatch) {
      finalSize = parseInt(heightMatch[1], 10) * 4
    }
  }

  if (!finalSize) {
    finalSize = variant === 'full' ? 200 : 32
  }

  if (variant === 'full') {
    const displayWidth = size ?? finalSize
    return (
      <img
        src={BRAND_LOGO_SRC}
        alt="INCEL E-Sign"
        width={displayWidth}
        className={cn('h-auto max-w-full object-contain', className)}
        style={{ width: displayWidth, height: 'auto' }}
        loading="lazy"
        decoding="async"
      />
    )
  }

  return (
    <img
      src={BRAND_LOGO_SRC}
      alt="INCEL E-Sign"
      width={finalSize}
      height={finalSize}
      className={cn('object-contain', className)}
      loading="lazy"
      decoding="async"
    />
  )
}
