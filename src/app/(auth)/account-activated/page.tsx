'use client'

import Link from 'next/link'
import { MaterialIcon } from '@/components/ui/material-icon'
import { AuthorityButton } from '@/components/ui/button'
import { AuthCenteredLayout, AuthBrandHeader } from '@/components/auth/auth-layouts'

export default function AccountActivatedPage() {
  return (
    <AuthCenteredLayout showBrand={false}>
      <div className="mb-8 flex justify-center">
        <AuthBrandHeader />
      </div>

      <div className="auth-card rounded-xl border border-border bg-surface-container-lowest p-8 text-center md:p-12">
        <div className="success-checkmark-bounce mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success-light">
          <MaterialIcon name="check_circle" fill size={48} className="text-success" />
        </div>

        <h1 className="text-headline-2xl font-bold text-on-surface">Account activated!</h1>
        <p className="mx-auto mt-4 max-w-sm text-body-sm text-muted">
          Your email has been verified. You can now sign in and start sending documents for signature.
        </p>

        <AuthorityButton asChild size="lg" fullWidth className="mt-8 rounded-xl">
          <Link href="/login">Sign in to get started</Link>
        </AuthorityButton>

        <p className="mt-6 text-body-sm text-muted">
          Need help?{' '}
          <a href="mailto:support@incel-esign.com" className="font-medium text-secondary hover:text-accent-hover">
            Contact support
          </a>
        </p>
      </div>

      <div className="mt-8 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-caption-xs text-muted">
          <MaterialIcon name="lock" size={14} className="text-success" />
          TLS Encrypted
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-caption-xs text-muted">
          <MaterialIcon name="verified_user" size={14} className="text-success" />
          SOC 2
        </div>
      </div>
    </AuthCenteredLayout>
  )
}
