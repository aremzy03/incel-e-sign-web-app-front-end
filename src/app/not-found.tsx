import Link from 'next/link'
import { MaterialIcon } from '@/components/ui/material-icon'
import { AuthBrandHeader } from '@/components/auth/auth-layouts'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-surface-bright">
      <header className="flex justify-center px-6 py-8">
        <AuthBrandHeader />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
        <div className="relative mb-8">
          <div className="animate-float flex h-48 w-48 items-center justify-center rounded-3xl bg-primary-light md:h-56 md:w-56">
            <MaterialIcon name="description" fill size={80} className="text-primary opacity-80" />
          </div>
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-secondary-container/40 blur-2xl" />
        </div>

        <p className="text-label-sm font-semibold uppercase tracking-widest text-secondary">Error 404</p>
        <h1 className="mt-3 text-headline-3xl font-bold text-primary">Lost your way?</h1>
        <p className="mx-auto mt-4 max-w-md text-body-base text-muted">
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/dashboard"
            className="glow-effect inline-flex items-center gap-2 rounded-xl bg-secondary px-8 py-3.5 text-sm font-semibold text-on-secondary transition-colors hover:bg-accent-hover"
          >
            <MaterialIcon name="dashboard" size={20} className="text-on-secondary" />
            Back to Dashboard
          </Link>
          <a
            href="mailto:support@incel-esign.com"
            className="inline-flex items-center gap-2 rounded-xl border border-outline-variant bg-white px-8 py-3.5 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
          >
            <MaterialIcon name="contact_support" size={20} />
            Contact Support
          </a>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-6">
          <Link href="#" className="flex items-center gap-1.5 text-body-sm text-muted hover:text-secondary">
            <MaterialIcon name="article" size={16} />
            Templates
          </Link>
          <Link href="#" className="flex items-center gap-1.5 text-body-sm text-muted hover:text-secondary">
            <MaterialIcon name="verified_user" size={16} />
            Security Policy
          </Link>
          <Link href="#" className="flex items-center gap-1.5 text-body-sm text-muted hover:text-secondary">
            <MaterialIcon name="help" size={16} />
            Help Center
          </Link>
        </div>
      </main>

      <footer className="py-6 text-center text-caption-xs text-muted">
        © {new Date().getFullYear()} Incel E-Sign. All rights reserved.
      </footer>
    </div>
  )
}
