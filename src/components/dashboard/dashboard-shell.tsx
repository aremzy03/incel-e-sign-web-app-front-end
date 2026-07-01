'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getCachedRefreshToken } from '@/lib/auth-session-cache'
import { shouldRetryAuthQuery, useAuthReady } from '@/hooks/useAuthReady'
import { authAPI } from '@/lib/api/auth'
import { useProfile } from '@/hooks/useProfile'
import { listNotifications, type NotificationItem } from '@/lib/api/notifications'
import { DashboardSidebar } from './dashboard-sidebar'
import { DashboardTopbar } from './dashboard-topbar'
import { DashboardMobileNav } from './dashboard-mobile-nav'
import { SidebarProvider } from './sidebar-context'
import { getDashboardNavItems, isAdminUser } from './dashboard-nav-config'
import { MaterialIcon } from '@/components/ui/material-icon'
import { getPageTitle } from './dashboard-nav-config'
import { isSigningShellPath } from '@/lib/signing/signing-paths'
import { SigningJobBackgroundWatcher } from '@/components/signing/signing-job-background-watcher'

interface User {
  id: string
  email: string
  full_name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface DashboardShellProps {
  children: React.ReactNode
  user: User
}

function normalizeNotifications(data: unknown): NotificationItem[] {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.results)) return obj.results as NotificationItem[]
    if (Array.isArray(obj.data)) return obj.data as NotificationItem[]
  }
  return []
}

export function DashboardShell({ children, user }: DashboardShellProps) {
  const pathname = usePathname()
  const currentPath = pathname ?? '/dashboard'
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { isReady } = useAuthReady()
  const { data: profile } = useProfile()
  const queryClient = useQueryClient()

  const displayUser = profile || user
  const profilePhotoUrl = profile?.profile_photo_url
  const isAdmin = isAdminUser(displayUser.email)
  const navItems = getDashboardNavItems(isAdmin)

  const { data: notificationsData } = useQuery<NotificationItem[]>({
    queryKey: ['notifications'],
    queryFn: listNotifications,
    enabled: isReady,
    staleTime: 30_000,
    retry: shouldRetryAuthQuery,
  })

  const notifications = normalizeNotifications(notificationsData)
  const unreadCount = notifications.filter((n) => !n.is_read).length

  const getUserInitials = () => {
    if (!displayUser?.full_name) return 'U'
    const names = displayUser.full_name.split(' ')
    if (names.length >= 2) {
      return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase()
    }
    return displayUser.full_name.charAt(0).toUpperCase()
  }

  const handleLogout = async () => {
    try {
      const refresh = getCachedRefreshToken()
      if (refresh) await authAPI.logout(refresh)
    } catch {
      // proceed
    } finally {
      queryClient.clear()
      await signOut({ callbackUrl: '/login' })
    }
  }

  const mobileUserBlock = (
    <div className="space-y-3">
      <p className="truncate text-sm font-medium text-on-primary">{displayUser.full_name}</p>
      <p className="truncate text-xs text-on-primary-container">{displayUser.email}</p>
      <button
        type="button"
        onClick={handleLogout}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-on-primary-container/30 px-4 py-2 text-sm text-on-primary hover:bg-primary-hover"
      >
        <MaterialIcon name="logout" size={18} />
        Logout
      </button>
    </div>
  )

  if (isSigningShellPath(currentPath)) {
    return (
      <SidebarProvider value={{ isCollapsed: false }}>
        {children}
        <SigningJobBackgroundWatcher />
      </SidebarProvider>
    )
  }

  return (
    <div className="flex h-screen bg-bg">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <DashboardSidebar navItems={navItems} />
      </div>

      <DashboardMobileNav
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        navItems={navItems}
        userBlock={mobileUserBlock}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <DashboardTopbar
          pathname={currentPath}
          navItems={navItems}
          notifications={notifications}
          unreadCount={unreadCount}
          displayName={displayUser.full_name || 'User'}
          displayEmail={displayUser.email}
          profilePhotoUrl={profilePhotoUrl}
          userInitials={getUserInitials()}
          userId={displayUser.id}
          onMenuOpen={() => setIsMobileMenuOpen(true)}
          onLogout={handleLogout}
        />

        {/* Mobile page title */}
        <div className="border-b border-border bg-surface-container-lowest px-4 py-2 lg:hidden">
          <h1 className="text-headline-lg font-semibold text-on-surface">
            {getPageTitle(currentPath, navItems)}
          </h1>
        </div>

        <main className="flex-1 overflow-y-auto">
          <SidebarProvider value={{ isCollapsed: false }}>
            <div className="mx-auto max-w-max-content-width p-4 md:p-8">{children}</div>
          </SidebarProvider>
        </main>
      </div>
      <SigningJobBackgroundWatcher />
    </div>
  )
}
