import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

export const useAuth = () => {
  const { data: session, status } = useSession()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (status === 'loading') {
      setIsReady(false)
    } else if (status === 'authenticated' && session?.accessToken) {
      setIsReady(true)
    } else if (status === 'unauthenticated') {
      setIsReady(false)
    }
  }, [session, status])

  return {
    session,
    status,
    isReady,
    isAuthenticated: status === 'authenticated' && !!session?.accessToken,
  }
}
