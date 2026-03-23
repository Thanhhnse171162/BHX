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
  try {
    const id = params.id
    const body = await request.json()
    const url = `${INVENTORY_SERVICE_URL}/api/inventory-checks/${id}/submit`

    console.log('Submitting inventory check:', {
      id,
      payload: JSON.stringify(body, null, 2),
    })

    const response = await axios.put(url, body, {
      headers: {
        Authorization: request.headers.get('authorization') || '',
        'Content-Type': 'application/json',
      },
    })

    console.log('Inventory check submitted successfully:', response.data)
    return NextResponse.json(response.data, { status: response.status })
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Inventory check submission failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      })
      return NextResponse.json(
        {
          success: false,
          message: error.response?.data?.message || 'Error submitting inventory check',
          error: error.response?.data || error.message,
        },
        { status: error.response?.status || 500 }
      )
    }

    console.error('Unexpected error in PUT /api/inventory-checks/[id]/submit:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
