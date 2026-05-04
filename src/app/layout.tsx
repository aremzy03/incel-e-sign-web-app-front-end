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
  title: 'INCEL E-Sign - Legal Authority in Digital Signatures',
  description: 'Award-winning e-signature platform designed for legal confidence and professional document management with enterprise-grade security.',
  keywords: ['e-signature', 'digital signatures', 'legal documents', 'DocuSign alternative', 'enterprise signing'],
  authors: [{ name: 'INCEL E-Sign Team' }],
  creator: 'INCEL E-Sign',
  publisher: 'INCEL E-Sign',
  icons: {
    icon: '/E%20sign%20logo.svg',
  },
  openGraph: {
    title: 'INCEL E-Sign - Legal Authority in Digital Signatures',
    description: 'Professional e-signature platform with legal confidence and enterprise security',
    siteName: 'INCEL E-Sign',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'INCEL E-Sign - Legal Authority in Digital Signatures',
    description: 'Professional e-signature platform with legal confidence and enterprise security',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="font-body antialiased bg-background text-foreground">
        <Providers>
          <div className="min-h-screen bg-gray-50">
            <NavigationGate />
            <main className="flex-1">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
