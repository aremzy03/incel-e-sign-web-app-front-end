import axios from 'axios'
import { getSession, signOut } from 'next-auth/react'

// Create axios instance with base configuration
// Backend base URL – prefer NEXT_PUBLIC_API_URL (e.g. http://localhost:8000/api)
const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

const apiClient = axios.create({
  baseURL: backendBaseUrl,
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
