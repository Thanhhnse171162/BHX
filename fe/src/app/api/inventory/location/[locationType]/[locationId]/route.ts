import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

// Reuse the same backend base URL as other inventory routes
const INVENTORY_SERVICE_URL =
  process.env.INVENTORY_URL ||
  process.env.NEXT_PUBLIC_INVENTORY_URL ||
  'http://localhost:5003'

/**
 * GET /api/inventory/location/[locationType]/[locationId]
 * Proxy to backend: /api/Inventory/location/{locationType}/{locationId}
 */
export async function GET(
  request: NextRequest,
  context: { params: { locationType: string; locationId: string } }
) {
  const { locationType, locationId } = context.params

  try {
    const url = `${INVENTORY_SERVICE_URL}/api/Inventory/location/${locationType}/${locationId}`

    console.log('Fetching inventory by location from:', url)

    const response = await axios.get(url, {
      headers: {
        Authorization: request.headers.get('authorization') || '',
      },
    })

    return NextResponse.json(response.data, { status: response.status })
  } catch (error: unknown) {
    console.error(
      `Inventory location API Error for ${context.params.locationType} ${context.params.locationId}:`,
      error
    )

    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        {
          message: 'Error fetching inventory by location',
          error: error.response?.data || error.message,
        },
        { status: error.response?.status || 500 }
      )
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}


