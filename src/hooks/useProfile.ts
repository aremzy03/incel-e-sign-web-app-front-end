import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { authAPI, type ProfileResponse } from '@/lib/api/auth'

export function useProfile() {
  const { data: session } = useSession()

  return useQuery<ProfileResponse>({
    queryKey: ['profile'],
    queryFn: async () => {
      if (!session?.accessToken) {
        throw new Error('No access token available')
      }
      return authAPI.getProfile(session.accessToken)
    },
    enabled: !!session?.accessToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 401 errors (authentication issues)
      if (error?.response?.status === 401) {
        return false
      }
      return failureCount < 3
    },
  })
}