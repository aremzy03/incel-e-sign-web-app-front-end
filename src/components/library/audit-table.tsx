'use client'

import { Fragment, useState } from 'react'
import { cn } from '@/lib/utils'
import { MaterialIcon } from '@/components/ui/material-icon'
import { StatusBadge } from './status-badge'
import type { AuditLogItem } from '@/lib/api/audit'

const actionBadgeClass: Record<string, string> = {
  SIGN_DOC: 'badge-status-completed',
  SEND_ENVELOPE: 'bg-primary-light text-primary',
  DECLINE_SIGN: 'badge-status-rejected',
  UPLOAD_DOCUMENT: 'badge-status-pending',
}

interface AuditTableProps {
  rows: AuditLogItem[]
  className?: string
}

export function AuditTable({ rows, className }: AuditTableProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null)

  if (rows.length === 0) {
    return <p className="py-8 text-center text-body-sm text-muted">No audit logs found</p>
  }

  return (
    <div className={cn('custom-scrollbar overflow-x-auto', className)}>
      <table className="w-full min-w-[800px] text-left text-body-sm">
        <thead>
          <tr className="border-b border-border bg-surface">
            {['Timestamp', 'Actor', 'Action', 'Target', 'Message', ''].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-caption-xs font-semibold uppercase tracking-wider text-muted"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const actorLabel =
              typeof row.actor === 'string'
                ? row.actor
                : row.actor.full_name || row.actor.email
            const actorEmail =
              typeof row.actor === 'string' ? row.actor : row.actor.email
            const isExpanded = expandedId === row.id

            return (
              <Fragment key={row.id}>
                <tr
                  className="border-b border-border transition-colors hover:bg-primary-light/30 dark:hover:bg-surface-container-high"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-muted">
                    {new Date(row.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-on-surface">{actorLabel}</p>
                      {actorEmail && actorEmail !== actorLabel && (
                        <p className="text-caption-xs text-muted">{actorEmail}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2 py-0.5 text-caption-xs font-semibold uppercase',
                        actionBadgeClass[row.action] ?? 'bg-surface-container-high text-on-surface-variant',
                      )}
                    >
                      {row.action.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <MaterialIcon name="description" size={16} className="text-muted" />
                      <span className="text-on-surface">{row.target}</span>
                    </div>
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-muted">{row.message}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : row.id)}
                      className="rounded p-1 text-muted hover:bg-surface-container-low"
                      aria-label="Expand row"
                    >
                      <MaterialIcon name="more_horiz" size={20} />
                    </button>
                  </td>
                </tr>
                {isExpanded && (
                  <tr className="bg-surface-container-low">
                    <td colSpan={6} className="border-l-4 border-secondary px-6 py-4">
                      <div className="grid gap-3 text-body-sm sm:grid-cols-3">
                        <div>
                          <p className="text-caption-xs font-medium uppercase text-muted">User Agent</p>
                          <p className="text-muted">Not available</p>
                        </div>
                        <div>
                          <p className="text-caption-xs font-medium uppercase text-muted">Location</p>
                          <p className="text-muted">Not available</p>
                        </div>
                        <div>
                          <p className="text-caption-xs font-medium uppercase text-muted">IP Address</p>
                          <p className="font-mono text-muted">—</p>
                        </div>
                        <div className="sm:col-span-3">
                          <p className="text-caption-xs font-medium uppercase text-muted">Full message</p>
                          <p className="text-on-surface">{row.message}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
