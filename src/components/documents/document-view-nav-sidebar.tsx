'use client'

import Link from 'next/link'
import { MaterialIcon } from '@/components/ui/material-icon'
import { cn } from '@/lib/utils'

interface DocumentViewNavSidebarProps {
  documentTitle: string
}

export function DocumentViewNavSidebar({ documentTitle }: DocumentViewNavSidebarProps) {
  return (
    <aside className="z-20 flex w-sidebar-width shrink-0 flex-col gap-2 bg-primary p-4 pt-4 text-on-primary shadow-md dark:bg-primary-container">
      <div className="mb-4">
        <div className="mb-2 font-caption-xs uppercase tracking-wider text-on-primary/60">Viewer Status</div>
        <div className="flex items-center gap-2 rounded-lg border border-primary-fixed/20 bg-primary-container p-3">
          <MaterialIcon name="visibility" size={22} className="text-secondary-fixed" />
          <div className="min-w-0">
            <div className="font-label-sm text-on-primary">Viewing Document</div>
            <div className="truncate text-[10px] text-on-primary-container">{documentTitle}</div>
          </div>
        </div>
      </div>

      <nav className="space-y-1">
        <Link
          href="/dashboard/documents"
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-4 py-3 font-label-sm transition-all',
            'bg-secondary text-on-secondary',
          )}
        >
          <MaterialIcon name="folder_open" size={22} />
          <span className="font-label-sm">My Documents</span>
        </Link>

        <div
          className={cn(
            'flex w-full cursor-default items-center gap-3 rounded-lg px-4 py-3 font-label-sm',
            'text-on-primary/70',
          )}
        >
          <MaterialIcon name="description" size={22} />
          <span className="font-label-sm">Preview</span>
        </div>
      </nav>

      <div className="mt-auto border-t border-primary-fixed/20 pt-6">
        <div className="rounded-xl bg-primary-hover p-4">
          <p className="mb-3 text-xs leading-relaxed text-on-primary/70">
            Ready to sign or send this document for signatures?
          </p>
          <Link
            href="/dashboard/envelopes/self-sign"
            className="mb-2 block w-full rounded-lg bg-secondary-fixed py-2 text-center font-label-sm text-on-secondary-fixed transition-colors hover:bg-secondary-fixed-dim"
          >
            Self-Sign
          </Link>
          <Link
            href="/dashboard/envelopes/create"
            className="block w-full rounded-lg border border-on-primary/30 py-2 text-center font-label-sm text-on-primary transition-colors hover:bg-primary-container"
          >
            Send for Signature
          </Link>
        </div>
      </div>
    </aside>
  )
}
