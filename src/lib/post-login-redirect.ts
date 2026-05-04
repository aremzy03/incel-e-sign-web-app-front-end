/**
 * Safe post-login return paths (open-redirect protection).
 * Only same-origin relative paths starting with "/" are allowed.
 */

export const POST_LOGIN_FALLBACK = '/dashboard'

/**
 * Returns a safe internal path for navigation after login, or `fallback` when invalid.
 */
export function getSafePostLoginPath(
  raw: string | null | undefined,
  fallback: string = POST_LOGIN_FALLBACK
): string {
  if (raw == null || typeof raw !== 'string') {
    return fallback
  }

  const path = raw.trim()
  if (!path || path.includes('\n') || path.includes('\r')) {
    return fallback
  }

  if (!path.startsWith('/') || path.startsWith('//')) {
    return fallback
  }

  if (path.includes('://')) {
    return fallback
  }

  const pathname = path.split('?')[0] ?? path

  if (
    pathname === '/login' ||
    pathname.startsWith('/login/') ||
    pathname === '/register' ||
    pathname.startsWith('/register/')
  ) {
    return fallback
  }

  if (pathname === '/auth' || pathname.startsWith('/auth/')) {
    return fallback
  }

  return path
}

/**
 * Build /login URL with optional `message` and safe `next` query params.
 */
export function buildLoginUrl(options: { next?: string | null; message?: string }): string {
  const params = new URLSearchParams()
  if (options.message) {
    params.set('message', options.message)
  }
  if (options.next != null && String(options.next).length > 0) {
    params.set('next', getSafePostLoginPath(options.next, POST_LOGIN_FALLBACK))
  }
  const qs = params.toString()
  return qs ? `/login?${qs}` : '/login'
}

/**
 * When signing out or forcing re-auth from the browser, preserve current location as `next`.
 */
export function buildLoginUrlFromBrowser(message?: string): string {
  if (typeof window === 'undefined') {
    return message ? buildLoginUrl({ message }) : '/login'
  }

  const candidate = window.location.pathname + (window.location.search || '')
  const safe = getSafePostLoginPath(candidate, POST_LOGIN_FALLBACK)
  if (safe === POST_LOGIN_FALLBACK) {
    return message ? buildLoginUrl({ message }) : '/login'
  }
  return buildLoginUrl({ next: safe, message })
}
