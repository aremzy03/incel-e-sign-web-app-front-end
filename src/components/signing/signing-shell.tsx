'use client'

import Link from 'next/link'
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
          <button
            type="button"
            className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container"
            aria-label="Help"
          >
            <MaterialIcon name="help_outline" size={22} />
          </button>
          <button
            type="button"
            className="hidden rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container md:inline-flex"
            aria-label="Language"
          >
            <MaterialIcon name="language" size={22} />
          </button>
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
        {showNavRail ? (
          <nav
            className="hidden w-[80px] shrink-0 flex-col items-center gap-8 border-r border-outline-variant bg-primary py-6 md:flex"
            aria-label="Signing navigation"
          >
            <div className="flex cursor-pointer flex-col items-center gap-1">
              <div className="rounded-xl bg-secondary-container p-3 text-on-secondary-container shadow-md">
                <MaterialIcon name="edit_document" fill size={24} className="text-on-secondary-container" />
              </div>
              <span className="font-label-xs text-label-xs text-on-primary">Sign</span>
            </div>
            <div className="flex cursor-not-allowed flex-col items-center gap-1 opacity-60">
              <div className="p-3">
                <MaterialIcon name="visibility" size={24} className="text-on-primary-fixed-variant" />
              </div>
              <span className="font-label-xs text-label-xs text-on-primary-fixed-variant">Review</span>
            </div>
            <div className="mt-auto flex flex-col items-center gap-6">
              <Link href="/dashboard/settings" className="text-on-primary-fixed-variant hover:text-white">
                <MaterialIcon name="settings" size={22} />
              </Link>
              <button type="button" className="text-on-primary-fixed-variant hover:text-white">
                <MaterialIcon name="contact_support" size={22} />
              </button>
            </div>
          </nav>
        ) : null}

        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
      </div>

      {footer}
    </div>
  )
}
