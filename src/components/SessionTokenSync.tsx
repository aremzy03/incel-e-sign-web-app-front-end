'use client'

import { useSession } from 'next-auth/react'
import { clearAuthSession, setAuthSession } from '@/lib/auth-session-cache'

/**
 * Keeps the axios auth cache in sync with NextAuth session state.
 * Updates synchronously during render so API calls never race ahead of the cache.
 */
export function SessionTokenSync() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return null
  }

  if (!session) {
    clearAuthSession()
  } else {
    setAuthSession({
      accessToken: session.accessToken ?? null,
      refreshToken: (session as { refreshToken?: string }).refreshToken ?? null,
      error: session.error ?? null,
    })
  }

  return null
}
