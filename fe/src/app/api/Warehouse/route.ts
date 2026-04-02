import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export const dynamic = 'force-dynamic'

const INVENTORY_SERVICE_URL =
  process.env.INVENTORY_URL ||
  process.env.NEXT_PUBLIC_INVENTORY_URL ||
  process.env.NEXT_PUBLIC_INVENTORY_API_URL ||
  'http://13.229.29.52:5003'

function getAuthorization(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cookieToken = request.cookies.get('auth_token')?.value
  return authHeader || (cookieToken ? `Bearer ${cookieToken}` : '')
}

/**
 * GET /api/Warehouse
 * Proxy to backend: GET /api/Warehouse
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryString = searchParams.toString()
    const url = `${INVENTORY_SERVICE_URL}/api/Warehouse${queryString ? `?${queryString}` : ''}`

    const response = await axios.get(url, {
      headers: {
        Authorization: getAuthorization(request),
        Accept: '*/*',
      },
    })

    return NextResponse.json(response.data, { status: response.status })
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        error.response?.data ?? { message: 'Error fetching warehouses' },
        { status: error.response?.status || 500 }
      )
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
