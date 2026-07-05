'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { getApiBaseUrl } from '@/lib/env'
import { getSafePostLoginPath, POST_LOGIN_FALLBACK } from '@/lib/post-login-redirect'
import { GoogleOAuthButton } from './auth-layouts'

function GoogleOAuthButtonInner() {
  const searchParams = useSearchParams()
  const apiBaseUrl = getApiBaseUrl()
  const nextParam = getSafePostLoginPath(searchParams?.get('next'), POST_LOGIN_FALLBACK)
  const googleLoginUrl = `${apiBaseUrl}/auth/google/login/?next=${encodeURIComponent(nextParam)}`

  return (
    <GoogleOAuthButton
      onClick={() => {
        window.location.href = googleLoginUrl
      }}
    />
  )
}

export function GoogleOAuthButtonConnected() {
  return (
    <Suspense fallback={<div className="h-12 w-full animate-pulse rounded-xl bg-surface" />}>
      <GoogleOAuthButtonInner />
    </Suspense>
  )
}
