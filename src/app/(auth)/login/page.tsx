'use client'

import React, { useState, Suspense } from 'react'
import Link from 'next/link'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-hot-toast'
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
import {
  AuthSplitLayout,
  AuthBrandHeader,
  AuthHelpFab,
} from '@/components/auth/auth-layouts'
import { GoogleOAuthButtonConnected } from '@/components/auth/google-oauth-button'
import { loginSchema, type LoginFormData } from '@/lib/validations'
import { getSafePostLoginPath, POST_LOGIN_FALLBACK } from '@/lib/post-login-redirect'

export const dynamic = 'force-dynamic'

function LoginParamHandler({ onSetError }: { onSetError: (msg: string) => void }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  React.useEffect(() => {
    const message = searchParams?.get('message')
    if (message) {
      switch (message) {
        case 'session_expired':
          toast.error('Your session has expired. Please log in again.')
          onSetError('Your session has expired. Please log in again.')
          break
        case 'auth_failed':
          toast.error('Authentication failed. Please log in again.')
          onSetError('Authentication failed. Please log in again.')
          break
        case 'confirm_email':
          toast.success('Registration successful. Confirm your email, then sign in.')
          onSetError('Confirm your email before signing in.')
          break
        default:
          break
      }
    }

    const checkSession = async () => {
      const session = await getSession()
      if (session?.accessToken && !session?.error) {
        try {
          const payload = JSON.parse(atob(session.accessToken.split('.')[1]))
          const currentTime = Math.floor(Date.now() / 1000)
          if (payload.exp > currentTime) {
            const next = searchParams?.get('next')
            router.push(getSafePostLoginPath(next, POST_LOGIN_FALLBACK))
          }
        } catch (error) {
          console.error('Error checking token validity:', error)
        }
      }
    }
    checkSession()
  }, [router, searchParams, onSetError])

  return null
}

export default function LoginPage() {
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid credentials')
        toast.error('Invalid credentials')
      } else {
        const session = await getSession()
        if (session) {
          toast.success('Welcome back!')
          const next =
            typeof window !== 'undefined'
              ? new URLSearchParams(window.location.search).get('next')
              : null
          router.push(getSafePostLoginPath(next, POST_LOGIN_FALLBACK))
        } else {
          setError('Login failed - no session created')
          toast.error('Login failed - no session created')
        }
      }
    } catch {
      setError('An error occurred during login')
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Suspense fallback={null}>
        <LoginParamHandler onSetError={setError} />
      </Suspense>
      <AuthSplitLayout>
        <div className="flex flex-1 flex-col justify-center p-8 md:p-16">
          {/* Mobile logo */}
          <div className="mb-12 lg:hidden">
            <AuthBrandHeader />
          </div>

          <div className="mx-auto w-full max-w-md">
            <div className="mb-8">
              <h2 className="text-headline-2xl font-bold text-on-surface">Welcome Back</h2>
              <p className="mt-2 text-body-sm text-muted">Sign in to your legal authority platform</p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-6 border-error-light bg-error-light">
                <AlertDescription className="text-error">{error}</AlertDescription>
              </Alert>
            )}

            <SharedForm {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
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
                          inputSize="lg"
                          autoComplete="email"
                          invalid={!!fieldState.error}
                          icon={<MaterialIcon name="mail" size={20} className="text-muted" />}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <div className="flex items-center justify-between gap-3">
                        <FormLabel required>Password</FormLabel>
                        <Link href="/login" className="text-label-sm text-secondary hover:text-accent-hover">
                          Forgot password?
                        </Link>
                      </div>
                      <FormControl>
                        <InputWithIcon
                          {...field}
                          type="password"
                          placeholder="Enter your password"
                          inputSize="lg"
                          autoComplete="current-password"
                          invalid={!!fieldState.error}
                          icon={<MaterialIcon name="lock" size={20} className="text-muted" />}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <AuthorityButton
                  type="submit"
                  size="lg"
                  fullWidth
                  state={isLoading ? 'loading' : 'idle'}
                  loadingText="Signing you in..."
                  disabled={isLoading}
                  className="rounded-xl"
                >
                  <span className="inline-flex items-center gap-2">
                    Sign In
                    <MaterialIcon name="arrow_forward" size={18} className="text-on-primary" />
                  </span>
                </AuthorityButton>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted">Or continue with</span>
                  </div>
                </div>

                <GoogleOAuthButtonConnected />
              </form>
            </SharedForm>

            <p className="mt-8 text-center text-body-sm text-muted">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-medium text-secondary hover:text-accent-hover">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </AuthSplitLayout>
      <AuthHelpFab />
    </>
  )
}
