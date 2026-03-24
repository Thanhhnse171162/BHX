import { NextRequest, NextResponse } from 'next/server'

const INVENTORY_URL =
  process.env.INVENTORY_URL ||
  process.env.NEXT_PUBLIC_INVENTORY_URL ||
  process.env.NEXT_PUBLIC_INVENTORY_API_URL ||
  'http://localhost:5003'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('auth_token')?.value
    const authorization = authHeader || (cookieToken ? `Bearer ${cookieToken}` : '')

    if (!authorization) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const response = await fetch(`${INVENTORY_URL}/api/ProductBatch/receive-from-supplier`, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        Accept: 'text/plain',
        'Content-Type': 'application/json',
        Authorization: authorization,
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    })
  } catch (error) {
    console.error('Error receiving batch from supplier:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to receive batch from supplier' },
      { status: 500 }
    )
  }
}
