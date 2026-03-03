import { NextRequest, NextResponse } from 'next/server'

interface LoginRequest {
  email: string
  password: string
}

const IDENTITY_SERVICE_URL = process.env.NEXT_PUBLIC_IAM_URL || 'http://127.0.0.1:5000'

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Email và mật khẩu là bắt buộc' 
        },
        { status: 400 }
      )
    }

    console.log('🔍 Forwarding login request to backend:', IDENTITY_SERVICE_URL)

    // Forward request to backend IdentityService
    // Chú ý: Backend ASP.NET Core dùng /api/Auth/login (chữ A viết HOA)
    const response = await fetch(`${IDENTITY_SERVICE_URL}/api/Auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    console.log('🔐 Backend response:', {
      status: response.status,
      success: data.success,
    })

    // Return backend response to client
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Không thể kết nối đến server. Vui lòng thử lại sau.' 
      },
      { status: 500 }
    )
  }
} 
     
