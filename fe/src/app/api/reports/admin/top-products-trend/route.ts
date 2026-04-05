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

export async function GET(request: NextRequest) {
  try {
    const authHeader = getForwardAuthHeader(request)
    const period = request.nextUrl.searchParams.get('period') || 'LAST_7_DAYS'
    const storeId = request.nextUrl.searchParams.get('storeId')
    const fromDate = request.nextUrl.searchParams.get('fromDate')
    const toDate = request.nextUrl.searchParams.get('toDate')
    const topN = request.nextUrl.searchParams.get('topN') || '10'

    console.log('📊 [Top Products Trend API] Received params:', {
      period,
      storeId,
      fromDate,
      toDate,
      topN,
    })

    // Build query string
    const queryParams = new URLSearchParams()
    queryParams.append('period', period)
    queryParams.append('topN', topN)
    
    if (storeId) queryParams.append('storeId', storeId)
    if (fromDate) queryParams.append('fromDate', fromDate)
    if (toDate) queryParams.append('toDate', toDate)

    const url = `${REPORTS_SERVICE_URL}/api/reports/admin/top-products-trend?${queryParams.toString()}`
    console.log('📊 [Top Products Trend API] Calling backend URL:', url)

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    const response = await axios.get(url, { headers })
    console.log('📊 [Top Products Trend API] Success! Response status:', response.status)
    
    if (response.data) {
      return NextResponse.json(response.data)
    }
  } catch (error: any) {
    console.error('❌ [Top Products Trend API] Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      data: error.response?.data,
    })
  }

  // Return empty structure on error
  console.log('⚠️ [Top Products Trend API] Returning empty response')
  return NextResponse.json({
    selectedStoreId: null,
    period: 'LAST_7_DAYS',
    fromDate: null,
    toDate: null,
    topN: 10,
    overallTopProducts: [],
    storeTopProducts: [],
  })
}
