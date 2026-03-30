import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

// URL của Inventory Backend Service
const INVENTORY_SERVICE_URL = process.env.INVENTORY_URL || process.env.NEXT_PUBLIC_INVENTORY_URL || 'http://13.229.29.52:5003'

/**
 * PUT /api/inventory/[inventoryId]/min-stock-level
 * Proxy to backend: PUT /api/Inventory/{inventoryId}/min-stock-level
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { inventoryId: string } }
) {
  try {
    const { inventoryId } = params
    const body = await request.json()
    const url = `${INVENTORY_SERVICE_URL}/api/Inventory/${inventoryId}/min-stock-level`

    console.log('Update min stock level:', {
      url,
      body,
    })

    const response = await axios.put(url, body, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: request.headers.get('authorization') || '',
      },
    })

    console.log('Min stock level updated:', response.status, response.data)

    return NextResponse.json(response.data, { status: response.status })
  } catch (error: unknown) {
    console.error('Update min stock level error:', error)
    
    if (axios.isAxiosError(error)) {
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      })
      
      return NextResponse.json(
        { 
          message: 'Error updating min stock level',
          error: error.response?.data || error.message 
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
