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

    // Build query string - try with all params first
    let queryParams = new URLSearchParams()
    if (topN) queryParams.append('topN', topN)
    if (storeId) queryParams.append('storeId', storeId)
    if (period) queryParams.append('period', period)
    if (range) queryParams.append('range', range)
    if (fromDate) queryParams.append('fromDate', fromDate)
    if (toDate) queryParams.append('toDate', toDate)

    let url = `${REPORTS_SERVICE_URL}/api/reports/top-products?${queryParams.toString()}`
    console.log('📊 [Top Products API] First attempt URL:', url)

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    let response = await axios.get(url, { headers })
    console.log('📊 [Top Products API] Backend response status:', response.status)
    console.log('📊 [Top Products API] Backend response type:', Array.isArray(response.data) ? 'array' : typeof response.data)
    console.log('📊 [Top Products API] Response data:', JSON.stringify(response.data).substring(0, 500))

    // If we got a response, return it
    if (response.data && (Array.isArray(response.data) ? response.data.length > 0 : Object.keys(response.data).length > 0)) {
      console.log('✅ [Top Products API] Returning response with', Array.isArray(response.data) ? response.data.length : 'data')
      return NextResponse.json(response.data)
    }

    // If response is empty/invalid, try without storeId as fallback
    if (storeId) {
      console.log('⚠️ [Top Products API] Response was empty/invalid, retrying without storeId...')
      queryParams = new URLSearchParams()
      if (topN) queryParams.append('topN', topN)
      if (period) queryParams.append('period', period)
      if (range) queryParams.append('range', range)
      if (fromDate) queryParams.append('fromDate', fromDate)
      if (toDate) queryParams.append('toDate', toDate)

      url = `${REPORTS_SERVICE_URL}/api/reports/top-products?${queryParams.toString()}`
      console.log('📊 [Top Products API] Retry URL (without storeId):', url)
      
      const retryResponse = await axios.get(url, { headers })
      console.log('📊 [Top Products API] Retry response status:', retryResponse.status)
      return NextResponse.json(retryResponse.data)
    }

    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error('❌ [Top Products API] Failed to fetch:', error.message)
    console.error('❌ [Top Products API] Full error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
