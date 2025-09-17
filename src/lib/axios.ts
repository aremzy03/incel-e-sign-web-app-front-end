import axios from 'axios'
import { getSession, signOut } from 'next-auth/react'

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
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
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Try to refresh the session
        const session = await getSession()
        
        if (session?.refreshToken) {
          // The session will be automatically refreshed by NextAuth
          // Retry the original request
          return apiClient(originalRequest)
        } else {
          // No refresh token, sign out
          await signOut({ redirect: false })
          window.location.href = '/login'
        }
      } catch (refreshError) {
        // Refresh failed, sign out
        await signOut({ redirect: false })
        window.location.href = '/login'
      }
    }
    
    return Promise.reject(error)
  }
)

export default apiClient
