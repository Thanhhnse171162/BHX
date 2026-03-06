import { NextRequest, NextResponse } from 'next/server'

const IDENTITY_SERVICE_URL = process.env.NEXT_PUBLIC_IAM_URL || 'http://localhost:5000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const authHeader = request.headers.get('authorization')

    console.log('🔍 Forwarding verify-email request to backend:', IDENTITY_SERVICE_URL)
    console.log('📤 Request body:', JSON.stringify(body, null, 2))

    // Try both formats - with email and without
    const backendPayload = {
      email: body.email || body.Email,
      otp: body.otp || body.Otp
    }

    console.log('📤 Backend payload:', JSON.stringify(backendPayload, null, 2))
    console.log('📤 Full URL:', `${IDENTITY_SERVICE_URL}/api/auth/verify-email`)

    const response = await fetch(`${IDENTITY_SERVICE_URL}/api/auth/verify-email`, {
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
      // Backend có thể trả về body rỗng hoặc HTML khi lỗi (401, 403, ...)
      data = {}
    }

    console.log('✅ Verify email response:', {
      status: response.status,
      ok: response.ok,
      data: data
    })

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: data.message || data.error || 'Xác thực email thất bại' 
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: data.message || 'Email verified successfully',
      data: data
    })
  } catch (error: any) {
    console.error('❌ Verify email error:', error)
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Không thể kết nối đến server. Vui lòng thử lại sau.'
      },
      { status: 500 }
    )
  }
}
