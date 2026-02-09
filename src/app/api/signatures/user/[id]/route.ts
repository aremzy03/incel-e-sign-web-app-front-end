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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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
  const targetUrl = `${API_BASE_URL}/signatures/user/${id}/`

  try {
    const response = await fetch(targetUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.accessToken}`,
      },
    })

    // Handle 204 No Content as success
    if (response.status === 204) {
      return NextResponse.json(
        { status: 'success', message: 'Signature deleted successfully' },
        {
          status: 200,
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

    const text = await response.text()
    let data: any
    try {
      data = JSON.parse(text)
    } catch {
      data = {
        error: 'Server returned non-JSON response',
        ...(isProduction()
          ? {}
          : {
              detail: text.substring(0, 200),
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
        ? 'Failed to delete signature'
        : (error as Error).message || 'Failed to delete signature'

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




