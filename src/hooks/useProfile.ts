import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { getProfileDetail, type ProfileDetailResponse } from '@/lib/api/profile'

export function useProfile() {
  const { data: session } = useSession()

  return useQuery<ProfileDetailResponse['data']['user']>({
    queryKey: ['profile'],
    queryFn: async () => {
      if (!session?.accessToken) {
        throw new Error('No access token available')
      }
      const response = await getProfileDetail() // No user_id = get own profile
      return response.data.user
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