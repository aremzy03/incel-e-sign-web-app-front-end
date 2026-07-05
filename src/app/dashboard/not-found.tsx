import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AsyncStatePanel } from '@/components/library'

export default function DashboardNotFound() {
  return (
    <div className="mx-auto w-full max-w-max-content-width px-6 py-10">
      <AsyncStatePanel
        variant="notFound"
        title="Dashboard page not found"
        description="The dashboard page you're looking for does not exist, or the link is no longer valid."
        primaryAction={
          <Button asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        }
        secondaryAction={
          <Button asChild variant="outline">
            <Link href="/dashboard/envelopes">View Envelopes</Link>
          </Button>
        }
      />
    </div>
  )
}
