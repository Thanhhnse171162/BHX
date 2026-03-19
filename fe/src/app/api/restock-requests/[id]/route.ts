import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const INVENTORY_SERVICE_URL =
  process.env.INVENTORY_URL ||
  process.env.NEXT_PUBLIC_INVENTORY_URL ||
  'http://localhost:5003'

/**
 * PATCH /api/restock-requests/[id]
 * Proxy to backend: PATCH /api/restock-requests/:id
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const url = `${INVENTORY_SERVICE_URL}/api/restock-requests/${params.id}`

    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('auth_token')?.value
    const authorization = authHeader || (cookieToken ? `Bearer ${cookieToken}` : '')

    const response = await axios.patch(url, body, {
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json',
      },
    })

    return NextResponse.json(response.data, { status: response.status })
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { message: error.response?.data?.message || 'Error updating restock request' },
        { status: error.response?.status || 500 }
      )
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
