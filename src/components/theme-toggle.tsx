'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { MaterialIcon } from '@/components/ui/material-icon'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <button
        type="button"
        className={cn('rounded-lg p-2 text-muted', className)}
        aria-label="Toggle theme"
        disabled
      >
        <MaterialIcon name="dark_mode" size={22} />
      </button>
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'rounded-lg p-2 text-muted transition-colors hover:bg-surface-container-low hover:text-on-surface',
        className,
      )}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      <MaterialIcon name={isDark ? 'light_mode' : 'dark_mode'} size={22} />
    </button>
  )
}
