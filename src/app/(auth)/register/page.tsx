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
  Form as SharedForm,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { InputWithIcon } from '@/components/ui/input-with-icon'
import { MaterialIcon } from '@/components/ui/material-icon'
import { AuthCenteredLayout } from '@/components/auth/auth-layouts'
import { GoogleOAuthButtonConnected } from '@/components/auth/google-oauth-button'
import { registerSchema, type RegisterFormData } from '@/lib/validations'
import { authAPI } from '@/lib/api/auth'

export const dynamic = 'force-dynamic'

export default function RegisterPage() {
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptedTerms: false,
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

        <SharedForm {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel required>First Name</FormLabel>
                    <FormControl>
                      <InputWithIcon
                        {...field}
                        placeholder="First name"
                        autoComplete="given-name"
                        inputSize="lg"
                        invalid={!!fieldState.error}
                        icon={<MaterialIcon name="person" size={18} className="text-muted" />}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel required>Last Name</FormLabel>
                    <FormControl>
                      <InputWithIcon
                        {...field}
                        placeholder="Last name"
                        autoComplete="family-name"
                        inputSize="lg"
                        invalid={!!fieldState.error}
                        icon={<MaterialIcon name="person" size={18} className="text-muted" />}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel required>Email Address</FormLabel>
                  <FormControl>
                    <InputWithIcon
                      {...field}
                      type="email"
                      placeholder="your@company.com"
                      autoComplete="email"
                      inputSize="lg"
                      invalid={!!fieldState.error}
                      icon={<MaterialIcon name="mail" size={18} className="text-muted" />}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="password"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel required>Password</FormLabel>
                    <FormControl>
                      <InputWithIcon
                        {...field}
                        type="password"
                        placeholder="Create password"
                        autoComplete="new-password"
                        inputSize="lg"
                        invalid={!!fieldState.error}
                        icon={<MaterialIcon name="lock" size={18} className="text-muted" />}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel required>Confirm Password</FormLabel>
                    <FormControl>
                      <InputWithIcon
                        {...field}
                        type="password"
                        placeholder="Confirm password"
                        autoComplete="new-password"
                        inputSize="lg"
                        invalid={!!fieldState.error}
                        icon={<MaterialIcon name="lock_reset" size={18} className="text-muted" />}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="acceptedTerms"
              render={({ field, fieldState }) => (
                <FormItem>
                  <div className="flex items-start gap-3 rounded-xl border border-transparent p-1">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(event) => field.onChange(event.target.checked)}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        className="mt-1 h-4 w-4 rounded border-border text-secondary focus:ring-status-your-turn"
                      />
                    </FormControl>
                    <div className="space-y-1">
                      <FormLabel className="cursor-pointer text-body-sm font-normal leading-6 text-muted">
                        I agree to the{' '}
                        <Link href="#" className="font-medium text-secondary hover:text-accent-hover">
                          Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link href="#" className="font-medium text-secondary hover:text-accent-hover">
                          Privacy Policy
                        </Link>
                      </FormLabel>
                      {fieldState.error ? <FormMessage /> : null}
                    </div>
                  </div>
                </FormItem>
              )}
            />

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
          </form>
        </SharedForm>

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
