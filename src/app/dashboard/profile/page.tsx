'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { ProfilePageContent } from '@/components/library/profile-layout'

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const userId = session?.user?.id

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading' || !userId) {
    return <div className="py-16 text-center text-muted">Loading profile…</div>
  }

  return <ProfilePageContent userId={userId} />
}
