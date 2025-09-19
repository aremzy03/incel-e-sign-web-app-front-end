import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { DashboardClientLayout } from './dashboard-client-layout'

const dashboardNav = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Documents', href: '/dashboard/documents', icon: '📄' },
  { name: 'Envelopes', href: '/dashboard/envelopes', icon: '✉️' },
  { name: 'Signatures', href: '/dashboard/signatures', icon: '✍️' },
  { name: 'Notifications', href: '/dashboard/notifications', icon: '🔔' },
  { name: 'Audit Logs', href: '/dashboard/audit', icon: '📋' },
  { name: 'Admin', href: '/dashboard/admin', icon: '🛡️' },
  { name: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
]

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  // Redirect to login if no session exists
  if (!session) {
    redirect('/login')
  }

  // Pass user data to client layout
  return (
    <DashboardClientLayout 
      navigation={dashboardNav}
      user={session.user}
    >
      {children}
    </DashboardClientLayout>
  )
}
