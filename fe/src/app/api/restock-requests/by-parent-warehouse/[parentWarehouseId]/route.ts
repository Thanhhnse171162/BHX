import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const INVENTORY_SERVICE_URL =
  process.env.INVENTORY_URL ||
  process.env.NEXT_PUBLIC_INVENTORY_URL ||
  'http://13.229.29.52:5003'

/**
 * GET /api/restock-requests/by-parent-warehouse/[parentWarehouseId]
 * Proxy to backend: GET /api/restock-requests/by-parent-warehouse/:parentWarehouseId
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { parentWarehouseId: string } }
) {
  const { parentWarehouseId } = params

  try {
    const url = `${INVENTORY_SERVICE_URL}/api/restock-requests/by-parent-warehouse/${parentWarehouseId}`

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
        error.response?.data ?? { message: 'Error fetching parent warehouse restock requests' },
        { status: error.response?.status || 500 }
      )
    }

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
