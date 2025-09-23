'use client'

import { useState } from 'react'
import { testBackendConnection, testLoginEndpoint } from '@/lib/api/test-backend'

export default function DebugAuthPage() {
  const [backendTest, setBackendTest] = useState<any>(null)
  const [loginTest, setLoginTest] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testBackend = async () => {
    setLoading(true)
    const result = await testBackendConnection()
    setBackendTest(result)
    setLoading(false)
  }

  const testLogin = async () => {
    setLoading(true)
    const result = await testLoginEndpoint()
    setLoginTest(result)
    setLoading(false)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug Page</h1>
      
      <div className="space-y-6">
        <div className="border p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Environment Variables</h2>
          <div className="space-y-2 text-sm">
            <p><strong>NEXT_PUBLIC_API_URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'Not set'}</p>
            <p><strong>NEXTAUTH_URL:</strong> {process.env.NEXTAUTH_URL || 'Not set'}</p>
            <p><strong>NEXTAUTH_SECRET:</strong> {process.env.NEXTAUTH_SECRET ? 'Set' : 'Not set'}</p>
          </div>
        </div>

        <div className="border p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Backend Connection Test</h2>
          <button 
            onClick={testBackend}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Backend Connection'}
          </button>
          
          {backendTest && (
            <div className="mt-4 p-3 bg-gray-100 rounded">
              <h3 className="font-semibold">Result:</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(backendTest, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="border p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Login Endpoint Test</h2>
          <button 
            onClick={testLogin}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Login Endpoint'}
          </button>
          
          {loginTest && (
            <div className="mt-4 p-3 bg-gray-100 rounded">
              <h3 className="font-semibold">Result:</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(loginTest, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

