'use client'

import { useState, useEffect } from 'react'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-hot-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { InputWithIcon } from '@/components/ui/input-with-icon'
import { loginSchema, type LoginFormData } from '@/lib/validations'

export default function LoginPage() {
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // Redirect if already authenticated with valid session
  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession()
      if (session?.accessToken) {
        // Check if token is valid (not expired)
        try {
          const payload = JSON.parse(atob(session.accessToken.split('.')[1]))
          const currentTime = Math.floor(Date.now() / 1000)
          
          // Only redirect if token is valid and not expired
          if (payload.exp > currentTime) {
            router.push('/dashboard')
          }
        } catch (error) {
          console.error('Error checking token validity:', error)
          // Don't redirect if we can't parse the token
        }
      }
    }
    checkSession()
  }, [router])

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
        // Check if session was created successfully
        const session = await getSession()
        if (session) {
          toast.success('Welcome back!')
          router.push('/dashboard')
        } else {
          setError('Login failed - no session created')
          toast.error('Login failed - no session created')
        }
      }
    } catch (error) {
      setError('An error occurred during login')
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 bg-primary rounded-full flex items-center justify-center mb-4">
              <span className="text-primary-foreground text-xl font-bold">I</span>
            </div>
            <CardTitle className="text-2xl font-bold">Incel eSign</CardTitle>
            <CardDescription className="text-gray-600">
              Login to your account
            </CardDescription>
            <p className="text-sm text-gray-500 mt-2">
              Securely sign and manage documents
            </p>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <InputWithIcon
                          icon="✉️"
                          placeholder="Enter your email"
                          type="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <InputWithIcon
                          icon="🔒"
                          placeholder="Enter your password"
                          type="password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don&apos;t have an account?{' '}
                <a
                  href="/register"
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  Register
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
