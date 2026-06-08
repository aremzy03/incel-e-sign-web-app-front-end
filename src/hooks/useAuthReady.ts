import { useSession } from 'next-auth/react'
import axios from 'axios'

export function useAuthReady() {
  const { data: session, status } = useSession()

  const isReady =
    status === 'authenticated' &&
    !!session?.accessToken &&
    session.error !== 'RefreshAccessTokenError'

  return {
    isReady,
    status,
    accessToken: session?.accessToken,
    session,
  }
}

export function shouldRetryAuthQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= 1) return false

  if (axios.isAxiosError(error)) {
    const code = error.code
    if (code === 'ERR_CANCELED' || code === 'ECONNABORTED') return false

    const status = error.response?.status
    if (status === 401 || status === 403) return false
  }

  if (error instanceof Error) {
    if (error.message === 'Session expired - user logged out') return false
    if (error.message.includes('canceled')) return false
  }

  return true
}
