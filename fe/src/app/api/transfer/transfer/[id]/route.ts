import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const INVENTORY_SERVICE_URL =
  process.env.INVENTORY_URL ||
  process.env.NEXT_PUBLIC_INVENTORY_URL ||
  'http://localhost:5003'

function getAuthorization(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cookieToken = request.cookies.get('auth_token')?.value
  return authHeader || (cookieToken ? `Bearer ${cookieToken}` : '')
}

/**
 * PATCH /api/transfer/transfer/:id
 * Proxy to backend: PATCH /api/Transfer/transfer/:id
 *
 * Notes:
 * - Used for status transitions (e.g. manager confirm complete)
 * - Backend contract may accept partial updates (status, actualDelivery, receivedBy, etc.)
 */
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await request.json().catch(() => ({}))

    const url = `${INVENTORY_SERVICE_URL}/api/Transfer/transfer/${encodeURIComponent(id)}`
    const authorization = getAuthorization(request)

    const response = await axios.patch(url, body, {
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json',
        Accept: '*/*',
      },
    })

    return NextResponse.json(response.data, { status: response.status })
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        {
          success: false,
          message: error.response?.data?.message || 'Error updating transfer',
          error: error.response?.data?.error || undefined,
        },
        { status: error.response?.status || 500 },
      )
    }
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

