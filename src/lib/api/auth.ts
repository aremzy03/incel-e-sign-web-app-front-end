import axios from 'axios'
import apiClient from '@/lib/axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

// Types for authentication
export interface RegisterRequest {
  email: string
  password: string
  full_name: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  status: string
  message: string
  data: {
    access: string
    refresh: string
  }
}

export interface ProfileResponse {
  id: string
  email: string
  full_name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface RefreshTokenRequest {
  refresh: string
}

export interface RefreshTokenResponse {
  status: string
  message: string
  data: {
    access: string
  }
}

// API functions
export const authAPI = {
  // Register a new user
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await axios.post(`${API_BASE_URL}/auth/register/`, data)
    return response.data
  },

  // Login user
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await axios.post(`${API_BASE_URL}/auth/login/`, data)
    return response.data
  },

  // Logout user (blacklist token)
  async logout(refreshToken: string): Promise<void> {
    await apiClient.post('/auth/logout/', {
      refresh: refreshToken,
    })
  },

  // Get user profile
  async getProfile(accessToken: string): Promise<ProfileResponse> {
    const response = await axios.get(`${API_BASE_URL}/auth/profile/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    
    // Handle the actual backend response format
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data
    }
    
    throw new Error('Invalid profile response')
  },

  // Refresh access token
  async refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, data)
    return response.data
  },
}
