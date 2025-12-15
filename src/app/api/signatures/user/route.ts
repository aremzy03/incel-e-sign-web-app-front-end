import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { getApiBaseUrl, getAllowedOrigins, isProduction } from '@/lib/env'

const API_BASE_URL = getApiBaseUrl()

function getAllowedOrigin(request: NextRequest): string | undefined {
  const allowedOrigins = getAllowedOrigins()
  const origin = request.headers.get('origin')

  // In development, allow all origins
  if (!isProduction()) {
    return origin || '*'
  }

  if (origin && allowedOrigins.includes(origin)) {
    return origin
  }

  return allowedOrigins[0]
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  const allowedOrigin = getAllowedOrigin(request)

  if (!session?.accessToken) {
    return NextResponse.json(
      { detail: 'Unauthorized' },
      {
        status: 401,
        headers: {
          ...(allowedOrigin && {
            'Access-Control-Allow-Origin': allowedOrigin,
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Credentials': 'true',
          }),
        },
      }
    )
  }

  const targetUrl = `${API_BASE_URL}/signatures/user/`

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.accessToken}`,
      },
    })

    const text = await response.text()
    let data: any
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        ...(allowedOrigin && {
          'Access-Control-Allow-Origin': allowedOrigin,
          'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true',
        }),
      },
    })
  } catch (error) {
    const errorMessage =
      isProduction() && !(error instanceof Error)
        ? 'Failed to fetch signatures'
        : (error as Error).message || 'Failed to fetch signatures'

    return NextResponse.json(
      { error: errorMessage },
      {
        status: 500,
        headers: {
          ...(allowedOrigin && {
            'Access-Control-Allow-Origin': allowedOrigin,
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Credentials': 'true',
          }),
        },
      }
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  const allowedOrigin = getAllowedOrigin(request)

  if (!session?.accessToken) {
    return NextResponse.json(
      { detail: 'Unauthorized' },
      {
        status: 401,
        headers: {
          ...(allowedOrigin && {
            'Access-Control-Allow-Origin': allowedOrigin,
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Credentials': 'true',
          }),
        },
      }
    )
  }

  const targetUrl = `${API_BASE_URL}/signatures/user/`

  try {
    const contentType = request.headers.get('content-type') || ''
    let response: Response

    if (contentType.includes('multipart/form-data')) {
      // Rebuild FormData to ensure correct multipart boundary
      const incomingForm = await request.formData()
      const outgoingForm = new FormData()

      Array.from(incomingForm.entries()).forEach(([key, value]) => {
        if (typeof value === 'object' && value && 'name' in value && 'size' in value) {
          outgoingForm.append(key, value as any, (value as any).name)
        } else {
          outgoingForm.append(key, String(value))
        }
      })

      response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: outgoingForm,
      })
    } else {
      const bodyText = await request.text()
      response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': contentType || 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: bodyText || undefined,
      })
    }

    const responseText = await response.text()
    let data: any
    try {
      data = JSON.parse(responseText)
    } catch {
      data = {
        error: 'Server returned non-JSON response',
        ...(isProduction()
          ? {}
          : {
              detail: responseText.substring(0, 200),
              status: response.status,
              statusText: response.statusText,
            }),
      }
    }

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        ...(allowedOrigin && {
          'Access-Control-Allow-Origin': allowedOrigin,
          'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true',
        }),
      },
    })
  } catch (error) {
    const errorMessage =
      isProduction() && !(error instanceof Error)
        ? 'Failed to upload signature'
        : (error as Error).message || 'Failed to upload signature'

    return NextResponse.json(
      { error: errorMessage },
      {
        status: 500,
        headers: {
          ...(allowedOrigin && {
            'Access-Control-Allow-Origin': allowedOrigin,
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Credentials': 'true',
          }),
        },
      }
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
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
      }),
    },
  })
}




