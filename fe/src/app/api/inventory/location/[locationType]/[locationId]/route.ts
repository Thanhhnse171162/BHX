import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

// Proxy to backend: GET /api/Inventory/location/{locationType}/{locationId}
const INVENTORY_SERVICE_URL = process.env.INVENTORY_URL || process.env.NEXT_PUBLIC_INVENTORY_URL || 'http://localhost:5003'

export async function GET(
  request: NextRequest,
  context: { params: { locationType: string; locationId: string } },
) {
  const { locationType, locationId } = context.params
  try {
    const url = `${INVENTORY_SERVICE_URL}/api/Inventory/location/${encodeURIComponent(locationType)}/${encodeURIComponent(
      locationId,
    )}`

    const response = await axios.get(url, {
      headers: {
        Authorization: request.headers.get('authorization') || '',
        Accept: '*/*',
      },
    })

    return NextResponse.json(response.data, { status: response.status })
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        {
          message: 'Error fetching inventory by location',
          error: error.response?.data || error.message,
        },
        { status: error.response?.status || 500 },
      )
    }

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

