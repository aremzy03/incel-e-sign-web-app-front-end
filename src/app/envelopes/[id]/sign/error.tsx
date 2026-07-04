'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AsyncStatePanel } from '@/components/library'

export default function PublicSigningRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Public signing route error:', error)
  }, [error])

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-6">
      <AsyncStatePanel
        variant="error"
        title="Signing session unavailable"
        description="We couldn't finish loading this signing session. Try again, or return to the home page."
        primaryAction={
          <Button type="button" onClick={reset}>
            Retry
          </Button>
        }
        secondaryAction={
          <Button asChild variant="outline">
            <Link href="/">Back to Home</Link>
          </Button>
        }
      />
    </div>
  )
}
