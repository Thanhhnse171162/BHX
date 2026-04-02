import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export const dynamic = 'force-dynamic'

const INVENTORY_SERVICE_URL =
  process.env.INVENTORY_URL ||
  process.env.NEXT_PUBLIC_INVENTORY_URL ||
  'http://13.229.29.52:5003'

function getAuthorization(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cookieToken = request.cookies.get('auth_token')?.value
  return authHeader || (cookieToken ? `Bearer ${cookieToken}` : '')
}

/**
 * GET /api/inventory/product/[productId]  (URL Next.js — inventory viết thường)
 * Proxy to backend: GET /api/Inventory/product/{productId}
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await context.params
    const url = `${INVENTORY_SERVICE_URL}/api/Inventory/product/${encodeURIComponent(productId)}`
    const authorization = getAuthorization(request)

    const response = await axios.get(url, {
      headers: {
        Authorization: authorization,
        Accept: 'application/json',
      },
    })

    return NextResponse.json(response.data, { status: response.status })
  } catch (error: unknown) {
    console.error('Inventory product API Error:', error)

    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Error fetching inventory by product',
          error: error.response?.data || error.message,
        },
        { status: error.response?.status || 500 }
      )
    }

    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
