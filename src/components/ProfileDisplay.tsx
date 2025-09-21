'use client'

import { useSession } from 'next-auth/react'
import { useProfile } from '@/hooks/useProfile'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'

interface ProfileDisplayProps {
  showAvatar?: boolean
  showEmail?: boolean
  showRole?: boolean
  className?: string
}

export function ProfileDisplay({ 
  showAvatar = true, 
  showEmail = true, 
  showRole = false,
  className = '' 
}: ProfileDisplayProps) {
  const { data: session } = useSession()
  const { data: profile, isLoading, error } = useProfile()

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        {showAvatar && <Skeleton className="h-8 w-8 rounded-full" />}
        <div className="space-y-1">
          <Skeleton className="h-4 w-24" />
          {showEmail && <Skeleton className="h-3 w-32" />}
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        {showAvatar && (
          <Avatar className="h-8 w-8">
            <AvatarFallback>?</AvatarFallback>
          </Avatar>
        )}
        <div>
          <div className="text-sm font-medium">Unknown User</div>
          {showEmail && <div className="text-xs text-gray-500">No profile data</div>}
        </div>
      </div>
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {showAvatar && (
        <Avatar className="h-8 w-8">
          <AvatarImage src="" alt={profile.full_name} />
          <AvatarFallback>{getInitials(profile.full_name)}</AvatarFallback>
        </Avatar>
      )}
      <div>
        <div className="text-sm font-medium">{profile.full_name}</div>
        {showEmail && <div className="text-xs text-gray-500">{profile.email}</div>}
        {showRole && <div className="text-xs text-gray-500 capitalize">User</div>}
      </div>
    </div>
  )
}
