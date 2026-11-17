'use client'

import Link from 'next/link'
import { MaterialIcon } from '@/components/ui/material-icon'
import { cn } from '@/lib/utils'

interface DocumentViewNavSidebarProps {
  documentTitle: string
  documentId: string
}

const navyFocus =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-your-turn focus-visible:ring-offset-2 focus-visible:ring-offset-primary dark:focus-visible:ring-offset-primary-container'

export function DocumentViewNavSidebar({ documentTitle, documentId }: DocumentViewNavSidebarProps) {
  const selfSignHref = `/dashboard/envelopes/self-sign?documentId=${encodeURIComponent(documentId)}`

  return (
    <aside className="flex h-full w-sidebar-width shrink-0 flex-col bg-primary text-on-primary dark:bg-primary-container">
      <div className="shrink-0 border-b border-primary-hover px-4 py-4">
        <p className="truncate text-label-sm text-white" title={documentTitle} aria-hidden="true">
          {documentTitle}
        </p>
      </div>

      <nav aria-label="Document" className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <Link
          href="/dashboard/documents"
          prefetch={false}
          className={cn(
            'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-label-sm transition-colors',
            'text-on-primary-container hover:bg-primary-hover hover:text-on-primary',
            navyFocus,
            'dark:text-on-primary-container dark:hover:bg-primary-hover dark:hover:text-on-primary',
          )}
        >
          <MaterialIcon
            name="folder_open"
            size={20}
            className="text-on-primary-container group-hover:text-on-primary dark:text-on-primary-container dark:group-hover:text-on-primary"
          />
          My Documents
        </Link>

        <div
          aria-current="page"
          className="flex w-full items-center gap-3 rounded-lg border-l-4 border-status-your-turn bg-primary-hover py-2.5 pl-2 pr-3 text-label-sm text-accent-light dark:bg-primary dark:text-on-primary"
        >
          <MaterialIcon
            name="description"
            fill
            size={20}
            className="text-accent-light dark:text-on-primary"
          />
          Preview
        </div>
      </nav>

      <div className="shrink-0 border-t border-primary-hover p-4">
        <p className="mb-3 text-body-sm text-on-primary-container">
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
            'dark:border-on-primary-container/40 dark:bg-transparent dark:text-on-primary-container dark:hover:bg-primary/10',
            navyFocus,
          )}
        >
          Send for Signature
        </Link>
      </div>
    </aside>
  )
}
