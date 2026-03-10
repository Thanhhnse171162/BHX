import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

// URL của Inventory Backend Service (server-side không cần NEXT_PUBLIC_)
const INVENTORY_SERVICE_URL = process.env.INVENTORY_URL || process.env.NEXT_PUBLIC_INVENTORY_URL || 'http://localhost:5003'

/**
 * GET /api/inventory - Lấy tất cả inventory items
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryString = searchParams.toString()
    const url = `${INVENTORY_SERVICE_URL}/api/inventory${queryString ? `?${queryString}` : ''}`

    console.log('Fetching inventory from:', url)

    // Forward request đến backend
    const response = await axios.get(url, {
      headers: {
        Authorization: request.headers.get('authorization') || '',
      },
    })

    console.log('Inventory API response:', response.status, response.data?.data?.length || 0, 'items')
    
    // Debug: log first item structure to help troubleshoot
    if (response.data?.data?.length > 0) {
      console.log('📦 Sample inventory item structure:', JSON.stringify(response.data.data[0], null, 2))
    }
    
    return NextResponse.json(response.data, { status: response.status })
  } catch (error: unknown) {
    console.error('Inventory API Error:', error)
    
    if (axios.isAxiosError(error)) {
      console.error('Error details:', error.response?.data || error.message)
      return NextResponse.json(
        { 
          message: 'Error fetching inventory',
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

/**
 * POST /api/inventory - Tạo hoặc điều chỉnh inventory
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const url = `${INVENTORY_SERVICE_URL}/api/inventory`

    const response = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: request.headers.get('authorization') || '',
      },
    })

    return NextResponse.json(response.data, { status: response.status })
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { 
          message: 'Error creating/adjusting inventory',
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

/**
 * PUT /api/inventory/:id - Cập nhật inventory
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body
    
    if (!id) {
      return NextResponse.json(
        { message: 'Inventory ID is required' },
        { status: 400 }
      )
    }

    const url = `${INVENTORY_SERVICE_URL}/api/inventory/${id}`

    const response = await axios.put(url, body, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: request.headers.get('authorization') || '',
      },
    })

    return NextResponse.json(response.data, { status: response.status })
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { 
          message: 'Error updating inventory',
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

/**
 * DELETE /api/inventory/:id - Xóa inventory
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { message: 'Inventory ID is required' },
        { status: 400 }
      )
    }

    const url = `${INVENTORY_SERVICE_URL}/api/inventory/${id}`

    const response = await axios.delete(url, {
      headers: {
        Authorization: request.headers.get('authorization') || '',
      },
    })

    return NextResponse.json(response.data, { status: response.status })
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { 
          message: 'Error deleting inventory',
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
