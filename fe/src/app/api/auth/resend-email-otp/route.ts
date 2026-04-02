import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const IDENTITY_SERVICE_URL = process.env.NEXT_PUBLIC_IAM_URL || 'http://13.229.29.52:5000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const authHeader = request.headers.get('authorization')

    console.log('🔍 Forwarding resend-email-otp request to backend:', IDENTITY_SERVICE_URL)
    console.log('📤 Request body:', body)

    // Backend .NET mong đợi PascalCase
    const backendPayload = {
      Email: body.email || body.Email
    }

    console.log('📤 Backend payload:', backendPayload)

    const response = await fetch(`${IDENTITY_SERVICE_URL}/api/auth/resend-email-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(backendPayload),
    })

    let data: any = null
    try {
      data = await response.json()
    } catch {
      data = {}
    }

    console.log('📧 Resend email OTP response:', {
      status: response.status,
      success: data.success,
      message: data.message
    })

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('❌ Resend email OTP error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Không thể kết nối đến server. Vui lòng thử lại sau.'
      },
      { status: 500 }
    )
  }
}
