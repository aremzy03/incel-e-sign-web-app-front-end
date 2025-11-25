import apiClient from '@/lib/axios'
import { ApiResponse } from '@/types/api'
import { getProfileDetail } from './profile'
import { logger } from '@/lib/logger'

export interface User {
  id: string
  email: string
  full_name: string
  is_active: boolean
  created_at: string
  updated_at: string
  profile_photo?: string | null
  profile_photo_url?: string | null
}

export interface UserSearchResponse {
  count: number
  next: string | null
  previous: string | null
  results: User[]
}

// Search users by email - try backend first, fallback to mock
export const searchUsersByEmail = async (email: string): Promise<User[]> => {
  logger.debug('Searching users by email', { email })
  
  // First, try to get real users from backend
  try {
    const response = await apiClient.get<any>('/auth/users/', {
      params: {
        search: email,
        page_size: 10
      }
    })
    
    // Some backends return paginated objects, others return arrays. Normalize.
    const data = response.data
    let users: User[] = []
    if (Array.isArray(data)) {
      users = data as User[]
    } else if (data && Array.isArray((data as any).results)) {
      users = (data as any).results as User[]
    } else if (data && Array.isArray((data as any).data)) {
      users = (data as any).data as User[]
    } else if (data && (data as any).data && Array.isArray((data as any).data.results)) {
      // Handle { status, message, data: { results: [...] } }
      users = (data as any).data.results as User[]
    } else if (data && Array.isArray((data as any).users)) {
      users = (data as any).users as User[]
    } else if (data && typeof (data as any).results === 'object' && (data as any).results) {
      users = Object.values((data as any).results as Record<string, User>)
    } else if (data && (data as any).email) {
      users = [data as User]
    } else {
      logger.warn('Unexpected user search response shape; returning empty list')
      users = []
    }

    // Filter results to match exact email (case insensitive)
    const exactMatches = users.filter(u =>
      String(u.email || '').toLowerCase() === email.toLowerCase()
    )
    
    logger.debug('Found users in backend', { count: exactMatches.length })
    return exactMatches
  } catch (error: any) {
    logger.errorSafe(error, 'Backend user search failed')
    return []
  }
}

// Get user by ID
export const getUserById = async (userId: string): Promise<User> => {
  logger.debug('Getting user by ID', { userId })
  
  // First try to get from profile endpoint which has profile_photo_url
  try {
    const profileResponse = await getProfileDetail(userId)
    if (profileResponse?.data?.user) {
      const u = profileResponse.data.user
      const full_name = u.full_name || [u.first_name, u.last_name].filter(Boolean).join(' ').trim()
      return {
        id: u.id,
        email: u.email,
        full_name: full_name || u.email,
        is_active: Boolean(u.is_active ?? true),
        created_at: u.created_at || '',
        updated_at: u.updated_at || '',
        profile_photo: u.profile_photo ?? null,
        profile_photo_url: u.profile_photo_url ?? null,
      }
    }
  } catch (profileError: any) {
    console.log('Profile endpoint failed, trying users endpoint:', profileError.message)
  }
  
  // Fallback to users endpoint
  try {
    const response = await apiClient.get<any>(`/auth/users/${userId}/`)
    console.log('User raw response:', response.data)
    const payload = response.data
    const u: any = (payload && payload.data) || payload
    // Handle nested structure: data.user or just data
    const userData = u?.user || u
    const full_name = userData.full_name || [userData.first_name, userData.last_name].filter(Boolean).join(' ').trim()
    return {
      id: userData.id,
      email: userData.email,
      full_name: full_name || userData.email,
      is_active: Boolean(userData.is_active ?? true),
      created_at: userData.created_at || '',
      updated_at: userData.updated_at || '',
      profile_photo: userData.profile_photo ?? null,
      profile_photo_url: userData.profile_photo_url ?? null,
    }
  } catch (error: any) {
    logger.errorSafe(error, 'Get user failed')
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
    logger.errorSafe(error, 'Error validating user existence')
    return { exists: false }
  }
}

// Search users by name or email
export const searchUsers = async (query: string): Promise<User[]> => {
  logger.debug('Searching users', { query })
  
  try {
    const response = await apiClient.get<any>('/auth/users/', {
      params: {
        search: query,
        page_size: 10
      }
    })
    
    // Normalize response data (reuse logic from searchUsersByEmail)
    const data = response.data
    let users: User[] = []
    if (Array.isArray(data)) {
      users = data as User[]
    } else if (data && Array.isArray((data as any).results)) {
      users = (data as any).results as User[]
    } else if (data && Array.isArray((data as any).data)) {
      users = (data as any).data as User[]
    } else if (data && (data as any).data && Array.isArray((data as any).data.results)) {
      users = (data as any).data.results as User[]
    } else if (data && Array.isArray((data as any).users)) {
      users = (data as any).users as User[]
    } else if (data && typeof (data as any).results === 'object' && (data as any).results) {
      users = Object.values((data as any).results as Record<string, User>)
    } else {
      logger.warn('Unexpected user search response shape; returning empty list')
      users = []
    }
    
    logger.debug('Found users', { count: users.length })
    return users
  } catch (error: any) {
    logger.errorSafe(error, 'User search failed')
    return []
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
      logger.errorSafe(error, `Error validating user ${email}`)
      invalid.push(email)
    }
  }
  
  return { valid, invalid }
}
