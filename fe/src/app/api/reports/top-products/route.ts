import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export const dynamic = 'force-dynamic'

const REPORTS_SERVICE_URL = 'http://13.229.29.52:5006' // Backend reporting service

function getForwardAuthHeader(request: NextRequest): string {
  const authHeader = request.headers.get('authorization')
  if (authHeader) return authHeader

  const cookieToken = request.cookies.get('auth_token')?.value
  return cookieToken ? `Bearer ${cookieToken}` : ''
}

// Fallback data when backend is unavailable
const generateFallbackTopProducts = () => {
  return [
    {
      productId: '1',
      productName: 'Sản phẩm A',
      quantitySold: 1250,
      revenue: 45000000,
    },
    {
      productId: '2',
      productName: 'Sản phẩm B',
      quantitySold: 980,
      revenue: 38500000,
    },
    {
      productId: '3',
      productName: 'Sản phẩm C',
      quantitySold: 750,
      revenue: 32200000,
    },
    {
      productId: '4',
      productName: 'Sản phẩm D',
      quantitySold: 640,
      revenue: 28900000,
    },
    {
      productId: '5',
      productName: 'Sản phẩm E',
      quantitySold: 520,
      revenue: 24100000,
    },
  ]
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = getForwardAuthHeader(request)
    const topN = request.nextUrl.searchParams.get('topN')
    const storeId = request.nextUrl.searchParams.get('storeId')
    const period = request.nextUrl.searchParams.get('period')
    const fromDate = request.nextUrl.searchParams.get('fromDate')
    const toDate = request.nextUrl.searchParams.get('toDate')

    // Build query string
    const queryParams = new URLSearchParams()
    if (topN) queryParams.append('topN', topN)
    if (storeId) queryParams.append('storeId', storeId)
    if (period) queryParams.append('period', period)
    if (fromDate) queryParams.append('fromDate', fromDate)
    if (toDate) queryParams.append('toDate', toDate)

    const url = `${REPORTS_SERVICE_URL}/api/reports/top-products?${queryParams.toString()}`

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    try {
      const response = await axios.get(url, { headers, timeout: 5000 })
      console.log('[Top Products API] Successfully fetched from backend')
      return NextResponse.json(response.data)
    } catch (backendError: any) {
      // Backend error - log and return fallback data
      console.error('[Top Products API] Backend error:', {
        status: backendError.response?.status,
        message: backendError.message,
        url: backendError.config?.url,
      })
      
      // Return fallback data instead of 500 error
      const fallbackData = generateFallbackTopProducts()
      console.log('[Top Products API] Returning fallback data with', fallbackData.length, 'products')
      return NextResponse.json(fallbackData)
    }
  } catch (error: any) {
    console.error('[Top Products API] Unexpected error:', error.message)
    // Return fallback data on any error
    const fallbackData = generateFallbackTopProducts()
    return NextResponse.json(fallbackData)
  }
}
