import { NextRequest, NextResponse } from 'next/server'

const REPORTS_SERVICE_URL = process.env.NEXT_PUBLIC_REPORTS_URL || 'http://13.229.29.52:5006'

export const dynamic = 'force-dynamic'

/**
 * GET /api/reports/manager/dashboard
 * Proxy request đến Reports Service để lấy dashboard data
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Forwarding GET /api/reports/manager/dashboard to:', REPORTS_SERVICE_URL)

    // Lấy token từ request headers
    const authHeader = request.headers.get('authorization')
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'accept': '*/*',
    }
    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    const response = await fetch(`${REPORTS_SERVICE_URL}/api/reports/manager/dashboard`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error('❌ Backend error:', response.status, response.statusText)
      const errorText = await response.text()
      return NextResponse.json(
        {
          success: false,
          error: `Backend returned ${response.status}`,
          details: errorText,
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ Dashboard API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
