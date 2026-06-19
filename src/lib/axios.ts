import axios from 'axios'
import { signOut } from 'next-auth/react'
import { getApiBaseUrl } from '@/lib/env'
import { buildLoginUrlFromBrowser } from '@/lib/post-login-redirect'
import {
  clearAuthSession,
  getCachedAccessToken,
  hasRefreshAccessTokenError,
} from '@/lib/auth-session-cache'

declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    __hadAuthHeader?: boolean
  }
}

// Create axios instance with base configuration
const backendBaseUrl = getApiBaseUrl()

const apiClient = axios.create({
  baseURL: backendBaseUrl,
  timeout: 30000,
})

let signOutInProgress = false

async function handleAuthFailure(callbackUrl: string) {
  if (signOutInProgress || typeof window === 'undefined') return
  if (window.location.pathname.includes('/login')) return

  signOutInProgress = true
  clearAuthSession()
  localStorage.removeItem('nextauth.session')
  sessionStorage.clear()

  try {
    await signOut({ redirect: true, callbackUrl })
  } finally {
    signOutInProgress = false
  }
}

// Request interceptor to add auth token from in-memory cache (synced by SessionTokenSync)
apiClient.interceptors.request.use(
  (config) => {
    if (hasRefreshAccessTokenError()) {
      void handleAuthFailure(buildLoginUrlFromBrowser('session_expired'))
      return Promise.reject(new Error('Session expired - user logged out'))
    }

    const accessToken = getCachedAccessToken()
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    config.__hadAuthHeader = !!accessToken

    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const hadAuthHeader = error.config?.__hadAuthHeader === true
      if (hadAuthHeader) {
        await handleAuthFailure(buildLoginUrlFromBrowser('auth_failed'))
      }
    } else if (hasRefreshAccessTokenError()) {
      await handleAuthFailure(buildLoginUrlFromBrowser('session_expired'))
    }

    return Promise.reject(error)
  }
)

export default apiClient
