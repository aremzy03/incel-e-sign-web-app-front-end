import Link from 'next/link'
import { MaterialIcon } from '@/components/ui/material-icon'
import { BrandMark } from '@/components/ui/incel-logo'
import { cn } from '@/lib/utils'

interface AuthBrandHeaderProps {
  className?: string
  subtitle?: string
  /** Set when the header sits on the navy brand panel. */
  onDark?: boolean
}

export function AuthBrandHeader({
  className,
  subtitle = 'Incel Group',
  onDark = false,
}: AuthBrandHeaderProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <BrandMark size={40} tile={onDark ? 'always' : 'dark-mode'} />
      <div className="flex flex-col">
        <span className={cn('text-lg font-bold', onDark ? 'text-on-panel' : 'text-primary')}>INCEL E-Sign</span>
        <span className={cn('text-xs font-medium', onDark ? 'text-on-panel-muted' : 'text-muted')}>{subtitle}</span>
      </div>
    </div>
  )
}

interface AuthSplitLayoutProps {
  children: React.ReactNode
  brandPanel?: React.ReactNode
}

export function AuthSplitLayout({ children, brandPanel }: AuthSplitLayoutProps) {
  return (
    <main className="flex min-h-screen overflow-hidden bg-surface-bright">
      {/* Left branding panel */}
      <section className="relative hidden w-1/2 flex-col bg-panel p-8 text-on-panel md:p-16 lg:flex">
        {brandPanel ?? (
          <>
            <AuthBrandHeader onDark />
            <div className="mt-16 flex flex-1 flex-col justify-center">
              <h1 className="text-headline-3xl font-bold leading-tight text-on-panel">
                Get Incel Group agreements signed
              </h1>
              <p className="mt-4 max-w-md text-body-base text-on-panel-muted">
                Prepare a document, send it to signers in order, and track it until every signature is in.
              </p>
              <div className="mt-12 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-panel-hover">
                    <MaterialIcon name="format_list_numbered" size={20} className="text-on-panel-active" />
                  </div>
                  <div>
                    <p className="font-semibold text-on-panel">Signing in order</p>
                    <p className="text-sm text-on-panel-muted">Each signer acts in the order you set</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-panel-hover">
                    <MaterialIcon name="timeline" size={20} className="text-on-panel-active" />
                  </div>
                  <div>
                    <p className="font-semibold text-on-panel">Full audit trail</p>
                    <p className="text-sm text-on-panel-muted">Complete signing history & timestamps</p>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs text-on-panel-muted">
              © {new Date().getFullYear()} Incel Group
            </p>
          </>
        )}
      </section>

      {/* Right form panel */}
      <section className="flex w-full flex-col bg-surface-container-lowest lg:w-1/2">
        {children}
      </section>
    </main>
  )
}

interface AuthCenteredLayoutProps {
  children: React.ReactNode
  showBrand?: boolean
  maxWidth?: 'md' | 'lg'
}

export function AuthCenteredLayout({
  children,
  showBrand = true,
  maxWidth = 'md',
}: AuthCenteredLayoutProps) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-bg p-6">

      <div className={cn('relative z-10 w-full', maxWidth === 'lg' ? 'max-w-[480px]' : 'max-w-md')}>
        {showBrand && (
          <div className="mb-8 flex justify-center">
            <AuthBrandHeader />
          </div>
        )}
        {children}
      </div>
    </main>
  )
}

export function GoogleOAuthButton({
  className,
  onClick,
}: {
  className?: string
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center justify-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-low',
        className
      )}
    >
      <GoogleIcon />
      <span>Continue with Google</span>
    </button>
  )
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

export function AuthHelpFab() {
  return (
    <a
      href="mailto:support@incel-esign.com"
      className="fixed bottom-8 right-8 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-on-primary shadow-raised transition-transform hover:scale-105"
      aria-label="Get help"
    >
      <MaterialIcon name="help_outline" size={24} className="text-on-primary" />
    </a>
  )
}

export function AuthFooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-sm font-medium text-secondary hover:text-accent-hover">
      {children}
    </Link>
  )
}
