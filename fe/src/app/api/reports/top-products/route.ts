import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export const dynamic = 'force-dynamic'

const REPORTS_SERVICE_URL = process.env.SALES_URL || process.env.NEXT_PUBLIC_SALES_URL || 'http://13.229.29.52:5006'

function getForwardAuthHeader(request: NextRequest): string {
  const authHeader = request.headers.get('authorization')
  if (authHeader) return authHeader

  const cookieToken = request.cookies.get('auth_token')?.value
  return cookieToken ? `Bearer ${cookieToken}` : ''
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = getForwardAuthHeader(request)
    const topN = request.nextUrl.searchParams.get('topN') || '5'
    const period = request.nextUrl.searchParams.get('period') || 'LAST_7_DAYS'
    const storeId = request.nextUrl.searchParams.get('storeId')
    const fromDate = request.nextUrl.searchParams.get('fromDate')
    const toDate = request.nextUrl.searchParams.get('toDate')

    // Build query string
    const queryParams = new URLSearchParams()
    if (topN) queryParams.append('topN', topN)
    if (period) queryParams.append('period', period)
    if (storeId) queryParams.append('storeId', storeId)
    if (fromDate) queryParams.append('fromDate', fromDate)
    if (toDate) queryParams.append('toDate', toDate)

    const url = `${REPORTS_SERVICE_URL}/api/reports/top-products?${queryParams.toString()}`

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    const response = await axios.get(url, { headers })
    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error('Failed to fetch top products:', error.message)
    // Return empty array on error
    return NextResponse.json([], { status: 200 })
  }
}
