import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { 
  searchUsersByEmail, 
  getUserById, 
  validateUserExists, 
  validateUsersExist,
  User 
} from '@/lib/api/users'

// Hook to search users by email
export const useSearchUsersByEmail = (email: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['users', 'search', email],
    queryFn: () => searchUsersByEmail(email),
    enabled: enabled && !!email && email.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  })
}

// Hook to get user by ID
export const useUser = (userId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUserById(userId),
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}

// Hook to validate if user exists by email
export const useValidateUserExists = () => {
  return useMutation({
    mutationFn: validateUserExists,
    onError: (error: any) => {
      console.error('Validate user exists error:', error)
      toast.error('Failed to validate user. Please try again.')
    },
  })
}

// Hook to validate multiple users by email
export const useValidateUsersExist = () => {
  return useMutation({
    mutationFn: validateUsersExist,
    onError: (error: any) => {
      console.error('Validate users exist error:', error)
      toast.error('Failed to validate users. Please try again.')
    },
  })
}

// Custom hook for envelope creation user validation
export const useEnvelopeUserValidation = () => {
  const validateUsersExistMutation = useValidateUsersExist()

  const validateRecipients = async (emails: string[]): Promise<{
    valid: Array<{ email: string; user: User }>
    invalid: string[]
  }> => {
    try {
      const result = await validateUsersExistMutation.mutateAsync(emails)
      
      if (result.invalid.length > 0) {
        toast.error(
          `The following users do not exist in the system: ${result.invalid.join(', ')}`
        )
      }
      
      return result
    } catch (error) {
      console.error('Error validating recipients:', error)
      throw error
    }
  }

  return {
    validateRecipients,
    isValidating: validateUsersExistMutation.isPending,
    error: validateUsersExistMutation.error,
  }
}
