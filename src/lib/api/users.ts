import apiClient from '@/lib/axios'
import { ApiResponse } from '@/types/api'

export interface User {
  id: string
  email: string
  full_name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserSearchResponse {
  count: number
  next: string | null
  previous: string | null
  results: User[]
}

// Search users by email - try backend first, fallback to mock
export const searchUsersByEmail = async (email: string): Promise<User[]> => {
  console.log('=== Search Users by Email ===')
  console.log('Searching for email:', email)
  
  // First, try to get real users from backend
  try {
    console.log('Attempting to search backend users...')
    const response = await apiClient.get<UserSearchResponse>('/auth/users/', {
      params: {
        search: email,
        page_size: 10
      }
    })
    
    console.log('Backend user search response:', response.data)
    
    // Filter results to match exact email (case insensitive)
    const exactMatches = response.data.results.filter(user => 
      user.email.toLowerCase() === email.toLowerCase()
    )
    
    console.log('Found users in backend:', exactMatches)
    return exactMatches
  } catch (error: any) {
    console.error('Backend user search failed:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    })
    
    // Return empty array if backend fails
    console.log('Backend unavailable, returning empty array')
    return []
  }
}

// Get user by ID
export const getUserById = async (userId: string): Promise<User> => {
  console.log('=== Get User by ID ===')
  console.log('User ID:', userId)
  
  try {
    const response = await apiClient.get<User>(`/auth/users/${userId}/`)
    console.log('User response:', response.data)
    return response.data
  } catch (error: any) {
    console.error('Get user error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    })
    
    throw error
  }
}

// Validate if user exists by email
export const validateUserExists = async (email: string): Promise<{ exists: boolean; user?: User }> => {
  try {
    const users = await searchUsersByEmail(email)
    return {
      exists: users.length > 0,
      user: users[0] || undefined
    }
  } catch (error: any) {
    console.error('Error validating user existence:', error)
    
    return { exists: false }
  }
}

// Validate multiple users by email
export const validateUsersExist = async (emails: string[]): Promise<{
  valid: Array<{ email: string; user: User }>
  invalid: string[]
}> => {
  const valid: Array<{ email: string; user: User }> = []
  const invalid: string[] = []
  
  for (const email of emails) {
    try {
      const { exists, user } = await validateUserExists(email)
      if (exists && user) {
        valid.push({ email, user })
      } else {
        invalid.push(email)
      }
    } catch (error: any) {
      console.error(`Error validating user ${email}:`, error)
      
      invalid.push(email)
    }
  }
  
  return { valid, invalid }
}
