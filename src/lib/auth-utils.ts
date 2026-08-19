import { getSession } from 'next-auth/react'
import { buildLoginUrlFromBrowser } from '@/lib/post-login-redirect'

/** Matches backend SIMPLE_JWT.ACCESS_TOKEN_LIFETIME (8 hours). */
export const ACCESS_TOKEN_LIFETIME_MS = 8 * 60 * 60 * 1000

/** Matches backend SIMPLE_JWT.REFRESH_TOKEN_LIFETIME (7 days), in seconds for NextAuth maxAge. */
export const REFRESH_TOKEN_LIFETIME_S = 7 * 24 * 60 * 60

/** Refresh a few minutes before the access JWT actually expires. */
export const ACCESS_TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000

/**
 * Reads the `exp` claim from a JWT and returns expiry as epoch milliseconds.
 */
export function getJwtExpiryMs(accessToken: string): number | null {
  try {
    const segment = accessToken.split('.')[1]
    if (!segment) return null

    const normalized = segment.replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(normalized))
    if (typeof payload.exp !== 'number') return null

    return payload.exp * 1000
  } catch {
    return null
  }
}

/**
 * Absolute time when the frontend should treat the access token as needing refresh.
 * Prefers the real JWT exp claim; falls back to the configured access lifetime.
 */
export function getAccessTokenExpiresAt(accessToken: string, now = Date.now()): number {
  const jwtExpiry = getJwtExpiryMs(accessToken)
  if (jwtExpiry != null) return jwtExpiry
  return now + ACCESS_TOKEN_LIFETIME_MS
}

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
    const expiryMs = getJwtExpiryMs(token)
    if (expiryMs == null) return true
    return Date.now() >= expiryMs
  } catch (error) {
    console.error('Error parsing token:', error)
    return true // Assume expired if we can't parse it
  }
}
