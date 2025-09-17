import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
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

          const { access_token, refresh_token, user } = response.data

          if (access_token && user) {
            return {
              id: user.id,
              email: user.email,
              name: `${user.first_name} ${user.last_name}`,
              accessToken: access_token,
              refreshToken: refresh_token,
              user: user,
            }
          }
        } catch (error) {
          console.error('Login error:', error)
          return null
        }

        return null
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          user: user.user,
          accessTokenExpires: Date.now() + 15 * 60 * 1000, // 15 minutes
        }
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < token.accessTokenExpires) {
        return token
      }

      // Access token has expired, try to update it
      return await refreshAccessToken(token)
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
  },
  secret: process.env.NEXTAUTH_SECRET,
}

async function refreshAccessToken(token: any) {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
      refresh: token.refreshToken,
    })

    const { access_token } = response.data

    return {
      ...token,
      accessToken: access_token,
      accessTokenExpires: Date.now() + 15 * 60 * 1000, // 15 minutes
    }
  } catch (error) {
    console.error('Token refresh error:', error)
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    }
  }
}

export default NextAuth(authOptions)
