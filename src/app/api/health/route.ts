import { NextResponse } from 'next/server'
import { getBackendHealthUrl, isHealthCheckBackendEnabled } from '@/lib/env'

/**
 * Health check endpoint for monitoring
 * Returns 200 if service is healthy
 */
export async function GET() {
  try {
    // Basic health check - service is running
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'incel-esign-frontend',
      version: process.env.npm_package_version || 'unknown',
    }

    // Optional: Check backend connectivity
    if (isHealthCheckBackendEnabled()) {
      try {
        const backendHealthUrl = getBackendHealthUrl()
        const response = await fetch(backendHealthUrl, {
          method: 'GET',
          signal: AbortSignal.timeout(5000), // 5 second timeout
        })
        
        if (!response.ok) {
          return NextResponse.json(
            {
              ...health,
              status: 'degraded',
              backend: {
                status: 'unhealthy',
                error: `Backend returned ${response.status}`,
              },
            },
            { status: 503 }
          )
        }

        return NextResponse.json({
          ...health,
          backend: {
            status: 'healthy',
          },
        })
      } catch (error) {
        return NextResponse.json(
          {
            ...health,
            status: 'degraded',
            backend: {
              status: 'unreachable',
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          },
          { status: 503 }
        )
      }
    }

    return NextResponse.json(health)
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

