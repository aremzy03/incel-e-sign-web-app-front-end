export interface CachedAuthSession {
  accessToken: string | null
  refreshToken: string | null
  error: string | null
}

let cachedSession: CachedAuthSession = {
  accessToken: null,
  refreshToken: null,
  error: null,
}

export function setAuthSession(session: CachedAuthSession) {
  cachedSession = session
}

export function clearAuthSession() {
  cachedSession = {
    accessToken: null,
    refreshToken: null,
    error: null,
  }
}

export function getCachedAccessToken(): string | null {
  return cachedSession.accessToken
}

export function getCachedRefreshToken(): string | null {
  return cachedSession.refreshToken
}

export function getCachedSessionError(): string | null {
  return cachedSession.error
}

export function hasRefreshAccessTokenError(): boolean {
  return cachedSession.error === 'RefreshAccessTokenError'
}
