'use client'

import Link from 'next/link'
import { MaterialIcon } from '@/components/ui/material-icon'
import { cn } from '@/lib/utils'

type SelfSignStep = 'upload' | 'prepare' | 'sign' | 'complete'

interface SelfSignNavSidebarProps {
  activeStep?: SelfSignStep
  onUploadClick?: () => void
}

const STEPS: Array<{ id: SelfSignStep; label: string; icon: string }> = [
  { id: 'upload', label: 'Upload', icon: 'upload_file' },
  { id: 'prepare', label: 'Prepare', icon: 'edit_note' },
  { id: 'sign', label: 'Sign', icon: 'history_edu' },
  { id: 'complete', label: 'Complete', icon: 'task_alt' },
]

export function SelfSignNavSidebar({
  activeStep = 'upload',
  onUploadClick,
}: SelfSignNavSidebarProps) {
  return (
    <aside className="z-20 flex w-sidebar-width shrink-0 flex-col gap-2 bg-primary p-4 pt-4 text-on-primary shadow-md">
      <div className="mb-4">
        <div className="mb-2 font-caption-xs uppercase tracking-wider text-on-primary/60">Editor Status</div>
        <div className="flex items-center gap-2 rounded-lg border border-primary-fixed/20 bg-primary-container p-3">
          <MaterialIcon name="edit_square" size={22} className="text-secondary-fixed" />
          <div>
            <div className="font-label-sm text-white">Self-Signing</div>
            <div className="text-[10px] text-on-primary-container">Live Session Active</div>
          </div>
        </div>
      </div>

      <nav className="space-y-1">
        {STEPS.map((step) => {
          const isActive = step.id === activeStep
          const isUpload = step.id === 'upload'
          const content = (
            <>
              <MaterialIcon name={step.icon} size={22} />
              <span className="font-label-sm">{step.label}</span>
            </>
          )
          const className = cn(
            'flex w-full items-center gap-3 rounded-lg px-4 py-3 font-label-sm transition-all',
            isActive
              ? 'bg-secondary text-on-secondary'
              : 'text-on-primary/70 hover:bg-primary-hover',
          )

          if (isUpload && onUploadClick) {
            return (
              <button key={step.id} type="button" onClick={onUploadClick} className={className}>
                {content}
              </button>
            )
          }

          return (
            <div key={step.id} className={cn(className, !isActive && 'cursor-default')}>
              {content}
            </div>
          )
        })}
      </nav>

      <div className="mt-auto border-t border-primary-fixed/20 pt-6">
        <div className="rounded-xl bg-primary-hover p-4">
          <p className="mb-3 text-xs leading-relaxed text-on-primary/70">
            Need others to sign this document instead?
          </p>
          <Link
            href="/dashboard/envelopes/create"
            className="block w-full rounded-lg bg-secondary-fixed py-2 text-center font-label-sm text-on-secondary-fixed transition-colors hover:bg-secondary-fixed-dim"
          >
            Send for Signature
          </Link>
        </div>
      </div>
    </aside>
  )
}
