import { NextRequest, NextResponse } from 'next/server'

const IAM_SERVICE_URL = process.env.NEXT_PUBLIC_IAM_URL || 'http://localhost:5000'

/**
 * GET /api/roles/[id] - Lấy role theo ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    console.log('🔍 Forwarding GET /api/roles/:id to:', IAM_SERVICE_URL)

    // Lấy token từ request headers
    const authHeader = request.headers.get('authorization')
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    const response = await fetch(`${IAM_SERVICE_URL}/api/roles/${id}`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(errorData, { status: response.status })
    }

    const result = await response.json()
    const role = result.data || result
    return NextResponse.json(role, { status: 200 })
  } catch (error: any) {
    console.error('❌ Get Role Error:', error.message)
    return NextResponse.json(
      { 
        success: false,
        error: 'Không thể lấy thông tin role',
        details: error.message
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/roles/[id] - Cập nhật role
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    console.log('🔍 Forwarding PUT /api/roles/:id to:', IAM_SERVICE_URL)

    // Lấy token từ request headers
    const authHeader = request.headers.get('authorization')
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    const response = await fetch(`${IAM_SERVICE_URL}/api/roles/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(errorData, { status: response.status })
    }

    const result = await response.json()
    const role = result.data || result
    console.log('✅ Role updated:', id)
    return NextResponse.json(role, { status: 200 })
  } catch (error: any) {
    console.error('❌ Update Role Error:', error.message)
    return NextResponse.json(
      { 
        success: false,
        error: 'Không thể cập nhật role',
        details: error.message
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/roles/[id] - Xóa role
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    console.log('🔍 Forwarding DELETE /api/roles/:id to:', IAM_SERVICE_URL)

    // Lấy token từ request headers
    const authHeader = request.headers.get('authorization')
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    const response = await fetch(`${IAM_SERVICE_URL}/api/roles/${id}`, {
      method: 'DELETE',
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(errorData, { status: response.status })
    }

    console.log('✅ Role deleted:', id)
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error('❌ Delete Role Error:', error.message)
    return NextResponse.json(
      { 
        success: false,
        error: 'Không thể xóa role',
        details: error.message
      },
      { status: 500 }
    )
  }
}
