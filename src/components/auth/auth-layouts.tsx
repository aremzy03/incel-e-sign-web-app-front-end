import Link from 'next/link'
import { MaterialIcon } from '@/components/ui/material-icon'
import { cn } from '@/lib/utils'

interface AuthBrandHeaderProps {
  className?: string
  subtitle?: string
  iconFill?: boolean
}

export function AuthBrandHeader({
  className,
  subtitle = 'Legal Authority',
  iconFill = true,
}: AuthBrandHeaderProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-on-secondary">
        <MaterialIcon name="gavel" fill={iconFill} size={22} className="text-on-secondary" />
      </div>
      <div className="flex flex-col">
        <span className="text-lg font-bold text-primary">Incel E-Sign</span>
        <span className="text-xs font-medium text-muted">{subtitle}</span>
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
      <section className="relative hidden w-1/2 flex-col bg-primary p-8 text-on-primary md:p-16 lg:flex">
        {brandPanel ?? (
          <>
            <AuthBrandHeader className="text-on-primary [&_span]:text-on-primary [&_.text-muted]:text-on-primary-container" />
            <div className="mt-16 flex flex-1 flex-col justify-center">
              <h1 className="text-headline-3xl font-bold leading-tight text-on-primary">
                Legal authority in every signature
              </h1>
              <p className="mt-4 max-w-md text-body-base text-on-primary-container">
                Secure, compliant e-signatures trusted by enterprises worldwide.
              </p>
              <div className="mt-12 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-hover">
                    <MaterialIcon name="verified" size={20} className="text-accent-light" />
                  </div>
                  <div>
                    <p className="font-semibold text-on-primary">Legally binding</p>
                    <p className="text-sm text-on-primary-container">eIDAS & ESIGN compliant signatures</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-hover">
                    <MaterialIcon name="timeline" size={20} className="text-accent-light" />
                  </div>
                  <div>
                    <p className="font-semibold text-on-primary">Full audit trail</p>
                    <p className="text-sm text-on-primary-container">Complete signing history & timestamps</p>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs text-on-primary-container">
              © {new Date().getFullYear()} Incel E-Sign. All rights reserved.
            </p>
          </>
        )}
      </section>

      {/* Right form panel */}
      <section className="flex w-full flex-col bg-white lg:w-1/2">
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
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-bg p-6">
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-60" />
      <div className="pointer-events-none absolute -left-32 top-20 h-64 w-64 rounded-full bg-secondary-container/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-20 h-64 w-64 rounded-full bg-primary-light blur-3xl" />

      <div className={cn('relative z-10 w-full', maxWidth === 'lg' ? 'max-w-[480px]' : 'max-w-md')}>
        {showBrand && (
          <div className="mb-8 flex justify-center">
            <AuthBrandHeader />
          </div>
        )}
        {children}
      </div>
    </div>
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
        'flex w-full items-center justify-center gap-2 rounded-xl border border-outline-variant bg-white px-4 py-3 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-low',
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
