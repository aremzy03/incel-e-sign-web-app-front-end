import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getAllowedOrigins, getServerApiBaseUrl, isDevelopment, isProduction } from '@/lib/env'

const API_BASE_URL = getServerApiBaseUrl()

function getAllowedOrigin(request: NextRequest): string | undefined {
  const allowedOrigins = getAllowedOrigins()
  const origin = request.headers.get('origin')

  if (!isProduction()) {
    return origin || '*'
  }

  if (origin && allowedOrigins.includes(origin)) {
    return origin
  }

  return allowedOrigins[0]
}

const PROXY_SIGN_TIMEOUT_MS = 30_000

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ envelopeId: string }> },
) {
  const { envelopeId } = await params
  const session = await getServerSession(authOptions)
  const allowedOrigin = getAllowedOrigin(request)

  if (!session?.accessToken) {
    return NextResponse.json(
      { status: 'error', message: 'Unauthorized' },
      {
        status: 401,
        headers: {
          ...(allowedOrigin && {
            'Access-Control-Allow-Origin': allowedOrigin,
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Credentials': 'true',
          }),
        },
      },
    )
  }

  const targetUrl = `${API_BASE_URL}/signatures/${encodeURIComponent(envelopeId)}/sign/`

  try {
    const bodyText = await request.text()

    if (isDevelopment()) {
      console.info('[sign proxy] POST', targetUrl, bodyText || '{}')
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), PROXY_SIGN_TIMEOUT_MS)

    let response: Response
    try {
      response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: bodyText || '{}',
        signal: controller.signal,
      })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return NextResponse.json(
          {
            status: 'error',
            message:
              'Signing request timed out while contacting the backend. Check that Django is running and reachable.',
          },
          { status: 504, headers: { ...(allowedOrigin && { 'Access-Control-Allow-Origin': allowedOrigin }) } },
        )
      }
      throw error
    } finally {
      clearTimeout(timeoutId)
    }

    const responseText = await response.text()
    let data: unknown
    try {
      data = JSON.parse(responseText)
    } catch {
      data = {
        status: 'error',
        message: 'Server returned non-JSON response',
        ...(isProduction()
          ? {}
          : {
              detail: responseText.substring(0, 200),
              httpStatus: response.status,
              statusText: response.statusText,
            }),
      }
    }

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        ...(allowedOrigin && {
          'Access-Control-Allow-Origin': allowedOrigin,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true',
        }),
      },
    })
  } catch (error) {
    const errorMessage =
      isProduction() && !(error instanceof Error)
        ? 'Failed to sign envelope'
        : (error as Error).message || 'Failed to sign envelope'

    return NextResponse.json(
      { status: 'error', message: errorMessage },
      {
        status: 500,
        headers: {
          ...(allowedOrigin && {
            'Access-Control-Allow-Origin': allowedOrigin,
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Credentials': 'true',
          }),
        },
      },
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  const allowedOrigin = getAllowedOrigin(request)

  return new NextResponse(null, {
    status: 200,
    headers: {
      ...(allowedOrigin && {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
      }),
    },
  })
}
