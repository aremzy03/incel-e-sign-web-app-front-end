'use client'

import { usePathname } from 'next/navigation'
import { Navigation } from '@/components/navigation'

const HIDE_NAV_PREFIXES = ['/login', '/register', '/auth']

export function NavigationGate() {
  const pathname = usePathname() || '/'

  const shouldHide = HIDE_NAV_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'))
  if (shouldHide) return null

  return <Navigation />
}

