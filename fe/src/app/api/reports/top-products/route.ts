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

    console.log('[Top Products API] Requesting:', url)
    const response = await axios.get(url, { headers, timeout: 5000 })
    console.log('[Top Products API] Response:', response.status, response.data)
    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error('[Top Products API] Error:', {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    })
    return NextResponse.json({ 
      error: error.message,
      details: error.response?.data 
    }, { status: error.response?.status || 500 })
  }
}
