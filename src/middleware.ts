import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getNextAuthSecret } from '@/lib/env'
import { getSafePostLoginPath, POST_LOGIN_FALLBACK } from '@/lib/post-login-redirect'

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  if (!pathname.startsWith('/dashboard')) {
    return NextResponse.next()
  }

  const token = await getToken({
    req: request,
    secret: getNextAuthSecret(),
  })

  const fullPath = pathname + (search || '')

  if (!token?.accessToken) {
    const login = request.nextUrl.clone()
    login.pathname = '/login'
    login.search = ''
    login.searchParams.set('next', getSafePostLoginPath(fullPath, POST_LOGIN_FALLBACK))
    return NextResponse.redirect(login)
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-return-path', fullPath)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
