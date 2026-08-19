import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { getSession, signOut } from 'next-auth/react'
import { getApiBaseUrl } from '@/lib/env'
import { buildLoginUrlFromBrowser } from '@/lib/post-login-redirect'
import {
  clearAuthSession,
  getCachedAccessToken,
  hasRefreshAccessTokenError,
  setAuthSession,
} from '@/lib/auth-session-cache'

declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    __hadAuthHeader?: boolean
    __isRetry?: boolean
  }
}

// Create axios instance with base configuration
const backendBaseUrl = getApiBaseUrl()

const apiClient = axios.create({
  baseURL: backendBaseUrl,
  timeout: 30000,
})

let signOutInProgress = false
let refreshPromise: Promise<string | null> | null = null

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

/**
 * Single-flight silent refresh via NextAuth session revalidation.
 * getSession() hits /api/auth/session, which runs the jwt callback and may
 * call the backend refresh endpoint when the access token is near expiry.
 */
async function refreshSessionAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    try {
      const session = await getSession()

      if (!session?.accessToken || session.error === 'RefreshAccessTokenError') {
        return null
      }

      setAuthSession({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken ?? null,
        error: session.error ?? null,
      })

      return session.accessToken
    } catch {
      return null
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

function shouldAttemptSilentRefresh(config?: InternalAxiosRequestConfig): boolean {
  if (!config || config.__isRetry) return false

  const url = config.url ?? ''
  if (
    url.includes('/auth/token/refresh/') ||
    url.includes('/auth/login/') ||
    url.includes('/auth/register/') ||
    url.includes('/auth/logout/')
  ) {
    return false
  }

  return config.__hadAuthHeader === true
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

// Response interceptor: silent refresh + retry once on 401 before logging out
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalConfig = error.config as InternalAxiosRequestConfig | undefined

    if (error.response?.status === 401 && shouldAttemptSilentRefresh(originalConfig)) {
      const previousAccessToken = getCachedAccessToken()
      const newAccessToken = await refreshSessionAccessToken()

      if (newAccessToken && newAccessToken !== previousAccessToken) {
        originalConfig!.__isRetry = true
        originalConfig!.headers = originalConfig!.headers ?? {}
        originalConfig!.headers.Authorization = `Bearer ${newAccessToken}`
        return apiClient(originalConfig!)
      }

      await handleAuthFailure(buildLoginUrlFromBrowser('auth_failed'))
      return Promise.reject(error)
    }

    // Auth request already retried, or refresh could not produce a new token.
    if (error.response?.status === 401 && originalConfig?.__hadAuthHeader) {
      await handleAuthFailure(buildLoginUrlFromBrowser('auth_failed'))
      return Promise.reject(error)
    }

    if (hasRefreshAccessTokenError()) {
      await handleAuthFailure(buildLoginUrlFromBrowser('session_expired'))
    }

    return Promise.reject(error)
  }
)

export default apiClient
