import { getServerSession } from 'next-auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-options'
import { buildLoginUrl } from '@/lib/post-login-redirect'
import { DashboardClientLayout } from './dashboard-client-layout'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  // Redirect to login if no session exists (fallback when middleware did not run)
  if (!session) {
    const h = await headers()
    const returnPath = h.get('x-return-path')
    redirect(buildLoginUrl({ next: returnPath ?? undefined }))
  }

  // Pass user data to client layout
  return (
    <DashboardClientLayout 
      user={session.user}
    >
      {children}
    </DashboardClientLayout>
  )
}
