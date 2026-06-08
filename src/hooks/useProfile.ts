import { useQuery } from '@tanstack/react-query'
import { getProfileDetail, type ProfileDetailResponse } from '@/lib/api/profile'
import { shouldRetryAuthQuery, useAuthReady } from '@/hooks/useAuthReady'

export function useProfile() {
  const { isReady } = useAuthReady()

  return useQuery<ProfileDetailResponse['data']['user']>({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await getProfileDetail() // No user_id = get own profile
      return response.data.user
    },
    enabled: isReady,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: shouldRetryAuthQuery,
  })
}