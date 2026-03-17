import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const INVENTORY_SERVICE_URL =
  process.env.INVENTORY_URL ||
  process.env.NEXT_PUBLIC_INVENTORY_URL ||
  'http://localhost:5003'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params

  try {
    const body = await request.json().catch(() => ({}))
    const url = `${INVENTORY_SERVICE_URL}/api/restock-requests/${id}/reject`

    const response = await axios.put(url, body, {
      headers: {
        Authorization: request.headers.get('authorization') || '',
        'Content-Type': 'application/json',
        Accept: '*/*',
      },
    })

    return NextResponse.json(response.data, { status: response.status })
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        error.response?.data ?? { message: 'Error rejecting restock request' },
        { status: error.response?.status || 500 }
      )
    }
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

