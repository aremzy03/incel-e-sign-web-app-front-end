'use client'

import { useRouter } from 'next/navigation'
import { MaterialIcon } from '@/components/ui/material-icon'
import { UserAvatar } from '@/components/UserAvatar'
import { cn } from '@/lib/utils'

export interface SigningShellProps {
  children: React.ReactNode
  documentTitle?: string
  /** Show condensed left nav rail (active signing). */
  showNavRail?: boolean
  /** Authenticated user info (dashboard routes). */
  user?: {
    id: string
    name: string
    email: string
    profilePhotoUrl?: string | null
    initials: string
  }
  /** Center toolbar slot (zoom controls, etc.). */
  toolbar?: React.ReactNode
  /** Fixed bottom bar (mobile CTA or signing footer). */
  footer?: React.ReactNode
  onClose?: () => void
  closeLabel?: string
  hideClose?: boolean
  className?: string
}

export function SigningShell({
  children,
  documentTitle,
  showNavRail = false,
  user,
  toolbar,
  footer,
  onClose,
  closeLabel = 'Close',
  hideClose = false,
  className,
}: SigningShellProps) {
  const router = useRouter()

  const handleClose = () => {
    if (onClose) {
      onClose()
      return
    }
    if (user) {
      router.push('/dashboard/envelopes')
      return
    }
    router.push('/')
  }

  return (
    <div className={cn('flex h-screen flex-col overflow-hidden bg-background text-on-background', className)}>
      <header className="fixed top-0 left-0 z-50 flex h-topbar-height w-full items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-4 shadow-sm md:px-8">
        <div className="flex min-w-0 items-center gap-3 md:gap-6">
          <span className="shrink-0 font-headline-xl text-headline-xl font-bold text-primary">Incel E-Sign</span>
          {documentTitle ? (
            <>
              <div className="hidden h-6 w-px bg-outline-variant md:block" />
              <div className="hidden min-w-0 flex-col md:flex">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Document</span>
                <span className="truncate font-headline-lg text-headline-lg text-primary max-w-[200px] lg:max-w-[300px]">
                  {documentTitle}
                </span>
              </div>
            </>
          ) : null}
        </div>

        {toolbar ? (
          <div className="hidden flex-1 items-center justify-center px-4 md:flex">{toolbar}</div>
        ) : null}

        <div className="flex shrink-0 items-center gap-2 md:gap-4">
          {user ? (
            <div className="hidden flex-col items-end md:flex">
              <span className="font-label-sm text-label-sm text-on-surface">{user.name}</span>
              <span className="font-caption-xs text-caption-xs text-muted">{user.email}</span>
            </div>
          ) : null}
          {user ? (
            <UserAvatar
              userId={user.id}
              userName={user.name}
              userEmail={user.email}
              profilePhotoUrl={user.profilePhotoUrl}
              className="ml-1 h-10 w-10 border-2 border-primary-container"
            />
          ) : null}
          {!hideClose ? (
            <button
              type="button"
              onClick={handleClose}
              className="ml-1 flex items-center gap-2 rounded-xl bg-primary px-3 py-2 font-label-sm text-label-sm text-on-primary transition-all hover:bg-primary-hover active:scale-95 md:px-4"
            >
              <MaterialIcon name="close" size={18} />
              <span className="hidden sm:inline">{closeLabel}</span>
            </button>
          ) : null}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden pt-topbar-height">
        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
      </div>

      {footer}
    </div>
  )
}
