'use client'

import Link from 'next/link'
import { MaterialIcon } from '@/components/ui/material-icon'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { NotificationDropdown } from './notification-dropdown'
import type { NotificationItem } from '@/lib/api/notifications'
import { ThemeToggle } from '@/components/theme-toggle'
import { getPageTitle } from './dashboard-nav-config'
import type { DashboardNavItem } from './dashboard-nav-config'

interface DashboardTopbarProps {
  pathname: string
  navItems: DashboardNavItem[]
  notifications: NotificationItem[]
  unreadCount: number
  displayName: string
  displayEmail: string
  profilePhotoUrl?: string | null
  userInitials: string
  userId: string
  onMenuOpen: () => void
  onLogout: () => void
}

export function DashboardTopbar({
  pathname,
  navItems,
  notifications,
  unreadCount,
  displayName,
  displayEmail,
  profilePhotoUrl,
  userInitials,
  userId,
  onMenuOpen,
  onLogout,
}: DashboardTopbarProps) {
  const pageTitle = getPageTitle(pathname, navItems)

  return (
    <header className="sticky top-0 z-30 flex h-topbar-height shrink-0 items-center gap-4 border-b border-border bg-surface-container-lowest px-4 lg:px-8">
      <button
        type="button"
        onClick={onMenuOpen}
        className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container-low lg:hidden"
        aria-label="Open navigation menu"
      >
        <MaterialIcon name="menu" size={24} />
      </button>

      <h1 className="hidden text-headline-xl font-semibold text-on-surface lg:block">{pageTitle}</h1>

      <div className="flex flex-1 items-center justify-end gap-3 lg:gap-4">
        <div className="relative hidden max-w-md flex-1 sm:block">
          <MaterialIcon
            name="search"
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            placeholder="Search documents, envelopes..."
            className="w-full rounded-full border border-border bg-surface py-2.5 pl-11 pr-4 text-sm text-on-surface placeholder:text-muted focus:border-status-your-turn focus:outline-none focus:ring-2 focus:ring-status-your-turn/20"
            aria-label="Search"
          />
        </div>

        <NotificationDropdown notifications={notifications} unreadCount={unreadCount} />

        <ThemeToggle />

        <button
          type="button"
          onClick={onLogout}
          className="rounded-lg p-2 text-muted hover:bg-surface-container-low hover:text-on-surface"
          aria-label="Logout"
        >
          <MaterialIcon name="logout" size={22} />
        </button>

        <Link
          href="/dashboard/profile"
          className="flex items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-surface-container-low"
        >
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-on-surface">{displayName}</p>
            <p className="text-xs text-muted">{displayEmail}</p>
          </div>
          <Avatar className="h-9 w-9">
            {profilePhotoUrl && <AvatarImage src={profilePhotoUrl} alt={displayName} />}
            <AvatarFallback className="bg-primary text-xs text-on-primary">{userInitials}</AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  )
}
