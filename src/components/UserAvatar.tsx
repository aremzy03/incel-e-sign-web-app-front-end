'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useSession } from 'next-auth/react'
import { useUser } from '@/hooks/useUsers'
import { cn } from '@/lib/utils'

interface UserAvatarProps {
  userId?: string
  userName?: string
  userEmail?: string
  profilePhotoUrl?: string | null
  className?: string
  fallbackClassName?: string
}

function getInitials(name: string): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function UserAvatar({
  userId,
  userName,
  userEmail,
  profilePhotoUrl,
  className,
  fallbackClassName,
}: UserAvatarProps) {
  // Fetch the profile picture when we only have an id. Not without a login: the profile
  // endpoint needs one (e.g. a signer opening an e-mailed link), and the initials suffice.
  const { status: sessionStatus } = useSession()
  const shouldFetchUser = userId && !profilePhotoUrl && sessionStatus === 'authenticated'
  const { data: fetchedUser, isLoading } = useUser(userId || '', !!shouldFetchUser)

  // Determine the actual values to use
  const actualPhotoUrl = profilePhotoUrl || fetchedUser?.profile_photo_url
  const actualName = userName || fetchedUser?.full_name || userEmail || '?'

  if (isLoading && shouldFetchUser) {
    return <Skeleton className={cn('rounded-full', className)} />
  }

  return (
    <Avatar className={className}>
      {actualPhotoUrl && <AvatarImage src={actualPhotoUrl} alt={actualName} />}
      <AvatarFallback className={fallbackClassName}>{getInitials(actualName)}</AvatarFallback>
    </Avatar>
  )
}

