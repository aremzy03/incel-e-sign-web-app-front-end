'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-hot-toast'
import { getSession } from 'next-auth/react'
import Link from 'next/link'
import { AuthorityButton } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Form as AuthorityForm,
  FormField,
  FormLabel,
  FormInput,
  FormMessage,
} from '@/components/ui/authority-form'
import { MaterialIcon } from '@/components/ui/material-icon'
import { AuthCenteredLayout } from '@/components/auth/auth-layouts'
import { GoogleOAuthButtonConnected } from '@/components/auth/google-oauth-button'
import { registerSchema, type RegisterFormData } from '@/lib/validations'
import { authAPI } from '@/lib/api/auth'

export const dynamic = 'force-dynamic'

export default function RegisterPage() {
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const router = useRouter()

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession()
      if (session) router.push('/dashboard')
    }
    checkSession()
  }, [router])

  const onSubmit = async (data: RegisterFormData) => {
    if (!acceptedTerms) {
      setError('Please accept the terms and conditions')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      await authAPI.register({
        email: data.email,
        password: data.password,
        full_name: `${data.firstName} ${data.lastName}`,
      })

      toast.success('Registration successful! Check your email to confirm your account.')
      router.push(`/email-confirmation?email=${encodeURIComponent(data.email)}`)
    } catch (err: unknown) {
      let errorMessage = 'An error occurred during registration'
      const axiosErr = err as { response?: { data?: Record<string, string | string[]> } }
      if (axiosErr.response?.data?.detail) {
        errorMessage = String(axiosErr.response.data.detail)
      } else if (axiosErr.response?.data?.email) {
        errorMessage = 'Email already exists'
      } else if (axiosErr.response?.data?.password) {
        errorMessage = 'Password does not meet requirements'
      }
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthCenteredLayout maxWidth="lg">
      <div className="auth-card rounded-xl border border-border bg-surface-container-lowest p-8">
        <div className="mb-6 text-center">
          <h1 className="text-headline-xl font-bold text-on-surface">Create Your Account</h1>
          <p className="mt-2 text-body-sm text-muted">Start sending and signing documents in minutes</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 border-error-light bg-error-light">
            <AlertDescription className="text-error">{error}</AlertDescription>
          </Alert>
        )}

        <AuthorityForm onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField>
            <FormLabel required>Full Name</FormLabel>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormInput
                placeholder="First name"
                icon={<MaterialIcon name="person" size={18} className="text-muted" />}
                validation={form.formState.errors.firstName ? 'invalid' : 'idle'}
                {...form.register('firstName')}
              />
              <FormInput
                placeholder="Last name"
                icon={<MaterialIcon name="person" size={18} className="text-muted" />}
                validation={form.formState.errors.lastName ? 'invalid' : 'idle'}
                {...form.register('lastName')}
              />
            </div>
            {(form.formState.errors.firstName || form.formState.errors.lastName) && (
              <FormMessage variant="error">
                {form.formState.errors.firstName?.message || form.formState.errors.lastName?.message}
              </FormMessage>
            )}
          </FormField>

          <FormField>
            <FormLabel required>Email Address</FormLabel>
            <FormInput
              type="email"
              placeholder="your@company.com"
              icon={<MaterialIcon name="mail" size={18} className="text-muted" />}
              validation={form.formState.errors.email ? 'invalid' : 'idle'}
              {...form.register('email')}
            />
            {form.formState.errors.email && (
              <FormMessage variant="error">{form.formState.errors.email.message}</FormMessage>
            )}
          </FormField>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField>
              <FormLabel required>Password</FormLabel>
              <FormInput
                type="password"
                placeholder="Create password"
                icon={<MaterialIcon name="lock" size={18} className="text-muted" />}
                validation={form.formState.errors.password ? 'invalid' : 'idle'}
                {...form.register('password')}
              />
              {form.formState.errors.password && (
                <FormMessage variant="error">{form.formState.errors.password.message}</FormMessage>
              )}
            </FormField>

            <FormField>
              <FormLabel required>Confirm Password</FormLabel>
              <FormInput
                type="password"
                placeholder="Confirm password"
                icon={<MaterialIcon name="lock_reset" size={18} className="text-muted" />}
                validation={form.formState.errors.confirmPassword ? 'invalid' : 'idle'}
                {...form.register('confirmPassword')}
              />
              {form.formState.errors.confirmPassword && (
                <FormMessage variant="error">{form.formState.errors.confirmPassword.message}</FormMessage>
              )}
            </FormField>
          </div>

          <label className="flex items-start gap-3 text-body-sm text-muted">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1 rounded border-border text-secondary focus:ring-status-your-turn"
            />
            <span>
              I agree to the{' '}
              <Link href="#" className="text-secondary hover:text-accent-hover">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="#" className="text-secondary hover:text-accent-hover">
                Privacy Policy
              </Link>
            </span>
          </label>

          <AuthorityButton
            type="submit"
            size="lg"
            fullWidth
            state={isLoading ? 'loading' : 'idle'}
            loadingText="Creating your account..."
            disabled={isLoading}
            className="rounded-xl"
          >
            <span className="inline-flex items-center gap-2">
              Create Account
              <MaterialIcon name="arrow_forward" size={18} className="text-on-primary" />
            </span>
          </AuthorityButton>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface-container-lowest px-2 text-muted">Or continue with</span>
            </div>
          </div>

          <Suspense fallback={<div className="h-12 animate-pulse rounded-xl bg-surface" />}>
            <GoogleOAuthButtonConnected />
          </Suspense>
        </AuthorityForm>

        <p className="mt-6 text-center text-body-sm text-muted">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-secondary hover:text-accent-hover">
            Sign in
          </Link>
        </p>
      </div>

      {/* Trust badges - desktop only */}
      <div className="pointer-events-none fixed bottom-8 left-1/2 hidden -translate-x-1/2 items-center gap-8 lg:flex">
        <div className="flex items-center gap-2 text-caption-xs text-muted">
          <MaterialIcon name="verified" size={16} className="text-success" />
          SOC 2 Compliant
        </div>
        <div className="flex items-center gap-2 text-caption-xs text-muted">
          <MaterialIcon name="security" size={16} className="text-success" />
          AES-256 Encryption
        </div>
        <div className="flex items-center gap-2 text-caption-xs text-muted">
          <MaterialIcon name="encrypted" size={16} className="text-success" />
          eIDAS Ready
        </div>
      </div>
    </AuthCenteredLayout>
  )
}
