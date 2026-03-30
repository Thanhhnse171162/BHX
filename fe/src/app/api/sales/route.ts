import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const SALES_SERVICE_URL = process.env.SALES_URL || process.env.NEXT_PUBLIC_SALES_URL || 'http://13.229.29.52:5006'

function getForwardAuthHeader(request: NextRequest): string {
  const authHeader = request.headers.get('authorization')
  if (authHeader) return authHeader

  const cookieToken = request.cookies.get('auth_token')?.value
  return cookieToken ? `Bearer ${cookieToken}` : ''
}

// GET /api/sales?storeId=...
export async function GET(request: NextRequest) {
  try {
    const authHeader = getForwardAuthHeader(request)
    const storeId = request.nextUrl.searchParams.get('storeId')

    const urls = [
      storeId ? `${SALES_SERVICE_URL}/api/sales?storeId=${encodeURIComponent(storeId)}` : null,
      storeId ? `${SALES_SERVICE_URL}/api/sales/store/${encodeURIComponent(storeId)}` : null,
      `${SALES_SERVICE_URL}/api/sales`,
    ].filter(Boolean) as string[]

    let lastStatus = 502
    let lastData: any = { message: 'Unable to fetch sales list' }

    for (const url of urls) {
      const response = await axios.get(url, {
        headers: {
          Authorization: authHeader,
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
          Accept: 'application/json',
        },
        validateStatus: () => true,
      })

      if (response.status >= 200 && response.status < 300) {
        return NextResponse.json(response.data, { status: response.status })
      }

      lastStatus = response.status
      lastData = response.data

      if (response.status !== 404) {
        break
      }
    }

    return NextResponse.json(lastData || { message: 'Error fetching sales list' }, { status: lastStatus || 500 })
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        {
          message: 'Error fetching sales list',
          error: error.response?.data || error.message,
        },
        { status: error.response?.status || 500 }
      )
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
