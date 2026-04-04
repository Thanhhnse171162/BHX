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
    const range = request.nextUrl.searchParams.get('range')
    const fromDate = request.nextUrl.searchParams.get('fromDate')
    const toDate = request.nextUrl.searchParams.get('toDate')

    console.log('📊 [Top Products API] Received params:', {
      topN,
      storeId,
      period,
      range,
      fromDate,
      toDate,
    })

    // Build query string - only use topN if provided, skip storeId, period, range
    // Backend API accepts minimal params
    let queryParams = new URLSearchParams()
    if (topN) queryParams.append('topN', topN)
    // Note: Don't send storeId, period, range - backend doesn't support them

    let url = `${REPORTS_SERVICE_URL}/api/reports/top-products?${queryParams.toString()}`
    if (!topN) {
      // If no topN, don't add query string at all
      url = `${REPORTS_SERVICE_URL}/api/reports/top-products`
    }
    console.log('📊 [Top Products API] Calling backend URL:', url)

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    try {
      let response = await axios.get(url, { headers })
      console.log('📊 [Top Products API] Success! Response status:', response.status)
      console.log('📊 [Top Products API] Response has', Array.isArray(response.data) ? response.data.length : '?', 'items')
      
      if (response.data) {
        return NextResponse.json(response.data)
      }
    } catch (axiosError: any) {
      console.error('❌ [Top Products API] Backend error:', {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        message: axiosError.message,
        data: axiosError.response?.data,
        url: url,
      })
    }

    // If request failed, return empty array with 200 status (don't break UI)
    console.log('⚠️ [Top Products API] Returning empty array')
    return NextResponse.json([])
  } catch (error: any) {
    console.error('❌ [Top Products API] Unexpected error:', error.message)
    // Return empty array instead of error to prevent UI breaking
    return NextResponse.json([])

  }
}
