'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MaterialIcon } from '@/components/ui/material-icon'
import { cn } from '@/lib/utils'
import {
  type DashboardNavItem,
  NEW_DOCUMENT_HREF,
} from './dashboard-nav-config'

interface DashboardSidebarProps {
  navItems: DashboardNavItem[]
  className?: string
  onNavigate?: () => void
}

export function DashboardSidebar({ navItems, className, onNavigate }: DashboardSidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'flex h-full w-sidebar-width shrink-0 flex-col bg-primary text-on-primary',
        'dark:bg-primary-container',
        className
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-primary-hover px-6 py-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/E%20sign%20logo.svg"
          alt="INCEL E-Sign"
          className="h-10 w-10 object-contain"
        />
        <div className="min-w-0 flex-col">
          <span className="block truncate text-sm font-bold text-on-primary">Incel E-Sign</span>
          <span className="block truncate text-xs text-on-primary-container dark:text-on-primary-fixed-variant">
            Legal Authority
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'border-l-4 border-status-your-turn bg-primary-hover pl-2 text-accent-light dark:text-secondary-fixed'
                  : 'text-on-primary-container hover:bg-primary-hover hover:text-on-primary dark:text-on-primary-fixed-variant'
              )}
            >
              <MaterialIcon
                name={item.icon}
                fill={isActive}
                size={20}
                className={isActive ? 'text-accent-light' : 'text-on-primary-container'}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Bottom CTA */}
      <div className="border-t border-primary-hover p-4">
        <Link
          href={NEW_DOCUMENT_HREF}
          onClick={onNavigate}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-on-secondary transition-colors hover:bg-accent-hover"
        >
          <MaterialIcon name="add" size={20} className="text-on-secondary" />
          New Document
        </Link>
      </div>
    </aside>
  )
}
