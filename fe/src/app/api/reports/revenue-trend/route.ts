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
    const period = request.nextUrl.searchParams.get('period')
    const groupBy = request.nextUrl.searchParams.get('groupBy')
    const storeId = request.nextUrl.searchParams.get('storeId')
    const fromDate = request.nextUrl.searchParams.get('fromDate')
    const toDate = request.nextUrl.searchParams.get('toDate')

    console.log('[Revenue Trend API] Received params:', {
      period,
      groupBy,
      storeId,
      fromDate,
      toDate,
    })

    // Build query string
    const queryParams = new URLSearchParams()
    if (period) queryParams.append('period', period)
    if (groupBy) queryParams.append('groupBy', groupBy)
    if (storeId) queryParams.append('storeId', storeId)
    if (fromDate) queryParams.append('fromDate', fromDate)
    if (toDate) queryParams.append('toDate', toDate)

    const url = `${REPORTS_SERVICE_URL}/api/reports/revenue-trend?${queryParams.toString()}`
    console.log('[Revenue Trend API] Forwarding to:', url)

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    const response = await axios.get(url, { headers })
    console.log('[Revenue Trend API] Response data points:', Array.isArray(response.data) ? response.data.length : response.data?.data?.length || 0)
    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error('Failed to fetch revenue trend:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
