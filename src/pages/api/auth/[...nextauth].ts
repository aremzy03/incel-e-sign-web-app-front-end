import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api'

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
          
          // Handle the actual backend response format
          if (response.data.status === 'success' && response.data.data) {
            const { access, refresh } = response.data.data
            
            // Fetch user profile using the access token
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
            } catch (profileError) {
              console.error('Failed to fetch user profile:', profileError)
              // Fallback to basic user object
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
          console.error('Login error:', error.response?.data || error.message)
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
          accessTokenExpires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        }
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < token.accessTokenExpires) {
        return token
      }

      // Access token has expired, try to update it
      const refreshedToken = await refreshAccessToken(token)
      
      // If refresh failed (token blacklisted), return error token to force re-authentication
      if (refreshedToken === null) {
        return {
          ...token,
          error: 'RefreshAccessTokenError'
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
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  },
  secret: process.env.NEXTAUTH_SECRET,
}

async function refreshAccessToken(token: any) {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
      refresh: token.refreshToken,
    })

    
    // Handle the actual backend response format - direct access/refresh tokens
    if (response.data.access) {
      return {
        ...token,
        accessToken: response.data.access,
        refreshToken: response.data.refresh || token.refreshToken,
        accessTokenExpires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      }
    }
    
    throw new Error('Invalid refresh response')
  } catch (error: any) {
    console.error('Token refresh error:', error)
    
    // If token is blacklisted or invalid, return null to force re-authentication
    if (error.response?.data?.code === 'token_not_valid' || 
        error.response?.data?.detail?.includes('blacklisted') ||
        error.response?.status === 401) {
      console.log('Token is blacklisted or invalid, forcing re-authentication')
      return null
    }
    
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    }
  }
}

export default NextAuth(authOptions)
