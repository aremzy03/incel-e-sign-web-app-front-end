'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import { buildLoginUrl, getSafePostLoginPath, POST_LOGIN_FALLBACK } from '@/lib/post-login-redirect'

export const dynamic = 'force-dynamic'

function GoogleOAuthCallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const status = searchParams?.get('status')
    const access = searchParams?.get('access')
    const refresh = searchParams?.get('refresh')
    const next = getSafePostLoginPath(searchParams?.get('next'), POST_LOGIN_FALLBACK)
    const message = searchParams?.get('message')

    const handleAuth = async () => {
      if (status !== 'success' || !access || !refresh) {
        if (message) {
          toast.error(message)
        } else {
          toast.error('Google authentication failed. Please try again.')
        }

        router.replace(buildLoginUrl({ message: 'auth_failed' }))
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
          router.replace(buildLoginUrl({ message: 'auth_failed' }))
          return
        }

        toast.success('Signed in with Google')
        router.replace(next)
      } catch (err) {
        console.error('Error during Google OAuth callback handling:', err)
        toast.error('An unexpected error occurred during Google sign-in.')
        router.replace(buildLoginUrl({ message: 'auth_failed' }))
      }
    }

    if (searchParams) {
      void handleAuth()
    }
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
        <p className="text-body text-sm">
          Signing you in with Google, please wait...
        </p>
      </div>
    </div>
  )
}

export default function GoogleOAuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
          <p className="text-body text-sm">
            Loading...
          </p>
        </div>
      </div>
    }>
      <GoogleOAuthCallbackHandler />
    </Suspense>
  )
}
