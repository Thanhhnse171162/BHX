import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const INVENTORY_SERVICE_URL =
  process.env.INVENTORY_URL ||
  process.env.NEXT_PUBLIC_INVENTORY_URL ||
  process.env.NEXT_PUBLIC_INVENTORY_API_URL ||
  'http://13.229.29.52:5003'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const queryString = searchParams.toString()
    const url = `${INVENTORY_SERVICE_URL}/api/Warehouse${queryString ? `?${queryString}` : ''}`

    const authHeader = request.headers.get('authorization') || ''

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: '*/*',
        Authorization: authHeader,
      },
    })

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

    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error('Error fetching warehouses:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch warehouses',
        error: error.message
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, location, capacity, status, parentId } = body

    if (!name || !location || !capacity) {
      return NextResponse.json(
        {
          success: false,
          message: 'name, location, and capacity are required'
        },
        { status: 400 }
      )
    }

    // Proxy to backend /api/Warehouse/warehouses endpoint
    const url = `${INVENTORY_SERVICE_URL}/api/Warehouse/warehouses`
    const authHeader = request.headers.get('authorization') || ''

    // Flat payload - backend auto-sets createdBy from JWT
    const payload = {
      name,
      location,
      capacity,
      status: status || 'Active', // .NET API expects "Active"/"Inactive"
      parentId: parentId || null,
      // DO NOT include createdBy - backend auto-sets from JWT token
    }

    console.log('🔵 Creating warehouse:', { url, payload, hasAuth: !!authHeader })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(payload),
    })

    console.log('🟢 Backend response status:', response.status)

    // Read response body only once to avoid "Body has already been read" error
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

    console.log('✅ Warehouse created successfully')
    return NextResponse.json({ success: true, message: 'Warehouse created successfully', data }, { status: 200 })
  } catch (error: any) {
    console.error('❌ Error creating warehouse:', error.message, error.stack)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create warehouse',
        error: error.message
      },
      { status: 500 }
    )
  }
}
