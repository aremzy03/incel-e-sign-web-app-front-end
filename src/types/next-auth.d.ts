import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      full_name: string
      is_active: boolean
      created_at: string
      updated_at: string
    }
    accessToken: string
    refreshToken: string
    error?: string
  }

  interface User {
    id: string
    email: string
    name: string
    accessToken: string
    refreshToken: string
    user: {
      id: string
      email: string
      full_name: string
      is_active: boolean
      created_at: string
      updated_at: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken: string
    refreshToken: string
    accessTokenExpires: number
    user: {
      id: string
      email: string
      full_name: string
      is_active: boolean
      created_at: string
      updated_at: string
    }
    error?: string
  }
}
