'use client'

import Link from 'next/link'
import { MaterialIcon } from '@/components/ui/material-icon'
import { cn } from '@/lib/utils'

interface DocumentViewNavSidebarProps {
  documentTitle: string
  documentId: string
}

const navyFocus =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-panel-indicator focus-visible:ring-offset-2 focus-visible:ring-offset-panel'

export function DocumentViewNavSidebar({ documentTitle, documentId }: DocumentViewNavSidebarProps) {
  const selfSignHref = `/dashboard/documents/${encodeURIComponent(documentId)}/edit?tools=sign`

  return (
    <aside className="flex h-full w-sidebar-width shrink-0 flex-col border-r border-panel-border bg-panel text-on-panel">
      <div className="shrink-0 border-b border-panel-border px-4 py-4">
        <p className="truncate text-label-sm text-on-panel" title={documentTitle} aria-hidden="true">
          {documentTitle}
        </p>
      </div>

      <nav aria-label="Document" className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <Link
          href="/dashboard/documents"
          prefetch={false}
          className={cn(
            'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-label-sm transition-colors',
            'text-on-panel-muted hover:bg-panel-hover hover:text-on-panel',
            navyFocus,
          )}
        >
          <MaterialIcon
            name="folder_open"
            size={20}
            className="text-on-panel-muted group-hover:text-on-panel"
          />
          My Documents
        </Link>

        <div
          aria-current="page"
          className="flex w-full items-center gap-3 rounded-lg bg-panel-active px-3 py-2.5 text-label-sm font-semibold text-on-panel"
        >
          <MaterialIcon
            name="description"
            fill
            size={20}
            className="text-panel-indicator"
          />
          Preview
        </div>
      </nav>

      <div className="shrink-0 border-t border-panel-border p-4">
        <p className="mb-3 text-body-sm text-on-panel-muted">
          Ready to sign or send this document for signatures?
        </p>
        <Link
          href={selfSignHref}
          prefetch={false}
          className={cn(
            'mb-2 flex h-10 w-full items-center justify-center rounded-xl bg-secondary px-4 text-label-sm text-on-secondary transition-colors hover:-translate-y-0.5 hover:bg-accent-hover active:translate-y-0',
            navyFocus,
          )}
        >
          Self-Sign
        </Link>
        <Link
          href="/dashboard/envelopes/create"
          prefetch={false}
          className={cn(
            'flex h-10 w-full items-center justify-center rounded-xl border border-outline-variant bg-surface-container-lowest px-4 text-label-sm text-primary transition-colors hover:-translate-y-0.5 hover:bg-surface active:translate-y-0',
            'dark:border-panel-border dark:bg-transparent dark:text-on-panel dark:hover:bg-panel-hover',
            navyFocus,
          )}
        >
          Send for Signature
        </Link>
      </div>
    </aside>
  )
}
