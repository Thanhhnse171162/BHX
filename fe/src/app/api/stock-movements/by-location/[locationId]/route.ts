import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const INVENTORY_SERVICE_URL =
  process.env.INVENTORY_URL ||
  process.env.NEXT_PUBLIC_INVENTORY_URL ||
  'http://localhost:5003'

/**
 * GET /api/stock-movements/by-location/:locationId
 * Proxy to backend: GET /api/stock-movements/by-location/:locationId
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locationId: string }> }
) {
  try {
    const { locationId } = await params
    const url = `${INVENTORY_SERVICE_URL}/api/stock-movements/by-location/${locationId}`

    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('auth_token')?.value
    const authorization = authHeader || (cookieToken ? `Bearer ${cookieToken}` : '')

    const response = await axios.get(url, {
      headers: {
        Authorization: authorization,
        Accept: '*/*',
      },
    })

    return NextResponse.json(response.data, { status: response.status })
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        {
          success: false,
          message: error.response?.data?.message || 'Error fetching stock movements',
          error: error.response?.data?.error || undefined,
        },
        { status: error.response?.status || 500 }
      )
    }

    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

