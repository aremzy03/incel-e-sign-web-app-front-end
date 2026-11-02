import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import axios from 'axios'
import { getApiBaseUrl, getNextAuthSecret, getNextAuthUrl } from '@/lib/env'
import {
  ACCESS_TOKEN_REFRESH_BUFFER_MS,
  getAccessTokenExpiresAt,
  REFRESH_TOKEN_LIFETIME_S,
} from '@/lib/auth-utils'

const API_BASE_URL = getApiBaseUrl()

export const authOptions: NextAuthOptions = {
  // Explicitly set the URL so next-auth constructs correct callback/session
  // endpoints in Next.js 15, where automatic host detection can differ.
  ...(getNextAuthUrl() && { url: getNextAuthUrl() }),
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const response = await axios.post(`${API_BASE_URL}/auth/login/`, {
            email: credentials.email,
            password: credentials.password,
          })

          if (response.data.status === 'success' && response.data.data) {
            const { access, refresh } = response.data.data

            try {
              const profileResponse = await axios.get(`${API_BASE_URL}/auth/profile/`, {
                headers: {
                  Authorization: `Bearer ${access}`,
                },
              })

              if (profileResponse.data.status === 'success' && profileResponse.data.data) {
                const userProfile = profileResponse.data.data

                return {
                  id: userProfile.id,
                  email: userProfile.email,
                  name: userProfile.full_name,
                  accessToken: access,
                  refreshToken: refresh,
                  user: userProfile,
                }
              }
            } catch {
              const user = {
                id: 'temp-id',
                email: credentials.email,
                full_name: 'User',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }

              return {
                id: user.id,
                email: user.email,
                name: user.full_name,
                accessToken: access,
                refreshToken: refresh,
                user: user,
              }
            }
          }
        } catch (error: any) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Login error:', error.response?.data || error.message)
          }
          return null
        }

        return null
      },
    }),
    CredentialsProvider({
      id: 'google-jwt',
      name: 'Google JWT',
      credentials: {
        access: { label: 'Access Token', type: 'text' },
        refresh: { label: 'Refresh Token', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.access || !credentials?.refresh) {
          return null
        }

        try {
          const profileResponse = await axios.get(`${API_BASE_URL}/auth/profile/`, {
            headers: {
              Authorization: `Bearer ${credentials.access}`,
            },
          })

          if (profileResponse.data.status === 'success' && profileResponse.data.data) {
            const userProfile = profileResponse.data.data

            return {
              id: userProfile.id,
              email: userProfile.email,
              name: userProfile.full_name,
              accessToken: credentials.access,
              refreshToken: credentials.refresh,
              user: userProfile,
            }
          }
        } catch (error: any) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Google JWT authorize error:', error.response?.data || error.message)
          }
        }

        return null
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        return {
          ...token,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          user: user.user,
          accessTokenExpires: getAccessTokenExpiresAt(user.accessToken),
          error: undefined,
        }
      }

      // If a previous refresh already failed or there is no refresh token,
      // do not keep retrying a dead/blacklisted refresh token on every session check.
      if (token.error === 'RefreshAccessTokenError' || !token.refreshToken) {
        return {
          ...token,
          accessToken: undefined,
          refreshToken: undefined,
          error: 'RefreshAccessTokenError',
        }
      }

      // Prefer the real access JWT exp so older sessions with a wrong
      // accessTokenExpires value still refresh at the correct time.
      const expiresAt = token.accessToken
        ? getAccessTokenExpiresAt(String(token.accessToken))
        : typeof token.accessTokenExpires === 'number'
          ? token.accessTokenExpires
          : 0

      if (Date.now() < expiresAt - ACCESS_TOKEN_REFRESH_BUFFER_MS) {
        return token
      }

      const refreshedToken = await refreshAccessToken(token)

      if (refreshedToken === null) {
        return {
          ...token,
          accessToken: undefined,
          refreshToken: undefined,
          accessTokenExpires: 0,
          error: 'RefreshAccessTokenError',
        }
      }

      return refreshedToken
    },
    async session({ session, token }) {
      if (token) {
        session.user = token.user
        session.accessToken = token.accessToken
        session.refreshToken = token.refreshToken
        session.error = token.error
      }

      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    // Keep the NextAuth session cookie alive for the full refresh-token lifetime.
    maxAge: REFRESH_TOKEN_LIFETIME_S,
  },
  secret: getNextAuthSecret(),
}

const RECENT_REFRESH_TTL_MS = 15_000
const recentRefreshes = new Map<string, { result: any; expiresAt: number }>()

let inFlightRefresh: Promise<any> | null = null
let inFlightRefreshKey: string | null = null

async function refreshAccessToken(token: any) {
  const refreshToken = token.refreshToken as string | undefined
  if (!refreshToken) return null

  const now = Date.now()
  for (const [key, entry] of recentRefreshes.entries()) {
    if (entry.expiresAt <= now) {
      recentRefreshes.delete(key)
    }
  }

  // If a sibling request rotated this refresh token within the last few seconds
  // before the browser applied the updated Set-Cookie, reuse that rotated result.
  const cached = recentRefreshes.get(refreshToken)
  if (cached && cached.expiresAt > now) {
    return {
      ...token,
      ...cached.result,
    }
  }

  // Dedupe concurrent refreshes (e.g. refetchInterval + 401 retry) so rotation
  // does not blacklist the token still held by a sibling request.
  if (inFlightRefresh && inFlightRefreshKey === refreshToken) {
    return inFlightRefresh
  }

  inFlightRefreshKey = refreshToken
  inFlightRefresh = (async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
        refresh: refreshToken,
      })

      if (response.data.access) {
        const accessToken = response.data.access as string
        const refreshedFields = {
          accessToken,
          // Backend rotates refresh tokens; always prefer the new one when present.
          refreshToken: response.data.refresh || refreshToken,
          accessTokenExpires: getAccessTokenExpiresAt(accessToken),
          error: undefined,
        }
        recentRefreshes.set(refreshToken, {
          result: refreshedFields,
          expiresAt: Date.now() + RECENT_REFRESH_TTL_MS,
        })
        return {
          ...token,
          ...refreshedFields,
        }
      }

      throw new Error('Invalid refresh response')
    } catch (error: any) {
      if (
        error.response?.data?.code === 'token_not_valid' ||
        error.response?.data?.detail?.includes('blacklisted') ||
        error.response?.status === 401
      ) {
        return null
      }

      if (process.env.NODE_ENV === 'development') {
        console.error('Token refresh error:', error.message || error)
      }

      return {
        ...token,
        error: 'RefreshAccessTokenError',
      }
    } finally {
      inFlightRefresh = null
      inFlightRefreshKey = null
    }
  })()

  return inFlightRefresh
}
