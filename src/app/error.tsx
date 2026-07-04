'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AsyncStatePanel } from '@/components/library'

export default function GlobalRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App route error:', error)
  }, [error])

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-6">
      <AsyncStatePanel
        variant="error"
        title="Something went wrong"
        description="We hit an unexpected problem while loading this page. Try again, or head back to a safe place."
        primaryAction={
          <Button type="button" onClick={reset}>
            Try Again
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
