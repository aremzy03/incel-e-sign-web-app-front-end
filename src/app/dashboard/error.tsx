'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AsyncStatePanel } from '@/components/library'

export default function DashboardRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard route error:', error)
  }, [error])

  return (
    <div className="mx-auto w-full max-w-max-content-width px-6 py-10">
      <AsyncStatePanel
        variant="error"
        title="Dashboard unavailable"
        description="We couldn't finish loading this dashboard view. Try again, or return to the main dashboard."
        primaryAction={
          <Button type="button" onClick={reset}>
            Retry This View
          </Button>
        }
        secondaryAction={
          <Button asChild variant="outline">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        }
      />
    </div>
  )
}
