import axios from 'axios'
import { getApiBaseUrl } from '@/lib/env'

const API_BASE_URL = getApiBaseUrl()

export async function testBackendConnection() {
  try {
    console.log('Testing backend connection to:', API_BASE_URL)
    
    // Test if the backend is reachable
    const response = await axios.get(`${API_BASE_URL}/auth/profile/`, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    console.log('Backend response:', response.status)
    return { success: true, status: response.status }
  } catch (error: any) {
    console.error('Backend connection test failed:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url
    })
    return { 
      success: false, 
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    }
  }
}

export async function testLoginEndpoint() {
  try {
    console.log('Testing login endpoint:', `${API_BASE_URL}/auth/login/`)
    
    const response = await axios.post(`${API_BASE_URL}/auth/login/`, {
      email: 'test@example.com',
      password: 'testpassword',
    }, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    console.log('Login endpoint response:', response.status, response.data)
    return { success: true, status: response.status, data: response.data }
  } catch (error: any) {
    console.error('Login endpoint test failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url
    })
    return { 
      success: false, 
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    }
  }
}

