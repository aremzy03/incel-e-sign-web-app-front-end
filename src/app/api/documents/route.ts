import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin
  const targetUrl = `${origin}/api/proxy/documents`

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || '',
      },
    })

    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}
