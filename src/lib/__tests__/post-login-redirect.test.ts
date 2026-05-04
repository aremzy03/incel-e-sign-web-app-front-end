import { POST_LOGIN_FALLBACK, buildLoginUrl, getSafePostLoginPath } from '../post-login-redirect'

describe('getSafePostLoginPath', () => {
  it('allows internal paths', () => {
    expect(getSafePostLoginPath('/dashboard/documents', '/x')).toBe('/dashboard/documents')
    expect(getSafePostLoginPath('/dashboard?tab=1', '/x')).toBe('/dashboard?tab=1')
  })

  it('rejects open redirects and non-paths', () => {
    expect(getSafePostLoginPath('//evil.com', '/x')).toBe('/x')
    expect(getSafePostLoginPath('https://evil.com', '/x')).toBe('/x')
    expect(getSafePostLoginPath('not-relative', '/x')).toBe('/x')
  })

  it('blocks auth entry routes', () => {
    expect(getSafePostLoginPath('/login', '/x')).toBe('/x')
    expect(getSafePostLoginPath('/login?next=/dashboard', '/x')).toBe('/x')
    expect(getSafePostLoginPath('/register', '/x')).toBe('/x')
    expect(getSafePostLoginPath('/auth/google/callback', '/x')).toBe('/x')
  })

  it('uses default dashboard fallback', () => {
    expect(getSafePostLoginPath(null)).toBe(POST_LOGIN_FALLBACK)
  })
})

describe('buildLoginUrl', () => {
  it('builds login URL with message and next', () => {
    const u = buildLoginUrl({ message: 'session_expired', next: '/dashboard/inbox' })
    expect(u.startsWith('/login?')).toBe(true)
    expect(u).toMatch(/message=session_expired/)
    expect(u).toMatch(/next=%2Fdashboard%2Finbox/)
  })
})
