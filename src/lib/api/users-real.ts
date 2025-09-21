// Utility to get real user UUIDs from backend
import apiClient from '@/lib/axios'

export interface RealUser {
  id: string
  email: string
  full_name: string
  is_active: boolean
}

// Get real user by email from backend (bypasses mock data)
export const getRealUserByEmail = async (email: string): Promise<RealUser | null> => {
  console.log('=== Getting Real User by Email ===')
  console.log('Email:', email)
  
  try {
    const response = await apiClient.get('/auth/users/', {
      params: {
        search: email,
        page_size: 10
      }
    })
    
    console.log('=== Real User Response Debug ===')
    console.log('Response status:', response.status)
    console.log('Response statusText:', response.statusText)
    console.log('Response data type:', typeof response.data)
    console.log('Response data:', response.data)
    console.log('Response data keys:', response.data ? Object.keys(response.data) : 'No data')
    console.log('Response data.results:', response.data?.results)
    console.log('Response data.results type:', typeof response.data?.results)
    console.log('Response data.results length:', response.data?.results?.length)
    
    // Check if response.data exists and has results
    if (!response.data) {
      console.error('No response data received in getRealUserByEmail')
      return null
    }
    
    if (!response.data.results) {
      console.error('No results array in response data for getRealUserByEmail')
      console.log('Available keys in response.data:', Object.keys(response.data))
      return null
    }
    
    if (!Array.isArray(response.data.results)) {
      console.error('Results is not an array in getRealUserByEmail:', typeof response.data.results)
      return null
    }
    
    // Find exact email match
    const user = response.data.results.find((u: RealUser) => 
      u.email.toLowerCase() === email.toLowerCase()
    )
    
    if (user) {
      console.log('Found real user:', user)
      return user
    } else {
      console.log('User not found in backend:', email)
      return null
    }
  } catch (error: any) {
    console.error('Error getting real user:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      stack: error.stack
    })
    return null
  }
}

// Get multiple real users by email
export const getRealUsersByEmails = async (emails: string[]): Promise<{
  found: Array<{ email: string; user: RealUser }>
  notFound: string[]
}> => {
  console.log('=== Getting Multiple Real Users ===')
  console.log('Emails:', emails)
  
  const found: Array<{ email: string; user: RealUser }> = []
  const notFound: string[] = []
  
  for (const email of emails) {
    const user = await getRealUserByEmail(email)
    if (user) {
      found.push({ email, user })
    } else {
      notFound.push(email)
    }
  }
  
  console.log('Results:', { found: found.length, notFound: notFound.length })
  return { found, notFound }
}

// Test function to verify real users exist
export const testRealUsers = async () => {
  console.log('=== Testing Real Users ===')
  
  const testEmails = [
    'aremzy2018@gmail.com',
    'admin@example.com',
    'test@example.com'
  ]
  
  for (const email of testEmails) {
    console.log(`Testing: ${email}`)
    const user = await getRealUserByEmail(email)
    if (user) {
      console.log(`✅ Found: ${email} -> ${user.id}`)
    } else {
      console.log(`❌ Not found: ${email}`)
    }
  }
}

// Auto-run test when imported (for debugging)
if (typeof window !== 'undefined') {
  console.log('Real users utility loaded. Call testRealUsers() to test.')
}
