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
    const response = await apiClient.get<any>('/api/proxy/auth/users/', {
      params: {
        search: email,
        page_size: 10
      }
    })
    
    console.log('Backend user search raw response:', response.data)
    if (response && typeof response.data === 'object') {
      try {
        console.log('Response keys:', Object.keys(response.data))
      } catch {}
    }
    
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
      console.warn('Unexpected user search response shape; returning empty list')
      users = []
    }

    // Filter results to match exact email (case insensitive)
    const exactMatches = users.filter(u =>
      String(u.email || '').toLowerCase() === email.toLowerCase()
    )
    
    console.log('Found users in backend (normalized):', exactMatches)
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
    const response = await apiClient.get<any>(`/api/proxy/auth/users/${userId}/`)
    console.log('User raw response:', response.data)
    const payload = response.data
    const u: any = (payload && payload.data) || payload
    const full_name = u.full_name || [u.first_name, u.last_name].filter(Boolean).join(' ').trim()
    return {
      id: u.id,
      email: u.email,
      full_name: full_name || u.email,
      is_active: Boolean(u.is_active ?? true),
      created_at: u.created_at || '',
      updated_at: u.updated_at || '',
    }
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
