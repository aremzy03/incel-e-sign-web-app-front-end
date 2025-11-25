import axios from 'axios'
import { getSession, signOut } from 'next-auth/react'
import { getApiBaseUrl } from '@/lib/env'

// Create axios instance with base configuration
const backendBaseUrl = getApiBaseUrl()

const apiClient = axios.create({
  baseURL: backendBaseUrl,
  timeout: 10000,
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const session = await getSession()
    
    // Check if session has a refresh error before making the request
    if (session?.error === 'RefreshAccessTokenError') {
      // Only redirect if we're in the browser and not already on login page
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        // Clear any existing session data
        localStorage.removeItem('nextauth.session')
        sessionStorage.clear()
        
        // Use signOut to properly clear the session and redirect
        await signOut({ redirect: true, callbackUrl: '/login?message=session_expired' })
      }
      
      // Reject the request to prevent it from proceeding with invalid token
      return Promise.reject(new Error('Session expired - user logged out'))
    }
    
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle 401 errors by redirecting to login
    if (error.response?.status === 401) {
      // Only redirect if we're in the browser and not already on login page
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        // Clear any existing session data
        localStorage.removeItem('nextauth.session')
        sessionStorage.clear()
        
        // Use signOut to properly clear the session and redirect
        await signOut({ redirect: true, callbackUrl: '/login?message=auth_failed' })
      }
    }
    
    // Also check if the session has been invalidated during the request
    const session = await getSession()
    if (session?.error === 'RefreshAccessTokenError') {
      // Only redirect if we're in the browser and not already on login page
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        // Clear any existing session data
        localStorage.removeItem('nextauth.session')
        sessionStorage.clear()
        
        // Use signOut to properly clear the session and redirect
        await signOut({ redirect: true, callbackUrl: '/login?message=session_expired' })
      }
    }
    
    return Promise.reject(error)
  }
)

export default apiClient
