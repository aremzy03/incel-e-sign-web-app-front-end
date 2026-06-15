import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import axios from 'axios'
import { getApiBaseUrl, getNextAuthSecret, getNextAuthUrl } from '@/lib/env'

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
          accessTokenExpires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        }
      }

      if (Date.now() < token.accessTokenExpires) {
        return token
      }

      const refreshedToken = await refreshAccessToken(token)

      if (refreshedToken === null) {
        return {
          ...token,
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
    maxAge: 7 * 24 * 60 * 60,
  },
  secret: getNextAuthSecret(),
}

async function refreshAccessToken(token: any) {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
      refresh: token.refreshToken,
    })

    if (response.data.access) {
      return {
        ...token,
        accessToken: response.data.access,
        refreshToken: response.data.refresh || token.refreshToken,
        accessTokenExpires: Date.now() + 7 * 24 * 60 * 60 * 1000,
      }
    }

    throw new Error('Invalid refresh response')
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Token refresh error:', error)
    }

    if (
      error.response?.data?.code === 'token_not_valid' ||
      error.response?.data?.detail?.includes('blacklisted') ||
      error.response?.status === 401
    ) {
      return null
    }

    return {
      ...token,
      error: 'RefreshAccessTokenError',
    }
  }
}
