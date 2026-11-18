import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { NavigationGate } from '@/components/navigation-gate'

// Authority Design System Fonts
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

// Using Inter for both headings and body

export const metadata: Metadata = {
  title: 'INCEL E-Sign',
  description: 'Incel Group’s system for preparing, sending and signing its own agreements.',
  applicationName: 'INCEL E-Sign',
  creator: 'Incel Group',
  publisher: 'Incel Group',
  icons: {
    icon: '/favicon.png',
  },
  openGraph: {
    title: 'INCEL E-Sign',
    description: 'Incel Group’s system for preparing, sending and signing its own agreements.',
    siteName: 'INCEL E-Sign',
    type: 'website',
  },
  // Internal tool: signing links are shared privately, never meant for search results.
  robots: {
    index: false,
    follow: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable}`} suppressHydrationWarning>
      <body className="font-body antialiased bg-background text-foreground">
        <Providers>
          <div className="min-h-screen bg-bg">
            <NavigationGate />
            <div className="flex-1">
              {children}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  )
}
