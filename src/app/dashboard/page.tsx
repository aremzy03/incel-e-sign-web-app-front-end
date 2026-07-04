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
  iconBg,
  helper,
}: {
  label: string
  value: string
  icon: MaterialIconName
  iconBg: string
  helper?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-container-lowest p-6 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-label-sm text-muted">{label}</p>
          <p className="mt-2 text-headline-2xl font-bold text-on-surface">{value}</p>
          {helper && <p className="mt-2 text-caption-xs text-muted">{helper}</p>}
        </div>
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', iconBg)}>
          <MaterialIcon name={icon} size={22} />
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
      return 'text-info'
    case 'SIGN_DOC':
    case 'SELF_SIGN_DOC':
      return 'text-success'
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
      className="group flex items-start gap-3 rounded-xl border border-border bg-surface-container-lowest p-3 text-left shadow-card transition-all hover:border-secondary hover:shadow-raised active:scale-[0.99]"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary transition-colors group-hover:bg-secondary group-hover:text-on-secondary">
        <MaterialIcon name={icon} size={18} className="text-inherit" />
      </div>
      <div>
        <p className="text-sm font-semibold text-primary">{title}</p>
        <p className="mt-1 text-xs leading-4 text-muted">{description}</p>
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
        <h1 className="text-headline-2xl font-bold text-on-surface">
          {getGreeting()}, {userName}
        </h1>
        <p className="mt-1 text-body-sm text-muted">
          Here&apos;s what needs your attention today.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Pending Signatures"
          value={isLoading ? '—' : String(metrics?.pending_signatures ?? 0)}
          icon="pending_actions"
          iconBg="bg-warning-light text-warning"
          helper="Awaiting your signature"
        />
        <MetricCard
          label="Awaiting Others"
          value={isLoading ? '—' : String(metrics?.active_envelopes ?? 0)}
          icon="layers"
          iconBg="bg-info-light text-info"
          helper="Out for signature"
        />
        <MetricCard
          label="Completed"
          value={isLoading ? '—' : String(metrics?.documents_signed ?? 0)}
          icon="check_circle"
          iconBg="bg-success-light text-success"
          helper="Fully executed"
        />
        <MetricCard
          label="Drafts"
          value={isLoading ? '—' : String(dashboard?.counts.draft ?? 0)}
          icon="edit_square"
          iconBg="bg-surface text-status-draft"
          helper="Not yet sent"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-6 text-headline-lg font-semibold text-primary">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
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
            title="Sign Myself"
            description="Add your digital signature to a document instantly."
          />
        </div>
      </div>

      {dashboardError && !dashboard ? (
        <AsyncStatePanel
          variant="error"
          title="Unable to load your dashboard"
          description={dashboardError.message}
          primaryAction={
            <Button type="button" onClick={() => void refetch()}>
              Retry
            </Button>
          }
        />
      ) : null}

      {/* Action Required + Recent Activity */}
      {!dashboardError || dashboard ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-10">
        <div className="lg:col-span-6">
          <div className="overflow-hidden rounded-xl border border-border bg-surface-container-lowest shadow-card">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-headline-lg font-semibold text-primary">Action Required</h2>
              <span className="rounded-full bg-error-light px-2.5 py-1 text-label-xs font-bold text-error">
                Urgent
              </span>
            </div>
            <div className="divide-y divide-border">
              {isLoading ? (
                <div className="p-6 text-sm text-muted">Loading...</div>
              ) : actionRequired.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <MaterialIcon name="task_alt" size={40} className="text-success" />
                  <p className="mt-3 text-body-sm text-muted">You&apos;re all caught up!</p>
                </div>
              ) : (
                actionRequired.map((env) => (
                  <div
                    key={env.id}
                    className="flex flex-col gap-4 p-6 transition-colors hover:bg-surface sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="pulse-teal flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-status-your-turn text-white shadow-lg shadow-secondary/20">
                        <MaterialIcon name="edit_square" size={20} className="text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-primary">
                          {env.name || 'Untitled Envelope'}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-body-sm text-muted">
                          <span>{env.creator_name || env.creator?.full_name || 'Unknown sender'}</span>
                          <span className="h-1 w-1 rounded-full bg-border" />
                          <span>{formatSentDate(env.sent_at || env.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-4 sm:ml-4">
                      <span className="hidden items-center gap-1 text-label-xs font-bold uppercase tracking-wider text-status-your-turn md:inline-flex">
                        <span className="h-2 w-2 rounded-full bg-status-your-turn" />
                        Your Turn
                      </span>
                      <Link
                        href={`/dashboard/envelopes/${env.id}/sign`}
                        className="rounded-lg bg-secondary px-6 py-2 text-label-sm font-bold text-on-secondary shadow-sm transition-all hover:bg-accent-hover"
                      >
                        Sign Now
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
            {actionRequired.length > 0 && (
              <div className="border-t border-border bg-surface px-6 py-4 text-center">
                <Link
                  href="/dashboard/envelopes"
                  className="text-label-sm font-bold text-secondary hover:underline"
                >
                  View all pending actions
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="rounded-xl border border-border bg-surface-container-lowest shadow-card">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-headline-lg font-semibold text-on-surface">Recent Activity</h2>
            </div>
            <div className="space-y-0 p-4">
              {isLoading ? (
                <div className="p-2 text-sm text-muted">Loading...</div>
              ) : recentActivity.length === 0 ? (
                <p className="py-8 text-center text-body-sm text-muted">No recent activity</p>
              ) : (
                recentActivity.map((entry, i) => {
                  const content = (
                    <>
                      <div
                        className={cn(
                          'relative z-10 mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 border-border bg-surface-container-lowest',
                        )}
                      >
                        <MaterialIcon
                          name={getActivityIcon(entry.action)}
                          size={12}
                          className={getActivityIconClass(entry.action)}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-body-sm font-medium text-on-surface">
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
                    <div key={entry.id} className="relative flex gap-3 pb-6 pl-2">
                      {i < recentActivity.length - 1 && (
                        <div className="absolute left-[11px] top-6 h-full w-px bg-border" />
                      )}
                      {entry.envelope_id ? (
                        <Link
                          href={`/dashboard/envelopes/${entry.envelope_id}`}
                          className="relative flex min-w-0 flex-1 gap-3 transition-colors hover:text-secondary"
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
