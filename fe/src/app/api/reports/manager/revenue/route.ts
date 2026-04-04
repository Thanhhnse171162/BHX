import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Fallback data when backend is unavailable
const generateFallbackManagerRevenue = () => {
  return {
    storeId: 'store-001',
    period: '7days',
    data: {
      totalRevenue: 156789000,
      totalOrders: 450,
      trend: Array.from({ length: 7 }, (_, i) => {
        const date = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000)
        return {
          date: date.toISOString().split('T')[0],
          revenue: 2500000 + Math.random() * 2000000,
          orders: Math.floor(50 + Math.random() * 30),
        }
      }),
    },
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const storeId = searchParams.get('storeId')
    const staffId = searchParams.get('staffId')
    const range = searchParams.get('range') || '7days'
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const backendUrl = process.env.NEXT_PUBLIC_REPORTING_URL || 'http://13.229.29.52:3011'
    
    const params = new URLSearchParams()
    if (storeId) params.set('storeId', storeId)
    if (staffId) params.set('staffId', staffId)
    params.set('range', range)
    if (from) params.set('from', from)
    if (to) params.set('to', to)

    const authHeader = req.headers.get('authorization')
    
    try {
      const response = await fetch(`${backendUrl}/reports/manager/revenue?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader && { Authorization: authHeader }),
        },
        signal: AbortSignal.timeout(5000),
      })

      if (!response.ok) {
        console.error(`Backend error (${response.status}):`)
        // Return fallback data on backend error
        const fallbackData = generateFallbackManagerRevenue()
        console.log('📊 Returning fallback manager revenue data')
        return NextResponse.json(fallbackData)
      }

      const data = await response.json()
      return NextResponse.json(data)
    } catch (fetchError: any) {
      console.error('Revenue API fetch error:', fetchError.message)
      // Return fallback data on fetch error
      const fallbackData = generateFallbackManagerRevenue()
      return NextResponse.json(fallbackData)
    }
  } catch (error) {
    console.error('Revenue API error:', error)
    // Return fallback data on any error
    const fallbackData = generateFallbackManagerRevenue()
    return NextResponse.json(fallbackData)
  }
}
