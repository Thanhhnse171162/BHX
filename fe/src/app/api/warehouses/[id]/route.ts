import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const INVENTORY_SERVICE_URL =
  process.env.INVENTORY_URL ||
  process.env.NEXT_PUBLIC_INVENTORY_URL ||
  process.env.NEXT_PUBLIC_INVENTORY_API_URL ||
  'http://13.229.29.52:5003'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, location, capacity, status, parentId } = body
    const { id } = params

    if (!name || !location || !capacity) {
      return NextResponse.json(
        {
          success: false,
          message: 'name, location, and capacity are required'
        },
        { status: 400 }
      )
    }

    // Proxy to backend /api/Warehouse/warehouses/{id} endpoint
    const url = `${INVENTORY_SERVICE_URL}/api/Warehouse/warehouses/${id}`
    const authHeader = request.headers.get('authorization') || ''

    // Flat payload
    const payload = {
      name,
      location,
      capacity,
      status: status || 'ACTIVE',
      parentId: parentId || null,
    }

    console.log('🔵 Updating warehouse:', { url, id, payload })

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(payload),
    })

    console.log('🟢 Backend response status:', response.status)

    let responseText = ''
    try {
      responseText = await response.text()
    } catch (error) {
      console.error('❌ Failed to read response body:', error)
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to read backend response',
          error: String(error)
        },
        { status: 500 }
      )
    }

    let data: any = {}
    if (responseText) {
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error('❌ Failed to parse response JSON:', parseError)
        console.error('Response text:', responseText)
      }
    }

    if (!response.ok) {
      const errorMessage = data.message || data.error || responseText || 'Unknown error'
      console.error('❌ Backend returned error:', { status: response.status, message: errorMessage })
      
      if (response.status === 401) {
        return NextResponse.json(
          {
            success: false,
            message: 'Unauthorized - please login with admin/warehouse admin account',
            error: errorMessage
          },
          { status: 401 }
        )
      }
      
      return NextResponse.json(
        {
          success: false,
          message: errorMessage,
          data
        },
        { status: response.status }
      )
    }

    console.log('✅ Warehouse updated successfully')
    return NextResponse.json({ success: true, message: 'Warehouse updated successfully', data }, { status: 200 })
  } catch (error: any) {
    console.error('❌ Error updating warehouse:', error.message)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update warehouse',
        error: error.message
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Proxy to backend /api/Warehouse/warehouses/{id} endpoint
    const url = `${INVENTORY_SERVICE_URL}/api/Warehouse/warehouses/${id}`
    const authHeader = request.headers.get('authorization') || ''

    console.log('🔵 Deleting warehouse:', { url, id })

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: authHeader,
      },
    })

    console.log('🟢 Backend response status:', response.status)

    let responseText = ''
    try {
      responseText = await response.text()
    } catch (error) {
      console.error('❌ Failed to read response body:', error)
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to read backend response',
          error: String(error)
        },
        { status: 500 }
      )
    }

    let data: any = {}
    if (responseText) {
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error('❌ Failed to parse response JSON:', parseError)
        console.error('Response text:', responseText)
      }
    }

    if (!response.ok) {
      const errorMessage = data.message || data.error || responseText || 'Unknown error'
      console.error('❌ Backend returned error:', { status: response.status, message: errorMessage })
      
      if (response.status === 401) {
        return NextResponse.json(
          {
            success: false,
            message: 'Unauthorized - please login with admin/warehouse admin account',
            error: errorMessage
          },
          { status: 401 }
        )
      }
      
      return NextResponse.json(
        {
          success: false,
          message: errorMessage,
          data
        },
        { status: response.status }
      )
    }

    console.log('✅ Warehouse deleted successfully')
    return NextResponse.json({ success: true, message: 'Warehouse deleted successfully', data }, { status: response.status })
  } catch (error: any) {
    console.error('Error deleting warehouse:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete warehouse',
        error: error.message
      },
      { status: 500 }
    )
  }
}
