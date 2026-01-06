'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-hot-toast'
import { getSession, signIn } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Mail, Lock, User, ArrowRight } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthorityButton, Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Form as AuthorityForm,
  FormField,
  FormLabel,
  FormInput,
  FormMessage,
} from '@/components/ui/authority-form'
import { registerSchema, type RegisterFormData } from '@/lib/validations'
import { authAPI } from '@/lib/api/auth'
import { getApiBaseUrl } from '@/lib/env'
import { createEntrance, pageVariants } from '@/lib/motion'
import { IncelLogo } from '@/components/ui/incel-logo'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

function GoogleButton() {
  const searchParams = useSearchParams()
  const apiBaseUrl = getApiBaseUrl()
  const nextParam = searchParams?.get('next') || '/dashboard'
  const googleLoginUrl = `${apiBaseUrl}/auth/google/login/?next=${encodeURIComponent(nextParam)}`
  
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full flex items-center justify-center"
      onClick={() => {
        window.location.href = googleLoginUrl
      }}
    >
      <svg
        className="w-5 h-5 mr-2 flex-shrink-0 align-middle"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
      <span className="align-middle leading-none">Continue with Google</span>
    </Button>
  )
}

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
    },
  })

  // Redirect if already authenticated
  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession()
      if (session) {
        router.push('/dashboard')
      }
    }
    checkSession()
  }, [router])

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    setError('')

    try {
      // Register the user
      await authAPI.register({
        email: data.email,
        password: data.password,
        full_name: `${data.firstName} ${data.lastName}`,
      })

      toast.success('Registration successful! Logging you in...')
      
      // Automatically log the user in after successful registration
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        // If auto-login fails, redirect to login page
        toast.error('Registration successful, but auto-login failed. Please log in manually.')
        router.push('/login')
      } else {
        // Check if session was created successfully
        const session = await getSession()
        if (session) {
          toast.success('Welcome! Redirecting to dashboard...')
          router.push('/dashboard')
        } else {
          toast.error('Registration successful, but session creation failed. Please log in manually.')
          router.push('/login')
        }
      }
    } catch (error: any) {
      let errorMessage = 'An error occurred during registration'
      
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      } else if (error.response?.data?.email) {
        errorMessage = 'Email already exists'
      } else if (error.response?.data?.password) {
        errorMessage = 'Password does not meet requirements'
      } else if (error.response?.data?.full_name) {
        errorMessage = 'Full name is required'
      }
      
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Suspense fallback={null}>
      <motion.div
        className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
        variants={pageVariants}
        initial="initial"
        animate="animate"
      >
        <motion.div
          className="max-w-md w-full space-y-8"
          variants={createEntrance('up')}
          initial="initial"
          animate="animate"
        >
          {/* Header */}
          <div className="text-center space-y-4">
            <motion.div
              className="flex items-center justify-center mx-auto"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <IncelLogo variant="full" size={180} />
            </motion.div>

            <div className="space-y-2">
              <h1 className="text-h1">INCEL E-Sign</h1>
              <p className="text-body text-gray-600">
                Create your secure digital signature account
              </p>
              <p className="text-sm text-gray-500">
                Fast onboarding • Enterprise-grade security
              </p>
            </div>
          </div>

          {/* Register Card */}
          <Card className="authority-container shadow-xl">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-h2">Create Your Account</CardTitle>
              <CardDescription>
                Start sending and signing documents in minutes
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Alert variant="destructive" className="border-error-200 bg-error-50">
                    <AlertDescription className="text-error-700">
                      {error}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}

              <AuthorityForm onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid grid-cols-2 gap-4">
                  <FormField>
                    <FormLabel required>First Name</FormLabel>
                    <FormInput
                      placeholder="First name"
                      icon={<User className="w-4 h-4" />}
                      validation={form.formState.errors.firstName ? 'invalid' : 'idle'}
                      {...form.register('firstName')}
                    />
                    {form.formState.errors.firstName && (
                      <FormMessage variant="error">
                        {form.formState.errors.firstName.message}
                      </FormMessage>
                    )}
                  </FormField>

                  <FormField>
                    <FormLabel required>Last Name</FormLabel>
                    <FormInput
                      placeholder="Last name"
                      icon={<User className="w-4 h-4" />}
                      validation={form.formState.errors.lastName ? 'invalid' : 'idle'}
                      {...form.register('lastName')}
                    />
                    {form.formState.errors.lastName && (
                      <FormMessage variant="error">
                        {form.formState.errors.lastName.message}
                      </FormMessage>
                    )}
                  </FormField>
                </div>

                <FormField>
                  <FormLabel required>Email Address</FormLabel>
                  <FormInput
                    type="email"
                    placeholder="your@company.com"
                    icon={<Mail className="w-4 h-4" />}
                    validation={form.formState.errors.email ? 'invalid' : 'idle'}
                    {...form.register('email')}
                  />
                  {form.formState.errors.email && (
                    <FormMessage variant="error">
                      {form.formState.errors.email.message}
                    </FormMessage>
                  )}
                </FormField>

                <FormField>
                  <FormLabel required>Password</FormLabel>
                  <FormInput
                    type="password"
                    placeholder="Create a strong password"
                    icon={<Lock className="w-4 h-4" />}
                    validation={form.formState.errors.password ? 'invalid' : 'idle'}
                    {...form.register('password')}
                  />
                  {form.formState.errors.password && (
                    <FormMessage variant="error">
                      {form.formState.errors.password.message}
                    </FormMessage>
                  )}
                </FormField>

                <FormField>
                  <FormLabel required>Confirm Password</FormLabel>
                  <FormInput
                    type="password"
                    placeholder="Re-enter your password"
                    icon={<Lock className="w-4 h-4" />}
                    validation={form.formState.errors.confirmPassword ? 'invalid' : 'idle'}
                    {...form.register('confirmPassword')}
                  />
                  {form.formState.errors.confirmPassword && (
                    <FormMessage variant="error">
                      {form.formState.errors.confirmPassword.message}
                    </FormMessage>
                  )}
                </FormField>

                <AuthorityButton
                  type="submit"
                  size="lg"
                  fullWidth
                  state={isLoading ? 'loading' : 'idle'}
                  loadingText="Creating your account..."
                  disabled={isLoading}
                >
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </AuthorityButton>

                {/* Google OAuth */}
                <div className="space-y-3">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">Or continue with</span>
                    </div>
                  </div>

                  <Suspense fallback={<div className="w-full h-12" />}>
                    <GoogleButton />
                  </Suspense>
                </div>
              </AuthorityForm>

              {/* Footer */}
              <div className="text-center space-y-4">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <a
                    href="/login"
                    className="text-primary hover:text-primary/80 font-medium"
                  >
                    Sign in
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </Suspense>
  )
}
