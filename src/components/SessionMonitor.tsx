'use client'

import { useSessionMonitor } from '@/hooks/useSessionMonitor'

/**
 * SessionMonitor component that monitors the session for token refresh errors
 * and automatically logs out the user when such errors occur.
 */
export function SessionMonitor() {
  // This hook handles all the session monitoring logic
  useSessionMonitor()
  
  // This component doesn't render anything visible
  return null
}
