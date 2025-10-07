import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { DashboardClientLayout } from './dashboard-client-layout'

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
      user={session.user}
    >
      {children}
    </DashboardClientLayout>
  )
}
