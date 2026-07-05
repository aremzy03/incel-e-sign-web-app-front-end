'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AsyncStatePanel } from '@/components/library'

export default function DashboardSigningRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard signing route error:', error)
  }, [error])

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-6">
      <AsyncStatePanel
        variant="error"
        title="Signing view unavailable"
        description="We couldn't render this signing session. Try reloading the signing view or return to your envelopes."
        primaryAction={
          <Button type="button" onClick={reset}>
            Retry Signing View
          </Button>
        }
        secondaryAction={
          <Button asChild variant="outline">
            <Link href="/dashboard/envelopes">Back to Envelopes</Link>
          </Button>
        }
      />
    </div>
  )
}
