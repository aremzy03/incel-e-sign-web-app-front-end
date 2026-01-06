'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { toast } from 'react-hot-toast'

export const dynamic = 'force-dynamic'

function GoogleOAuthCallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const status = searchParams?.get('status')
    const access = searchParams?.get('access')
    const refresh = searchParams?.get('refresh')
    const next = searchParams?.get('next') || '/dashboard'
    const message = searchParams?.get('message')

    const handleAuth = async () => {
      if (status !== 'success' || !access || !refresh) {
        if (message) {
          toast.error(message)
        } else {
          toast.error('Google authentication failed. Please try again.')
        }

        // Default back to login, preserving a generic error message
        router.replace('/login?message=auth_failed')
        return
      }

      try {
        const result = await signIn('google-jwt', {
          access,
          refresh,
          redirect: false,
        })

        if (result?.error) {
          toast.error('Google sign-in failed. Please try again.')
          router.replace('/login?message=auth_failed')
          return
        }

        toast.success('Signed in with Google')
        router.replace(next || '/dashboard')
      } catch (err) {
        console.error('Error during Google OAuth callback handling:', err)
        toast.error('An unexpected error occurred during Google sign-in.')
        router.replace('/login?message=auth_failed')
      }
    }

    // Only run on client when params are available
    if (searchParams) {
      void handleAuth()
    }
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
        <p className="text-gray-700 text-sm">
          Signing you in with Google, please wait...
        </p>
      </div>
    </div>
  )
}

export default function GoogleOAuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
          <p className="text-gray-700 text-sm">
            Loading...
          </p>
        </div>
      </div>
    }>
      <GoogleOAuthCallbackHandler />
    </Suspense>
  )
}


