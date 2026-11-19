'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MaterialIcon } from '@/components/ui/material-icon'
import { BrandMark } from '@/components/ui/incel-logo'
import { cn } from '@/lib/utils'
import {
  type DashboardNavItem,
  getActiveNavItem,
  NEW_DOCUMENT_HREF,
} from './dashboard-nav-config'

interface DashboardSidebarProps {
  navItems: DashboardNavItem[]
  className?: string
  onNavigate?: () => void
}

export function DashboardSidebar({ navItems, className, onNavigate }: DashboardSidebarProps) {
  const pathname = usePathname()
  const activeHref = getActiveNavItem(pathname ?? '', navItems)?.href

  return (
    <aside
      className={cn(
        'flex h-full w-sidebar-width shrink-0 flex-col border-r border-panel-border bg-panel text-on-panel',
        className
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-panel-border px-6 py-5">
        <BrandMark size={40} tile="always" />
        <div className="min-w-0 flex-col">
          <span className="block truncate text-sm font-bold text-on-panel">INCEL E-Sign</span>
          <span className="block truncate text-xs text-on-panel-muted">
            Incel Group
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive = item.href === activeHref
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              onClick={onNavigate}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-panel-active font-semibold text-on-panel'
                  : 'text-on-panel-muted hover:bg-panel-hover hover:text-on-panel'
              )}
            >
              <MaterialIcon
                name={item.icon}
                fill={isActive}
                size={20}
                className={cn(
                  isActive
                    ? 'text-panel-indicator'
                    : 'text-on-panel-muted group-hover:text-on-panel'
                )}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Bottom CTA */}
      <div className="border-t border-panel-border p-4">
        <Link
          href={NEW_DOCUMENT_HREF}
          prefetch={false}
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
