'use client'

import { useParams } from 'next/navigation'
import { ProfilePageContent } from '@/components/library/profile-layout'

export default function UserProfilePage() {
  const params = useParams<{ id: string }>()
  const userId = params?.id

  if (!userId) {
    return null
  }

  return <ProfilePageContent userId={userId} />
}
