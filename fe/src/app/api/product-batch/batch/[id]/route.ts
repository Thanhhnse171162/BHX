import { NextRequest, NextResponse } from 'next/server'

const INVENTORY_URL =
  process.env.INVENTORY_URL ||
  process.env.NEXT_PUBLIC_INVENTORY_URL ||
  process.env.NEXT_PUBLIC_INVENTORY_API_URL ||
  'http://13.229.29.52:5003'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const batchId = params.id
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('auth_token')?.value
    const authorization = authHeader || (cookieToken ? `Bearer ${cookieToken}` : '')

    if (!authorization) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const response = await fetch(`${INVENTORY_URL}/api/ProductBatch/batch/${batchId}`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Accept: 'text/plain',
        Authorization: authorization,
      },
    })

    const data = await response.json()
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    })
  } catch (error) {
    console.error('Error fetching batch detail:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch batch detail' },
      { status: 500 }
    )
  }
}
