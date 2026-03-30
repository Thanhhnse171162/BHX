import { NextRequest, NextResponse } from 'next/server'

const IDENTITY_SERVICE_URL = process.env.NEXT_PUBLIC_IAM_URL || 'http://13.229.29.52:5000'

interface RegisterRequest {
  fullName?: string
  email?: string
  phone?: string
  password?: string
  confirmPassword?: string
  FullName?: string
  Email?: string
  Phone?: string
  Password?: string
  ConfirmPassword?: string
}

/**
 * Register API Route - Forward to Backend IAM Service
 * Backend IAM service will handle user creation and send OTP email
 */
export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json()

    console.log('📤 Register Request body:', body)

    // Transform to PascalCase for .NET backend
    const backendPayload = {
      FullName: body.fullName || body.FullName,
      Email: body.email || body.Email,
      Phone: body.phone || body.Phone || '',
      Password: body.password || body.Password,
      ConfirmPassword: body.confirmPassword || body.ConfirmPassword,
    }

    console.log('📤 Backend payload:', backendPayload)

    // Forward to Backend IAM Service
    const backendResponse = await fetch(`${IDENTITY_SERVICE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendPayload),
    })

    const responseData = await backendResponse.json()

    console.log('📧 Backend Response:', {
      status: backendResponse.status,
      data: responseData
    })

    if (!backendResponse.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: responseData.message || responseData.error || 'Đăng ký thất bại' 
        },
        { status: backendResponse.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: responseData.message || 'Đăng ký thành công! Vui lòng kiểm tra email để nhập mã OTP.',
      data: responseData.data || responseData,
    })
  } catch (error: any) {
    console.error('❌ Register API Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi server' },
      { status: 500 }
    )
  }
}
