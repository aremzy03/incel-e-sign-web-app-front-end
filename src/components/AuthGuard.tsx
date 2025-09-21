'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useSessionMonitor } from '@/hooks/useSessionMonitor'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  
  // Monitor session for expiration (less aggressive)
  useSessionMonitor()

  useEffect(() => {
    const checkAuth = async () => {
      // Don't redirect if we're already on login or register page
      if (typeof window !== 'undefined' && 
          (window.location.pathname.includes('/login') || 
           window.location.pathname.includes('/register'))) {
        setIsChecking(false)
        return
      }

      // If session is loading, wait
      if (status === 'loading') {
        return
      }

      // If no session or no access token, redirect to login
      if (status === 'unauthenticated' || !session?.accessToken) {
        console.log('No valid session found, redirecting to login')
        router.push('/login')
        return
      }

      // Authentication is valid
      setIsChecking(false)
    }

    checkAuth()
  }, [session, status, router])

  // Show loading state while checking authentication
  if (status === 'loading' || isChecking) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Checking authentication...</span>
        </div>
      </div>
    )
  }

  // If no valid session, don't render children (redirect will happen)
  if (!session?.accessToken) {
    return null
  }

  return <>{children}</>
}
