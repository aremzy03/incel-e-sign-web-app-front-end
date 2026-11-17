'use client'

import { MaterialIcon } from '@/components/ui/material-icon'
import { cn } from '@/lib/utils'

type SelfSignStep = 'upload' | 'sign'

interface SelfSignNavSidebarProps {
  activeStep?: SelfSignStep
  onChangeDocument?: () => void
}

const navyFocus =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-your-turn focus-visible:ring-offset-2 focus-visible:ring-offset-primary dark:focus-visible:ring-offset-primary-container'

const activeRow =
  'border-l-4 border-status-your-turn bg-primary-hover pl-2 pr-3 text-accent-light dark:bg-primary dark:text-on-primary'

const idleRow = 'px-3 text-on-primary-container hover:bg-primary-hover hover:text-on-primary'

export function SelfSignNavSidebar({
  activeStep = 'upload',
  onChangeDocument,
}: SelfSignNavSidebarProps) {
  const signing = activeStep === 'sign'

  return (
    <aside className="z-20 flex w-sidebar-width shrink-0 flex-col bg-primary p-4 text-on-primary dark:bg-primary-container">
      <h2 className="mb-4 px-1 font-label-sm text-on-primary dark:text-on-primary-container">
        Self-Signing
      </h2>

      <nav aria-label="Self-sign" className="space-y-1">
        <button
          type="button"
          onClick={onChangeDocument}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg py-2.5 font-label-sm transition-colors',
            navyFocus,
            signing ? idleRow : activeRow,
          )}
        >
          <MaterialIcon name="upload_file" size={20} />
          <span>Change document</span>
        </button>

        <div
          className={cn(
            'flex w-full items-center gap-3 rounded-lg py-2.5 font-label-sm',
            signing ? activeRow : 'px-3 text-on-primary-container',
          )}
          aria-current={signing ? 'step' : undefined}
        >
          <MaterialIcon name="history_edu" size={20} />
          <span>Sign</span>
        </div>
      </nav>
    </aside>
  )
}
