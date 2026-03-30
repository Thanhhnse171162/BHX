import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const INVENTORY_SERVICE_URL =
  process.env.INVENTORY_URL ||
  process.env.NEXT_PUBLIC_INVENTORY_URL ||
  'http://13.229.29.52:5003'

/**
 * GET /api/inventory-warehouse/[id]
 * Proxy to backend: GET /api/Warehouse/{id}
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const url = `${INVENTORY_SERVICE_URL}/api/Warehouse/${params.id}`

    const response = await axios.get(url, {
      headers: {
        Authorization: request.headers.get('authorization') || '',
        Accept: '*/*',
      },
    })

    return NextResponse.json(response.data, { status: response.status })
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { message: error.response?.data?.message || 'Error fetching warehouse details' },
        { status: error.response?.status || 500 }
      )
    }

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
