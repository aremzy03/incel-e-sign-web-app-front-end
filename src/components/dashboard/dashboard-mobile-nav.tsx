'use client'

import { useEffect, useRef } from 'react'
import { MaterialIcon } from '@/components/ui/material-icon'
import { cn } from '@/lib/utils'
import { DashboardSidebar } from './dashboard-sidebar'
import type { DashboardNavItem } from './dashboard-nav-config'

interface DashboardMobileNavProps {
  isOpen: boolean
  onClose: () => void
  navItems: DashboardNavItem[]
  userBlock?: React.ReactNode
}

export function DashboardMobileNav({
  isOpen,
  onClose,
  navItems,
  userBlock,
}: DashboardMobileNavProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        className={cn(
          'absolute inset-y-0 left-0 flex w-sidebar-width flex-col bg-primary shadow-modal dark:bg-primary-container',
          'animate-slide-in-right'
        )}
      >
        <div className="flex items-center justify-between border-b border-primary-hover px-4 py-3">
          <span className="text-sm font-semibold text-on-primary">Menu</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-on-primary-container hover:bg-primary-hover"
            aria-label="Close menu"
          >
            <MaterialIcon name="close" size={22} />
          </button>
        </div>
        <div className="flex flex-1 flex-col overflow-hidden">
          <DashboardSidebar navItems={navItems} onNavigate={onClose} className="w-full flex-1 border-0" />
          {userBlock && (
            <div className="border-t border-primary-hover bg-primary-container p-4">{userBlock}</div>
          )}
        </div>
      </div>
    </div>
  )
}
