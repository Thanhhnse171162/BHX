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
    const range = request.nextUrl.searchParams.get('range')
    const groupBy = request.nextUrl.searchParams.get('groupBy')
    const storeId = request.nextUrl.searchParams.get('storeId')
    const fromDate = request.nextUrl.searchParams.get('fromDate')
    const toDate = request.nextUrl.searchParams.get('toDate')

    console.log('[Revenue Trend API] Received params:', {
      period,
      range,
      groupBy,
      storeId,
      fromDate,
      toDate,
    })

    // Build query string - only use period if provided
    // Skip storeId, fromDate, toDate for now to match backend expectations
    let queryParams = new URLSearchParams()
    if (period) queryParams.append('period', period)
    if (range) queryParams.append('range', range)

    let url = `${REPORTS_SERVICE_URL}/api/reports/revenue-trend?${queryParams.toString()}`
    if (!period && !range) {
      // If no params, don't add query string
      url = `${REPORTS_SERVICE_URL}/api/reports/revenue-trend`
    }
    console.log('[Revenue Trend API] Calling backend URL:', url)

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    try {
      let response = await axios.get(url, { headers })
      console.log('[Revenue Trend API] Success! Response status:', response.status)
      console.log('[Revenue Trend API] Response has', Array.isArray(response.data) ? response.data.length : '?', 'items')

      if (response.data) {
        return NextResponse.json(response.data)
      }
    } catch (axiosError: any) {
      console.error('❌ [Revenue Trend API] Backend error:', {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        message: axiosError.message,
        data: axiosError.response?.data,
        url: url,
      })
    }

    // If request failed, return empty array with 200 status (don't break UI)
    console.log('⚠️ [Revenue Trend API] Returning empty array')
    return NextResponse.json([])
  } catch (error: any) {
    console.error('❌ [Revenue Trend API] Unexpected error:', error.message)
    // Return empty array instead of error to prevent UI breaking
    return NextResponse.json([])

  }
}
