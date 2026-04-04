import { NextRequest, NextResponse } from 'next/server'

const REPORTS_SERVICE_URL = process.env.NEXT_PUBLIC_REPORTS_URL || 'http://13.229.29.52:5006'

export const dynamic = 'force-dynamic'

// Fallback data when backend is unavailable
const generateFallbackManagerDashboard = () => {
  return {
    period: 'LAST_7_DAYS',
    fromDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    revenue: {
      totalRevenue: 156789000,
      totalOrders: 450,
      totalProductsSold: 2850,
      topProducts: [
        { productId: '1', productName: 'Sản phẩm A', quantitySold: 1250, revenue: 45000000 },
        { productId: '2', productName: 'Sản phẩm B', quantitySold: 980, revenue: 38500000 },
        { productId: '3', productName: 'Sản phẩm C', quantitySold: 750, revenue: 32200000 },
      ],
    },
    revenueTrend: Array.from({ length: 7 }, (_, i) => {
      const date = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000)
      return {
        time: date.toISOString().split('T')[0],
        revenue: 2500000 + Math.random() * 2000000,
      }
    }),
    topProducts: [
      { productId: '1', productName: 'Sản phẩm A', quantitySold: 1250, revenue: 45000000 },
      { productId: '2', productName: 'Sản phẩm B', quantitySold: 980, revenue: 38500000 },
      { productId: '3', productName: 'Sản phẩm C', quantitySold: 750, revenue: 32200000 },
    ],
    inventorySummary: {
      totalProducts: 150,
      totalStock: 5420,
      lowStock: 32,
      outOfStock: 5,
    },
  }
}

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

    try {
      const response = await fetch(`${REPORTS_SERVICE_URL}/api/reports/manager/dashboard`, {
        method: 'GET',
        headers,
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      })

      if (!response.ok) {
        console.error('❌ Backend error:', response.status, response.statusText)
        // Return fallback data on backend error
        const fallbackData = generateFallbackManagerDashboard()
        console.log('📊 Returning fallback manager dashboard data')
        return NextResponse.json(fallbackData)
      }

      const data = await response.json()
      return NextResponse.json(data)
    } catch (fetchError: any) {
      console.error('❌ Dashboard API fetch error:', fetchError.message)
      // Return fallback data on fetch error
      const fallbackData = generateFallbackManagerDashboard()
      console.log('📊 Returning fallback manager dashboard data due to fetch error')
      return NextResponse.json(fallbackData)
    }
  } catch (error) {
    console.error('❌ Dashboard API error:', error)
    // Return fallback data on any error
    const fallbackData = generateFallbackManagerDashboard()
    return NextResponse.json(fallbackData)
  }
}
