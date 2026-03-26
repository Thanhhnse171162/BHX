import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const INVENTORY_SERVICE_URL =
  process.env.INVENTORY_URL ||
  process.env.NEXT_PUBLIC_INVENTORY_URL ||
  process.env.NEXT_PUBLIC_INVENTORY_API_URL ||
  'http://localhost:5003'

function getAuthorization(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cookieToken = request.cookies.get('auth_token')?.value
  return authHeader || (cookieToken ? `Bearer ${cookieToken}` : '')
}

/**
 * GET /api/Warehouse/warehouses/{parentId}
 * Proxy to backend: GET /api/Warehouse/warehouses/{parentId}
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { parentId: string } }
) {
  try {
    const url = `${INVENTORY_SERVICE_URL}/api/Warehouse/warehouses/${encodeURIComponent(params.parentId)}`
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
        error.response?.data ?? { message: 'Error fetching child warehouses' },
        { status: error.response?.status || 500 }
      )
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

