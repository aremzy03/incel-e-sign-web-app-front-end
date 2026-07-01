'use client'

import { Suspense, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { MaterialIcon } from '@/components/ui/material-icon'
import { AuthorityButton } from '@/components/ui/button'
import { AuthCenteredLayout, AuthBrandHeader } from '@/components/auth/auth-layouts'

function EmailConfirmationContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams?.get('email') ?? ''

  useEffect(() => {
    if (!email) {
      router.replace('/register')
    }
  }, [email, router])

  if (!email) return null

  return (
    <AuthCenteredLayout showBrand={false}>
      <div className="mb-6 flex justify-center">
        <AuthBrandHeader subtitle="Legal Authority" />
      </div>

      <div className="glass-card rounded-xl p-8 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary-container">
          <MaterialIcon name="mail" size={40} className="text-status-your-turn" />
        </div>

        <h1 className="text-headline-xl font-bold text-on-surface">Check your email</h1>
        <p className="mt-3 text-body-sm text-muted">
          We sent a confirmation link to{' '}
          <span className="font-medium text-on-surface">{email}</span>
        </p>

        <div className="mt-8 space-y-3">
          <AuthorityButton
            asChild
            size="lg"
            fullWidth
            className="rounded-xl"
          >
            <a href={`mailto:${email}`}>Open Email Client</a>
          </AuthorityButton>

          <button
            type="button"
            disabled
            title="Resend verification is not yet available"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium text-muted opacity-60"
          >
            <MaterialIcon name="refresh" size={18} />
            Resend confirmation email
          </button>

          <Link
            href="/login"
            className="flex items-center justify-center gap-2 py-2 text-sm font-medium text-status-your-turn hover:text-accent-hover"
          >
            <MaterialIcon name="arrow_back" size={18} />
            Back to login
          </Link>
        </div>

        <p className="mt-6 text-caption-xs text-muted">
          Didn&apos;t receive the email? Check your spam folder or contact support.
        </p>
      </div>

      <footer className="mt-12 flex flex-wrap items-center justify-center gap-4 px-4 text-caption-xs text-muted opacity-60">
        <span>AES-256 Encrypted</span>
        <span>·</span>
        <span>SOC 2 Compliant</span>
        <span>·</span>
        <span>eIDAS Ready</span>
      </footer>
    </AuthCenteredLayout>
  )
}

export default function EmailConfirmationPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <EmailConfirmationContent />
    </Suspense>
  )
}
