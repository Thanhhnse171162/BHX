import { NextRequest, NextResponse } from 'next/server'

const IAM_SERVICE_URL = process.env.NEXT_PUBLIC_IAM_URL || 'http://localhost:5000'

/**
 * GET /api/roles - Lấy tất cả roles từ Identity Service
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Forwarding GET /api/roles to:', IAM_SERVICE_URL)

    // Lấy token từ request headers
    const authHeader = request.headers.get('authorization')
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    const response = await fetch(`${IAM_SERVICE_URL}/api/roles`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error('❌ Backend error:', response.status, response.statusText)
      return NextResponse.json(
        { 
          success: false,
          error: `Backend returned ${response.status}` 
        },
        { status: response.status }
      )
    }

    const result = await response.json()
    // Backend có thể trả về { data: [...] } hoặc trực tiếp array
    const roles = result.data || result
    console.log('✅ Roles loaded:', roles.length, 'items')
    
    return NextResponse.json(roles, { status: 200 })
  } catch (error: any) {
    console.error('❌ Roles API Error:', error.message)
    return NextResponse.json(
      { 
        success: false,
        error: 'Không thể kết nối đến Identity Service.',
        details: error.message
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/roles - Tạo role mới
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🔍 Forwarding POST /api/roles to:', IAM_SERVICE_URL)

    // Lấy token từ request headers
    const authHeader = request.headers.get('authorization')
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    const response = await fetch(`${IAM_SERVICE_URL}/api/roles`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    const result = await response.json()
    
    if (!response.ok) {
      return NextResponse.json(result, { status: response.status })
    }

    const role = result.data || result
    console.log('✅ Role created:', role.id)
    return NextResponse.json(role, { status: response.status })
  } catch (error: any) {
    console.error('❌ Create Role Error:', error.message)
    return NextResponse.json(
      { 
        success: false,
        error: 'Không thể tạo role',
        details: error.message
      },
      { status: 500 }
    )
  }
}
