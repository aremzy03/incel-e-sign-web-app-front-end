'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GlobalSearch } from './global-search'
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
  onNotificationsOpen?: () => void
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
  onNotificationsOpen,
}: DashboardTopbarProps) {
  const pageTitle = getPageTitle(pathname, navItems)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 flex h-topbar-height shrink-0 items-center gap-4 border-b border-border bg-surface-container-lowest px-4 lg:px-8">
      {mobileSearchOpen ? (
        <div className="absolute inset-0 z-40 flex items-center gap-2 bg-surface-container-lowest px-3 sm:hidden">
          <GlobalSearch className="flex-1" autoFocus onDone={() => setMobileSearchOpen(false)} />
          <button
            type="button"
            onClick={() => setMobileSearchOpen(false)}
            className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container-low"
            aria-label="Close search"
          >
            <MaterialIcon name="close" size={22} />
          </button>
        </div>
      ) : null}
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
        <GlobalSearch className="hidden max-w-md flex-1 sm:block" />
        <button
          type="button"
          onClick={() => setMobileSearchOpen(true)}
          className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container-low sm:hidden"
          aria-label="Search"
        >
          <MaterialIcon name="search" size={22} />
        </button>

        <NotificationDropdown
          notifications={notifications}
          unreadCount={unreadCount}
          onOpen={onNotificationsOpen}
        />

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
          prefetch={false}
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
