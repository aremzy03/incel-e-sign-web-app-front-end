import axios from 'axios'
import { getSession, signOut } from 'next-auth/react'

// Create axios instance with base configuration
// Use absolute baseURL to ensure consistent routing to the Next.js proxy
const frontendOrigin =
  typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXTAUTH_URL || 'http://localhost:3000'

const apiClient = axios.create({
  baseURL: `${frontendOrigin}`,
  timeout: 10000,
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const session = await getSession()
    
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
      console.warn('Authentication failed - redirecting to login')
      
      // Only redirect if we're in the browser and not already on login page
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        // Clear any existing session data
        localStorage.removeItem('nextauth.session')
        sessionStorage.clear()
        
        // Use signOut to properly clear the session and redirect
        await signOut({ redirect: true, callbackUrl: '/login' })
      }
    }
    
    return Promise.reject(error)
  }
)

export default apiClient
