import { authAPI } from '@/lib/api/auth'

// Mock axios
jest.mock('axios', () => {
  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  }
  return {
    post: jest.fn(),
    get: jest.fn(),
    create: jest.fn(() => mockAxiosInstance),
  }
})

describe('Authentication API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('authAPI.register', () => {
    it('calls the correct endpoint with correct data', async () => {
      const mockAxios = require('axios')
      const mockResponse = {
        data: {
          status: 'success',
          message: 'Registered successfully',
          data: {
            id: '1',
            email: 'test@example.com',
            full_name: 'Test User',
            is_active: true,
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z',
          },
        },
      }
      mockAxios.post.mockResolvedValueOnce(mockResponse)

      const result = await authAPI.register({
        email: 'test@example.com',
        password: 'password123',
        full_name: 'Test User',
      })

      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/auth/register/'),
        {
          email: 'test@example.com',
          password: 'password123',
          full_name: 'Test User',
        }
      )
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('authAPI.login', () => {
    it('calls the correct endpoint with correct data', async () => {
      const mockAxios = require('axios')
      const mockResponse = {
        data: {
          access_token: 'access_token',
          refresh_token: 'refresh_token',
          user: {
            id: '1',
            email: 'test@example.com',
            full_name: 'Test User',
            role: 'user',
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z',
          },
        },
      }
      mockAxios.post.mockResolvedValueOnce(mockResponse)

      const result = await authAPI.login({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login/'),
        {
          email: 'test@example.com',
          password: 'password123',
        }
      )
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('authAPI.getProfile', () => {
    it('calls the correct endpoint with authorization header', async () => {
      const mockAxios = require('axios')
      const mockResponse = {
        data: {
          status: 'success',
          data: {
            id: '1',
            email: 'test@example.com',
            full_name: 'Test User',
            is_active: true,
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z',
          },
        },
      }
      mockAxios.get.mockResolvedValueOnce(mockResponse)

      const result = await authAPI.getProfile('access_token')

      expect(mockAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/auth/profile/'),
        {
          headers: {
            Authorization: 'Bearer access_token',
          },
        }
      )
      expect(result).toEqual(mockResponse.data.data)
    })
  })

  describe('authAPI.refreshToken', () => {
    it('calls the correct endpoint with refresh token', async () => {
      const mockAxios = require('axios')
      const mockResponse = {
        data: {
          access: 'new_access_token',
        },
      }
      mockAxios.post.mockResolvedValueOnce(mockResponse)

      const result = await authAPI.refreshToken({
        refresh: 'refresh_token',
      })

      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/auth/token/refresh/'),
        {
          refresh: 'refresh_token',
        }
      )
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('authAPI.logout', () => {
    it('calls the correct endpoint with refresh token', async () => {
      const mockAxios = require('axios')
      const mockApi = (mockAxios.create as jest.Mock).mock.results[0]?.value || (mockAxios.create as jest.Mock)()
      mockApi.post.mockResolvedValueOnce({})

      await authAPI.logout('refresh_token')

      expect(mockApi.post).toHaveBeenCalledWith(
        expect.stringContaining('/auth/logout/'),
        {
          refresh: 'refresh_token',
        }
      )
    })
  })
})
