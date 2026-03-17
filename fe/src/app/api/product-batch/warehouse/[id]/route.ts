import { NextRequest, NextResponse } from 'next/server'

const INVENTORY_URL = process.env.NEXT_PUBLIC_INVENTORY_API_URL || 'http://localhost:5003'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const warehouseId = params.id
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('auth_token')?.value
    const authorization = authHeader || (cookieToken ? `Bearer ${cookieToken}` : '')

    if (!authorization) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const response = await fetch(
      `${INVENTORY_URL}/api/ProductBatch/warehouse/${warehouseId}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'text/plain',
          'Authorization': authorization,
        },
      }
    )

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error fetching batches:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch batches' },
      { status: 500 }
    )
  }
}
