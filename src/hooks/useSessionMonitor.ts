'use client'

import { useSession, signOut } from 'next-auth/react'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export function useSessionMonitor() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const hasHandledError = useRef(false)

  useEffect(() => {
    // Only run on client side and when session is loaded
    if (typeof window === 'undefined' || status === 'loading') return

    // Check if session has a refresh token error
    if (session?.error === 'RefreshAccessTokenError' && !hasHandledError.current) {
      console.warn('Token refresh failed - logging out user')
      hasHandledError.current = true
      
      // Clear any local storage data
      localStorage.removeItem('nextauth.session')
      sessionStorage.clear()
      
      // Sign out and redirect to login
      signOut({ 
        redirect: true, 
        callbackUrl: '/login?message=session_expired' 
      }).then(() => {
        // Reset the flag after successful logout
        hasHandledError.current = false
      }).catch((error) => {
        console.error('Error during signOut:', error)
        // Fallback to manual redirect if signOut fails
        window.location.href = '/login?message=session_expired'
        hasHandledError.current = false
      })
    }

    // Reset the flag if session becomes valid again
    if (session && !session.error) {
      hasHandledError.current = false
    }
  }, [session, status, router])

  return { session, status }
}