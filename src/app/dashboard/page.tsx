'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { shouldRetryAuthQuery, useAuthReady } from '@/hooks/useAuthReady'
import { Button } from '@/components/ui/button'
import { MaterialIcon } from '@/components/ui/material-icon'
import type { MaterialIconName } from '@/components/ui/material-icon'
import { AsyncStatePanel } from '@/components/library'
import { classifyError } from '@/lib/errors'
import { cn } from '@/lib/utils'
import {
  getEnvelopeDashboard,
  type Envelope,
  type EnvelopeDashboardActivity,
} from '@/lib/api/envelopes'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function MetricCard({
  label,
  value,
  icon,
  helper,
}: {
  label: string
  value: string
  icon: MaterialIconName
  helper?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-container-lowest p-6 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-label-sm text-muted">{label}</p>
          <p className="mt-2 text-headline-xl text-on-surface tabular-nums">{value}</p>
          {helper && <p className="mt-1.5 text-caption-xs text-muted">{helper}</p>}
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
          <MaterialIcon name={icon} size={20} />
        </div>
      </div>
    </div>
  )
}

function formatSentDate(dateStr?: string) {
  if (!dateStr) return 'Recently'
  const date = new Date(dateStr)
  return `Sent ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}

function getActivityIcon(action: string): MaterialIconName {
  switch (action) {
    case 'SEND_ENVELOPE':
      return 'send'
    case 'SIGN_DOC':
    case 'SELF_SIGN_DOC':
      return 'check_circle'
    case 'REJECT_ENVELOPE':
    case 'DECLINE_SIGN':
      return 'cancel'
    default:
      return 'history'
  }
}

function getActivityIconClass(action: string): string {
  switch (action) {
    case 'SEND_ENVELOPE':
      return 'text-muted'
    case 'SIGN_DOC':
    case 'SELF_SIGN_DOC':
      return 'text-success-text'
    case 'REJECT_ENVELOPE':
    case 'DECLINE_SIGN':
      return 'text-error'
    default:
      return 'text-muted'
  }
}

function QuickActionCard({
  href,
  icon,
  title,
  description,
}: {
  href: string
  icon: MaterialIconName
  title: string
  description: string
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      className="flex items-start gap-4 rounded-xl border border-border bg-surface-container-lowest p-6 text-left shadow-card transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-your-turn focus-visible:ring-offset-2"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
        <MaterialIcon name={icon} size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-body-base text-on-surface">
          <span className="font-semibold">{title}</span>
        </p>
        <p className="mt-1.5 text-body-sm text-muted">{description}</p>
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const { isReady } = useAuthReady()
  const userName = session?.user?.full_name?.split(' ')[0] || 'User'

  const { data: dashboard, isLoading, error, refetch } = useQuery({
    queryKey: ['envelopes', 'dashboard'],
    queryFn: getEnvelopeDashboard,
    enabled: isReady,
    staleTime: 60_000,
    retry: shouldRetryAuthQuery,
  })

  const dashboardError = error ? classifyError(error, 'Failed to load dashboard') : null
  const metrics = dashboard?.metrics
  const actionRequired: Envelope[] = dashboard?.action_required ?? []
  const recentActivity: EnvelopeDashboardActivity[] = dashboard?.recent_activity ?? []

  return (
    <div className="space-y-8">
      <div>
        <p className="text-body-base text-on-surface">
          <span className="font-medium">{getGreeting()}, {userName}</span>
        </p>
        <p className="mt-1.5 text-body-sm text-muted">
          Here&apos;s what needs your attention today.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Pending Signatures"
          value={isLoading ? '—' : String(metrics?.pending_signatures ?? 0)}
          icon="pending_actions"
          helper="Awaiting your signature"
        />
        <MetricCard
          label="Awaiting Others"
          value={isLoading ? '—' : String(metrics?.active_envelopes ?? 0)}
          icon="layers"
          helper="Out for signature"
        />
        <MetricCard
          label="Completed"
          value={isLoading ? '—' : String(metrics?.documents_signed ?? 0)}
          icon="check_circle"
          helper="Fully executed"
        />
        <MetricCard
          label="Drafts"
          value={isLoading ? '—' : String(dashboard?.counts.draft ?? 0)}
          icon="edit_square"
          helper="Not yet sent"
        />
      </div>

      <div>
        <h2 className="mb-4 text-headline-xl font-semibold text-on-surface">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <QuickActionCard
            href="/dashboard/documents/upload"
            icon="upload_file"
            title="Upload Document"
            description="Select a PDF or Word file from your computer."
          />
          <QuickActionCard
            href="/dashboard/envelopes/create"
            icon="mail_lock"
            title="Send for Signature"
            description="Prepare an envelope for others to sign securely."
          />
          <QuickActionCard
            href="/dashboard/envelopes/self-sign"
            icon="draw"
            title="Edit & Sign"
            description="Edit a document, sign it yourself, or both."
          />
        </div>
      </div>

      {dashboardError && !dashboard ? (
        <AsyncStatePanel
          variant="error"
          title="Unable to load your dashboard"
          description={dashboardError.message}
          primaryAction={
            <Button type="button" variant="secondary" onClick={() => void refetch()}>
              Retry
            </Button>
          }
        />
      ) : null}

      {!dashboardError || dashboard ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-10">
          <div className="lg:col-span-6">
            <div className="h-full overflow-hidden rounded-xl border border-border bg-surface-container-lowest shadow-card">
              <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
                <h2 className="text-headline-xl font-semibold text-on-surface">Action Required</h2>
                {actionRequired.length > 0 ? (
                  <span
                    className="shrink-0 text-label-sm tabular-nums text-muted"
                    aria-label={`${actionRequired.length} ${actionRequired.length === 1 ? 'item needs' : 'items need'} your signature`}
                  >
                    {actionRequired.length}
                  </span>
                ) : null}
              </div>
              <div className="divide-y divide-border">
                {isLoading ? (
                  <div className="p-6 text-body-sm text-muted">Loading...</div>
                ) : actionRequired.length === 0 ? (
                  <div className="flex flex-col items-center px-6 py-12 text-center">
                    <MaterialIcon name="task_alt" size={28} className="text-success-text" />
                    <p className="mt-3 text-body-sm text-muted">You&apos;re all caught up!</p>
                  </div>
                ) : (
                  actionRequired.map((env) => (
                    <div
                      key={env.id}
                      className="flex flex-col gap-4 p-6 transition-colors hover:bg-surface sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                          <MaterialIcon name="edit_square" size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-body-base text-on-surface">
                            <span className="font-semibold">{env.name || 'Untitled Envelope'}</span>
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-body-sm text-muted">
                            <span>{env.creator_name || env.creator?.full_name || 'Unknown sender'}</span>
                            <span className="h-1 w-1 rounded-full bg-border" />
                            <span>{formatSentDate(env.sent_at || env.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3 sm:ml-4">
                        <span className="badge-status-your-turn inline-flex items-center rounded-full px-2.5 py-0.5 text-label-xs">
                          <span className="font-semibold">Your Turn</span>
                        </span>
                        <Button asChild variant="authority" className="shrink-0">
                          <Link
                            href={`/dashboard/envelopes/${env.id}/sign`}
                            prefetch={false}
                          >
                            Sign Now
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {actionRequired.length > 0 && (
                <div className="border-t border-border bg-surface px-6 py-4 text-center">
                  <Link
                    href="/dashboard/envelopes"
                    prefetch={false}
                    className="inline-flex min-h-10 items-center rounded-xl text-label-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-your-turn focus-visible:ring-offset-2"
                  >
                    View all pending actions
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="h-full rounded-xl border border-border bg-surface-container-lowest shadow-card">
              <div className="border-b border-border px-6 py-4">
                <h2 className="text-headline-xl font-semibold text-on-surface">Recent Activity</h2>
              </div>
              <div className="p-6">
                {isLoading ? (
                  <div className="text-body-sm text-muted">Loading...</div>
                ) : recentActivity.length === 0 ? (
                  <p className="py-8 text-center text-body-sm text-muted">No recent activity</p>
                ) : (
                  recentActivity.map((entry, i) => {
                    const content = (
                      <>
                        <div className="relative z-10 mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-lg border border-border bg-surface-container-lowest">
                          <MaterialIcon
                            name={getActivityIcon(entry.action)}
                            size={12}
                            className={getActivityIconClass(entry.action)}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-body-sm text-on-surface group-hover:underline">
                            {entry.message || entry.envelope_name || 'Envelope activity'}
                          </p>
                          <p className="text-caption-xs text-muted">
                            {entry.created_at
                              ? new Date(entry.created_at).toLocaleString()
                              : 'Recently'}
                          </p>
                        </div>
                      </>
                    )

                    return (
                      <div
                        key={entry.id}
                        className={cn(
                          'relative flex gap-3',
                          i < recentActivity.length - 1 ? 'pb-6' : 'pb-0',
                        )}
                      >
                        {i < recentActivity.length - 1 && (
                          <div className="absolute left-[11px] top-6 h-full w-px -translate-x-1/2 bg-border" />
                        )}
                        {entry.envelope_id ? (
                          <Link
                            href={`/dashboard/envelopes/${entry.envelope_id}`}
                            prefetch={false}
                            className="group relative flex min-w-0 flex-1 gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-your-turn focus-visible:ring-offset-2"
                          >
                            {content}
                          </Link>
                        ) : (
                          <div className="relative flex min-w-0 flex-1 gap-3">{content}</div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
