import { NextRequest, NextResponse } from 'next/server'

const CATALOG_SERVICE_URL = process.env.NEXT_PUBLIC_CATALOG_URL || 'http://localhost:5001'

/**
 * GET /api/categories/[id] - Lấy category theo ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    console.log('🔍 Forwarding GET /api/categories/:id to:', CATALOG_SERVICE_URL)

    const authHeader = request.headers.get('authorization')
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    const response = await fetch(`${CATALOG_SERVICE_URL}/api/Category/Get-Category-by-ID/${id}`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(errorData, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    console.error('❌ Get Category Error:', error.message)
    return NextResponse.json(
      { 
        success: false,
        error: 'Không thể lấy thông tin category',
        details: error.message
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/categories/[id] - Cập nhật category
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    console.log('🔍 Forwarding PUT /api/categories/:id to:', CATALOG_SERVICE_URL)

    const authHeader = request.headers.get('authorization')
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    const response = await fetch(`${CATALOG_SERVICE_URL}/api/Category/Update-Category-by-ID/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(errorData, { status: response.status })
    }

    const data = await response.json()
    console.log('✅ Category updated:', id)
    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    console.error('❌ Update Category Error:', error.message)
    return NextResponse.json(
      { 
        success: false,
        error: 'Không thể cập nhật category',
        details: error.message
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/categories/[id] - Xóa category
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    console.log('🔍 Forwarding DELETE /api/categories/:id to:', CATALOG_SERVICE_URL)

    const response = await fetch(`${CATALOG_SERVICE_URL}/api/Category/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(errorData, { status: response.status })
    }

    console.log('✅ Category deleted:', id)
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error('❌ Delete Category Error:', error.message)
    return NextResponse.json(
      { 
        success: false,
        error: 'Không thể xóa category',
        details: error.message
      },
      { status: 500 }
    )
  }
}
