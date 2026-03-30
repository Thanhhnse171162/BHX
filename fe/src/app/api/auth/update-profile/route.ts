import { NextRequest, NextResponse } from 'next/server'

const IDENTITY_SERVICE_URL = process.env.NEXT_PUBLIC_IAM_URL || 'http://13.229.29.52:5000'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const authHeader = request.headers.get('authorization')

    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🔍 Forwarding update-profile request to backend:', IDENTITY_SERVICE_URL)
    console.log('📤 Request body:', body)

    // Backend .NET mong đợi PascalCase
    const backendPayload = {
      Name: body.name || body.Name,
      Email: body.email || body.Email,
      Phone: body.phone || body.Phone, // Backend cần Phone để update
    }

    console.log('📤 Backend payload:', backendPayload)

    const response = await fetch(`${IDENTITY_SERVICE_URL}/api/auth/update-profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(backendPayload),
    })

    const data = await response.json()

    console.log('🔐 Update profile response:', {
      status: response.status,
      success: data.success,
      message: data.message
    })

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('❌ Update profile error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Không thể kết nối đến server. Vui lòng thử lại sau.'
      },
      { status: 500 }
    )
  }
}
