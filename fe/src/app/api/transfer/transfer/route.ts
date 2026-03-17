import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const INVENTORY_SERVICE_URL =
  process.env.INVENTORY_URL ||
  process.env.NEXT_PUBLIC_INVENTORY_URL ||
  'http://localhost:5003'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * POST /api/transfer/transfer
 * Proxy to backend: POST /api/Transfer/transfer
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const normalizedBody = { ...body }
    if (!UUID_REGEX.test(String(normalizedBody.shippedBy || '').trim())) {
      delete normalizedBody.shippedBy
    }

    const url = `${INVENTORY_SERVICE_URL}/api/Transfer/transfer`
    
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('auth_token')?.value
    const authorization = authHeader || (cookieToken ? `Bearer ${cookieToken}` : '')

    console.log('Creating transfer:', {
      fromLocationId: normalizedBody.fromLocationId,
      toLocationId: normalizedBody.toLocationId,
      itemsCount: normalizedBody.items?.length || 0,
      hasShippedBy: Boolean(normalizedBody.shippedBy),
      hasAuth: !!authorization,
    })

    const response = await axios.post(url, normalizedBody, {
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json',
      },
    })

    return NextResponse.json(response.data, { status: response.status })
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Transfer API Error:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        data: error.response?.data,
      })
      return NextResponse.json(
        { 
          success: false,
          message: error.response?.data?.message || error.response?.data || 'Error creating transfer order',
          error: error.response?.data?.error || undefined
        },
        { status: error.response?.status || 500 }
      )
    }

    console.error('Unexpected transfer error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
