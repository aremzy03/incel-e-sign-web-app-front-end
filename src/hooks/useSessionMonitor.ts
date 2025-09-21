'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export function useSessionMonitor() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    const checkSession = () => {
      // Don't redirect if we're already on login page or register page
      if (typeof window !== 'undefined' && 
          (window.location.pathname.includes('/login') || 
           window.location.pathname.includes('/register'))) {
        return
      }

      // Only check if we're authenticated
      if (status === 'authenticated' && session?.accessToken) {
        try {
          // Parse JWT token to check expiration
          const payload = JSON.parse(atob(session.accessToken.split('.')[1]))
          const currentTime = Math.floor(Date.now() / 1000)
          
          // Only redirect if token is actually expired (not just about to expire)
          if (payload.exp < currentTime) {
            console.log('Session expired, redirecting to login')
            router.push('/login')
          }
        } catch (error) {
          console.error('Error checking token expiration:', error)
          // Don't redirect on parsing errors, let the API calls handle it
        }
      }
    }

    // Check every 60 seconds (less frequent)
    const interval = setInterval(checkSession, 60000)

    return () => clearInterval(interval)
  }, [session, status, router])
}
