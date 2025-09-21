import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'http://localhost:8000/api'

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
  
  // Debug logging (remove in production)
  console.log('Proxy request:', path, request.headers.get('authorization') ? '(authenticated)' : '(unauthenticated)')
  
  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || '',
      },
    })
    
    console.log('Backend response status:', response.status)
    
    // Check if this is a download request (binary data)
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/pdf') || path.includes('/download')) {
      console.log('Handling binary download response')
      const buffer = await response.arrayBuffer()
      return new NextResponse(buffer, {
        status: response.status,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': response.headers.get('content-disposition') || '',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      })
    }
    
    const data = await response.json()
    
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error) {
    console.error('Proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
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
  
  console.log('=== POST Proxy Request ===')
  console.log('Path:', path)
  console.log('Target URL:', targetUrl)
  console.log('Content-Type:', request.headers.get('content-type'))
  console.log('Authorization:', request.headers.get('authorization') ? 'Present' : 'Missing')
  
  try {
    const contentType = request.headers.get('content-type') || ''
    const authHeader = request.headers.get('authorization') || ''
    let response: Response

    if (contentType.includes('multipart/form-data')) {
      console.log('Processing multipart/form-data...')
      // Rebuild FormData to ensure a correct multipart boundary is generated
      const incomingForm = await request.formData()
      console.log('Incoming form entries:', Array.from(incomingForm.entries()).map(([key, value]) => 
        `${key}: ${typeof value === 'object' && value && 'name' in value ? `File(${value.name}, ${value.size} bytes)` : String(value)}`
      ))
      
      const outgoingForm = new FormData()
      for (const [key, value] of incomingForm.entries()) {
        // Check if it's a file-like object (has name, size, stream properties)
        if (typeof value === 'object' && value && 'name' in value && 'size' in value) {
          outgoingForm.append(key, value as any, (value as any).name)
        } else {
          outgoingForm.append(key, String(value))
        }
      }

      console.log('Making request to Django...')
      console.log('Request details:', {
        url: targetUrl,
        method: 'POST',
        headers: { Authorization: authHeader ? 'Bearer ***' : 'Missing' },
        bodyType: 'FormData'
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
        console.log('Django response received:', response.status, response.statusText)
      } catch (fetchError) {
        console.error('Fetch error to Django:', fetchError)
        throw fetchError
      }
    } else {
      const textBody = await request.text()
      console.log('Processing JSON/text body:', textBody.substring(0, 200))
      response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': contentType || 'application/json',
          Authorization: authHeader,
        },
        body: textBody || undefined,
      })
      console.log('Django response status:', response.status)
    }
    
    let data: any
    const responseText = await response.text()
    console.log('Django raw response:', responseText.substring(0, 500))
    
    try {
      data = JSON.parse(responseText)
      console.log('Django response data:', data)
    } catch (jsonError) {
      console.log('Django returned non-JSON response, likely HTML error page')
      data = {
        error: 'Server returned non-JSON response',
        detail: responseText.substring(0, 200),
        status: response.status,
        statusText: response.statusText
      }
    }
    
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error) {
    console.error('POST Proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data', details: String(error) },
      { status: 500 }
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
  
  console.log('=== DELETE Proxy Request ===')
  console.log('Path:', path)
  console.log('Target URL:', targetUrl)
  console.log('Authorization:', request.headers.get('authorization') ? 'Present' : 'Missing')
  
  try {
    const response = await fetch(targetUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || '',
      },
    })
    
    console.log('Django response status:', response.status)
    
    // Handle 204 No Content responses (successful deletion)
    if (response.status === 204) {
      console.log('Django returned 204 No Content (successful deletion)')
      return NextResponse.json(
        { status: 'success', message: 'Document deleted successfully' },
        {
          status: 200, // Change to 200 for frontend compatibility
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      )
    }
    
    let data: any
    const responseText = await response.text()
    console.log('Django raw response:', responseText.substring(0, 200))
    
    try {
      data = JSON.parse(responseText)
      console.log('Django response data:', data)
    } catch (jsonError) {
      console.log('Django returned non-JSON response, likely HTML error page')
      data = {
        error: 'Server returned non-JSON response',
        detail: responseText.substring(0, 200),
        status: response.status,
        statusText: response.statusText
      }
    }
    
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error) {
    console.error('DELETE Proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data', details: String(error) },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
