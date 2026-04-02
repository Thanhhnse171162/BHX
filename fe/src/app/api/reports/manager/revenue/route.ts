import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const storeId = searchParams.get('storeId')
    const range = searchParams.get('range') || '7days'
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const backendUrl = process.env.NEXT_PUBLIC_REPORTING_URL || 'http://13.229.29.52:3011'
    
    const params = new URLSearchParams()
    if (storeId) params.set('storeId', storeId)
    params.set('range', range)
    if (from) params.set('from', from)
    if (to) params.set('to', to)

    const authHeader = req.headers.get('authorization')
    
    const response = await fetch(`${backendUrl}/reports/manager/revenue?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
    })

    if (!response.ok) {
      const error = await response.text()
      console.error(`Backend error (${response.status}):`, error)
      return NextResponse.json(
        { error: `Backend error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Revenue API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
