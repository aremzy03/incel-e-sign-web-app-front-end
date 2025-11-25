import { NextRequest, NextResponse } from 'next/server'
import { getApiBaseUrl, getAllowedOrigins, isProduction } from '@/lib/env'

const API_BASE_URL = getApiBaseUrl()

// Get allowed origins for CORS
function getAllowedOrigin(request: NextRequest): string {
  const allowedOrigins = getAllowedOrigins()
  const origin = request.headers.get('origin')
  
  // In development, allow all origins
  if (!isProduction()) {
    return origin || '*'
  }
  
  // In production, check if origin is allowed
  if (origin && allowedOrigins.includes(origin)) {
    return origin
  }
  
  // Default to first allowed origin or deny
  return allowedOrigins[0] || ''
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/')
  const url = new URL(request.url)
  const searchParams = url.searchParams.toString()
  const queryString = searchParams ? `?${searchParams}` : ''
  const hadTrailingSlash = request.nextUrl.pathname.endsWith('/')
  
  const targetUrl = `${API_BASE_URL}/${path}${hadTrailingSlash ? '/' : ''}${queryString}`
  
  const allowedOrigin = getAllowedOrigin(request)
  
  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || '',
      },
    })
    
    // Check if this is a download request (binary data)
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/pdf') || path.includes('/download')) {
      const buffer = await response.arrayBuffer()
      return new NextResponse(buffer, {
        status: response.status,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': response.headers.get('content-disposition') || '',
          ...(allowedOrigin && {
            'Access-Control-Allow-Origin': allowedOrigin,
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Credentials': 'true',
          }),
        },
      })
    }
    
    // Try to parse JSON; fall back to text for HTML error pages
    let data: any
    const raw = await response.text()
    try {
      data = JSON.parse(raw)
    } catch {
      data = raw
    }

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        ...(allowedOrigin && {
          'Access-Control-Allow-Origin': allowedOrigin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true',
        }),
      },
    })
  } catch (error) {
    const errorMessage = isProduction() 
      ? 'Failed to fetch data' 
      : error instanceof Error ? error.message : 'Failed to fetch data'
    
    return NextResponse.json(
      { error: errorMessage },
      { 
        status: 500,
        headers: {
          ...(allowedOrigin && {
            'Access-Control-Allow-Origin': allowedOrigin,
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Credentials': 'true',
          }),
        },
      }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/')
  // Django with APPEND_SLASH requires trailing slash on POST endpoints
  const targetUrl = `${API_BASE_URL}/${path}/`
  const allowedOrigin = getAllowedOrigin(request)
  
  try {
    const contentType = request.headers.get('content-type') || ''
    const authHeader = request.headers.get('authorization') || ''
    let response: Response

    if (contentType.includes('multipart/form-data')) {
      // Rebuild FormData to ensure a correct multipart boundary is generated
      const incomingForm = await request.formData()
      
      const outgoingForm = new FormData()
      Array.from(incomingForm.entries()).forEach(([key, value]) => {
        if (typeof value === 'object' && value && 'name' in value && 'size' in value) {
          outgoingForm.append(key, value as any, (value as any).name)
        } else {
          outgoingForm.append(key, String(value))
        }
      })
      
      try {
        response = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            // Do not set Content-Type; let fetch set proper multipart boundary
            Authorization: authHeader,
          },
          body: outgoingForm,
        })
      } catch (fetchError) {
        throw fetchError
      }
    } else {
      const textBody = await request.text()
      response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': contentType || 'application/json',
          Authorization: authHeader,
        },
        body: textBody || undefined,
      })
    }
    
    let data: any
    const responseText = await response.text()
    
    try {
      data = JSON.parse(responseText)
    } catch (jsonError) {
      data = {
        error: 'Server returned non-JSON response',
        ...(isProduction() ? {} : {
          detail: responseText.substring(0, 200),
          status: response.status,
          statusText: response.statusText
        }),
      }
    }
    
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        ...(allowedOrigin && {
          'Access-Control-Allow-Origin': allowedOrigin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true',
        }),
      },
    })
  } catch (error) {
    const errorMessage = isProduction() 
      ? 'Failed to fetch data' 
      : error instanceof Error ? error.message : 'Failed to fetch data'
    
    return NextResponse.json(
      { error: errorMessage },
      { 
        status: 500,
        headers: {
          ...(allowedOrigin && {
            'Access-Control-Allow-Origin': allowedOrigin,
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Credentials': 'true',
          }),
        },
      }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/')
  // Django with APPEND_SLASH requires trailing slash on DELETE endpoints
  const targetUrl = `${API_BASE_URL}/${path}/`
  const allowedOrigin = getAllowedOrigin(request)
  
  try {
    const response = await fetch(targetUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || '',
      },
    })
    
    // Handle 204 No Content responses (successful deletion)
    if (response.status === 204) {
      return NextResponse.json(
        { status: 'success', message: 'Document deleted successfully' },
        {
          status: 200, // Change to 200 for frontend compatibility
          headers: {
            ...(allowedOrigin && {
              'Access-Control-Allow-Origin': allowedOrigin,
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
              'Access-Control-Allow-Credentials': 'true',
            }),
          },
        }
      )
    }
    
    let data: any
    const responseText = await response.text()
    
    try {
      data = JSON.parse(responseText)
    } catch (jsonError) {
      data = {
        error: 'Server returned non-JSON response',
        ...(isProduction() ? {} : {
          detail: responseText.substring(0, 200),
          status: response.status,
          statusText: response.statusText
        }),
      }
    }
    
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        ...(allowedOrigin && {
          'Access-Control-Allow-Origin': allowedOrigin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true',
        }),
      },
    })
  } catch (error) {
    const errorMessage = isProduction() 
      ? 'Failed to fetch data' 
      : error instanceof Error ? error.message : 'Failed to fetch data'
    
    return NextResponse.json(
      { error: errorMessage },
      { 
        status: 500,
        headers: {
          ...(allowedOrigin && {
            'Access-Control-Allow-Origin': allowedOrigin,
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
      }),
    },
  })
}
