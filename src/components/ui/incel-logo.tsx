import React from 'react'
import { cn } from '@/lib/utils'

/**
 * 193px square render of `public/E sign logo.svg` (the SVG is 1 MB and must not be
 * served directly), cropped to the artwork so it centres inside a tile.
 */
export const BRAND_LOGO_SRC = '/incel-esign-logo.png'

interface BrandMarkProps {
  /** Outer size of the mark in px (tile included). */
  size?: number
  /**
   * `always`: the mark sits on a dark surface (navy sidebar, auth brand panel), so it
   * always gets a light tile. `dark-mode`: the surface is light in light mode, so the
   * tile only appears once the theme goes dark.
   */
  tile?: 'always' | 'dark-mode'
  className?: string
}

/**
 * The brown mark disappears on navy and dark surfaces. Rather than recolour the
 * artwork, it is set on a light tile there, like an app icon.
 */
export function BrandMark({ size = 40, tile = 'dark-mode', className }: BrandMarkProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-lg p-1',
        // Fixed light colour on purpose: the tile is "paper" for the logo and must not
        // flip with the theme.
        tile === 'always'
          ? 'bg-white shadow-card ring-1 ring-black/5'
          : 'dark:bg-white dark:shadow-card dark:ring-1 dark:ring-black/5',
        className,
      )}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BRAND_LOGO_SRC}
        alt="INCEL E-Sign"
        className="h-full w-full object-contain"
        decoding="async"
      />
    </span>
  )
}

interface IncelLogoProps {
  className?: string
  size?: number
  variant?: 'icon' | 'full'
}

/**
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
      // eslint-disable-next-line @next/next/no-img-element
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

  return <BrandMark size={finalSize} className={className} />
}
