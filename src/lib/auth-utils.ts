import { getSession } from 'next-auth/react'
import { buildLoginUrlFromBrowser } from '@/lib/post-login-redirect'

// Check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const session = await getSession()
    return !!session?.accessToken
  } catch (error) {
    console.error('Error checking authentication:', error)
    return false
  }
}

// Redirect to login if not authenticated
export const requireAuth = async (): Promise<boolean> => {
  const authenticated = await isAuthenticated()
  
  if (!authenticated && typeof window !== 'undefined') {
    // Clear any existing session data
    localStorage.removeItem('nextauth.session')
    sessionStorage.clear()
    
    // Redirect to login page
    window.location.href = buildLoginUrlFromBrowser()
    return false
  }
  
  return authenticated
}

// Check if token is expired (basic check)
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const currentTime = Math.floor(Date.now() / 1000)
    return payload.exp < currentTime
  } catch (error) {
    console.error('Error parsing token:', error)
    return true // Assume expired if we can't parse it
  }
}
