'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'react-hot-toast'
import { useState } from 'react'
import { SessionMonitor } from './SessionMonitor'
import { SessionTokenSync } from './SessionTokenSync'
import { ErrorBoundary } from './ErrorBoundary'
import { ThemeProvider } from './theme-provider'
import { MotionConfig } from 'framer-motion'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
            // A Nigeria↔US round trip is expensive. Don't repeat it on every alt-tab.
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <ErrorBoundary>
      <ThemeProvider>
      {/* Honour the OS reduced-motion setting in every framer-motion component. */}
      <MotionConfig reducedMotion="user">
      <SessionProvider
        refetchOnWindowFocus={false}
        // Re-evaluate the JWT periodically so silent refresh can run before access expiry.
        refetchInterval={5 * 60}
      >
        <QueryClientProvider client={queryClient}>
          <SessionTokenSync />
          <SessionMonitor />
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--color-inverse-surface)',
                color: 'var(--color-inverse-on-surface)',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: 'var(--color-success)',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: 'var(--color-error)',
                  secondary: '#fff',
                },
              },
            }}
          />
        </QueryClientProvider>
      </SessionProvider>
      </MotionConfig>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
