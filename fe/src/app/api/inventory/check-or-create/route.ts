import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

// URL của Inventory Backend Service
const INVENTORY_SERVICE_URL = process.env.INVENTORY_URL || process.env.NEXT_PUBLIC_INVENTORY_URL || 'http://13.229.29.52:5003'

/**
 * POST /api/inventory/check-or-create
 * Proxy to backend: POST /api/Inventory/check-or-create
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const url = `${INVENTORY_SERVICE_URL}/api/Inventory/check-or-create`

    console.log('Check or create inventory:', {
      url,
      body,
    })

    const response = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: request.headers.get('authorization') || '',
      },
    })

    console.log('Check or create inventory response:', response.status, response.data)

    return NextResponse.json(response.data, { status: response.status })
  } catch (error: unknown) {
    console.error('Check or create inventory error:', error)
    
    if (axios.isAxiosError(error)) {
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      })
      
      return NextResponse.json(
        { 
          message: 'Error checking or creating inventory',
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
