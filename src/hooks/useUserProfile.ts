import { useSession } from 'next-auth/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getProfileDetail,
  updateOwnProfile,
  type ProfileDetailResponse,
  type UpdateOwnProfileResponse,
} from '@/lib/api/profile'

export function useUserProfile(userId?: string) {
  const { status } = useSession()

  const query = useQuery<ProfileDetailResponse, Error>({
    queryKey: ['user-profile', userId ?? 'self'],
    queryFn: () => getProfileDetail(userId),
    enabled: status === 'authenticated',
  })

  return query
}

export function useUpdateOwnProfile() {
  const queryClient = useQueryClient()

  return useMutation<UpdateOwnProfileResponse, Error, FormData>({
    mutationFn: (form) => updateOwnProfile(form),
    onSuccess: (data) => {
      // Invalidate self profile queries
      queryClient.invalidateQueries({ queryKey: ['user-profile', 'self'] })
      if (data?.data?.id) {
        queryClient.invalidateQueries({ queryKey: ['user-profile', data.data.id] })
      }
    },
  })
}


