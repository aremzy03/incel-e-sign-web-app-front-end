import type { MaterialIconName } from '@/components/ui/material-icon'

export interface DashboardNavItem {
  name: string
  href: string
  icon: MaterialIconName
  adminOnly?: boolean
}

export const primaryDashboardNav: DashboardNavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
  { name: 'Documents', href: '/dashboard/documents', icon: 'description' },
  { name: 'Envelopes', href: '/dashboard/envelopes', icon: 'mail' },
  { name: 'Contacts', href: '/dashboard/contacts', icon: 'group' },
  { name: 'My Signatures', href: '/dashboard/signatures', icon: 'gesture' },
  { name: 'Settings', href: '/dashboard/settings', icon: 'settings' },
]

export const adminDashboardNav: DashboardNavItem[] = [
  { name: 'Audit Logs', href: '/dashboard/audit', icon: 'history', adminOnly: true },
  { name: 'Admin', href: '/dashboard/admin', icon: 'shield', adminOnly: true },
]

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

export function isAdminUser(email?: string | null): boolean {
  if (!email) return false
  if (ADMIN_EMAILS.length > 0) {
    return ADMIN_EMAILS.includes(email.toLowerCase())
  }
  // Fallback: show admin nav in dev when no env configured
  return process.env.NODE_ENV === 'development'
}

export function getDashboardNavItems(isAdmin: boolean): DashboardNavItem[] {
  if (!isAdmin) return primaryDashboardNav
  return [...primaryDashboardNav, ...adminDashboardNav]
}

export function getPageTitle(pathname: string, navItems: DashboardNavItem[]): string {
  const match = navItems.find((item) => item.href === pathname)
  return match?.name ?? 'Dashboard'
}

export const NEW_DOCUMENT_HREF = '/dashboard/documents/upload'
