import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const INVENTORY_SERVICE_URL =
  process.env.INVENTORY_URL ||
  process.env.NEXT_PUBLIC_INVENTORY_URL ||
  'http://localhost:5003'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const url = `${INVENTORY_SERVICE_URL}/api/inventory-checks/${id}`

    const response = await axios.get(url, {
      headers: {
        Authorization: request.headers.get('authorization') || '',
      },
    })

    return NextResponse.json(response.data, { status: response.status })
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        {
          message: 'Error fetching inventory check',
          error: error.response?.data || error.message,
        },
        { status: error.response?.status || 500 }
      )
    }

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const body = await request.json()
    const { action } = body

    let url = `${INVENTORY_SERVICE_URL}/api/inventory-checks/${id}`

    if (action === 'submit') {
      url = `${INVENTORY_SERVICE_URL}/api/inventory-checks/${id}/submit`
    } else if (action === 'approve') {
      url = `${INVENTORY_SERVICE_URL}/api/inventory-checks/${id}/approve`
    } else if (action === 'adjust') {
      url = `${INVENTORY_SERVICE_URL}/api/inventory-checks/${id}/adjust`
    }

    const response = await axios.put(url, body, {
      headers: {
        Authorization: request.headers.get('authorization') || '',
        'Content-Type': 'application/json',
      },
    })

    return NextResponse.json(response.data, { status: response.status })
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        {
          message: 'Error updating inventory check',
          error: error.response?.data || error.message,
        },
        { status: error.response?.status || 500 }
      )
    }

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
