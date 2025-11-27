import { NextRequest, NextResponse } from 'next/server'
import { getApiBaseUrl } from '@/lib/env'

export async function GET(request: NextRequest) {
  const apiBase = getApiBaseUrl()
  const targetUrl = `${apiBase}/documents/`

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
