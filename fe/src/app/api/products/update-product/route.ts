import { NextRequest, NextResponse } from 'next/server'

const CATALOG_SERVICE_URL = process.env.NEXT_PUBLIC_CATALOG_URL || 'http://13.229.29.52:5001'

/**
 * PUT /api/products/update-product?id={id} - Cập nhật product
 */
export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Missing product ID' },
        { status: 400 }
      )
    }

    const contentType = request.headers.get('content-type') || ''
    
    console.log('🔄 Forwarding PUT /api/products/update-product to:', CATALOG_SERVICE_URL)
    console.log('📋 Content-Type:', contentType)

    const authHeader = request.headers.get('authorization')
    const headers: HeadersInit = {}
    if (authHeader) {
      headers['Authorization'] = authHeader
    }
    if (contentType) {
      headers['Content-Type'] = contentType
    }

    // Forward raw body to preserve multipart boundary and exact payload format.
    const rawBody = await request.arrayBuffer()
    const backendBody: BodyInit | undefined = rawBody.byteLength > 0 ? rawBody : undefined

    console.log('📦 Forwarding update payload to backend')
    
    const response = await fetch(`${CATALOG_SERVICE_URL}/api/Product/Update-Product?id=${id}`, {
      method: 'PUT',
      headers,
      body: backendBody,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('❌ Backend error:', response.status, errorData)
      return NextResponse.json(errorData, { status: response.status })
    }

    const result = await response.json()
    console.log('✅ Update success:', result)
    return NextResponse.json(result, { status: 200 })
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
