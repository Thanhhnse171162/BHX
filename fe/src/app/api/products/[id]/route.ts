import { NextRequest, NextResponse } from 'next/server'

const CATALOG_SERVICE_URL = process.env.NEXT_PUBLIC_CATALOG_URL || 'http://13.229.29.52:5001'

/**
 * GET /api/products/[id] - Lấy product theo ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    console.log('🔍 Forwarding GET /api/products/:id to:', CATALOG_SERVICE_URL)

    const authHeader = request.headers.get('authorization')
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    const response = await fetch(`${CATALOG_SERVICE_URL}/api/Product/Get-Product-by-ID?id=${id}`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(errorData, { status: response.status })
    }

    const result = await response.json()
    // Backend returns { success, message, data: {...} }
    const product = result.data || result
    return NextResponse.json(product, { status: 200 })
  } catch (error: any) {
    console.error('❌ Get Product Error:', error.message)
    return NextResponse.json(
      { 
        success: false,
        error: 'Không thể lấy thông tin product',
        details: error.message
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/products/[id] - Cập nhật product
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    console.log('🔍 Forwarding PUT /api/products/:id to:', CATALOG_SERVICE_URL)

    const authHeader = request.headers.get('authorization')
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    const response = await fetch(`${CATALOG_SERVICE_URL}/api/Product/Update-Product?id=${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(errorData, { status: response.status })
    }

    const result = await response.json()
    // Backend returns { success, message, data: {...} }
    const product = result.data || result
    console.log('✅ Product updated:', id)
    return NextResponse.json(product, { status: 200 })
  } catch (error: any) {
    console.error('❌ Update Product Error:', error.message)
    return NextResponse.json(
      { 
        success: false,
        error: 'Không thể cập nhật product',
        details: error.message
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/products/[id] - Xóa product
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    console.log('🔍 Forwarding DELETE /api/products/:id to:', CATALOG_SERVICE_URL)

    const authHeader = request.headers.get('authorization')
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    const response = await fetch(`${CATALOG_SERVICE_URL}/api/Product/Delete-Product?id=${id}`, {
      method: 'DELETE',
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(errorData, { status: response.status })
    }

    console.log('✅ Product deleted:', id)
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error('❌ Delete Product Error:', error.message)
    return NextResponse.json(
      { 
        success: false,
        error: 'Không thể xóa product',
        details: error.message
      },
      { status: 500 }
    )
  }
}
