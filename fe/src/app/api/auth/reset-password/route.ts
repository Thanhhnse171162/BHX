import { NextRequest, NextResponse } from 'next/server'

const IDENTITY_SERVICE_URL = process.env.NEXT_PUBLIC_IAM_URL || 'http://localhost:5000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('🔍 Forwarding reset-password request to backend:', IDENTITY_SERVICE_URL)
    console.log('📤 Request body:', body)

    // Backend .NET mong đợi PascalCase
    const backendPayload = {
      Email: body.email || body.Email,
      Otp: body.otp || body.Otp,
      NewPassword: body.newPassword || body.NewPassword
    }

    console.log('📤 Backend payload:', backendPayload)

    const response = await fetch(`${IDENTITY_SERVICE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendPayload),
    })

    const data = await response.json()

    console.log('🔐 Reset password response:', {
      status: response.status,
      success: data.success,
      message: data.message
    })

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('❌ Reset password error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Không thể kết nối đến server. Vui lòng thử lại sau.'
      },
      { status: 500 }
    )
  }
}
