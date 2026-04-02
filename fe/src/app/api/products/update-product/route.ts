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
    let body: any
    
    console.log('🔄 Forwarding PUT /api/products/update-product to:', CATALOG_SERVICE_URL)
    console.log('📋 Content-Type:', contentType)

    const authHeader = request.headers.get('authorization')
    const headers: HeadersInit = {}
    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    // Handle both JSON and FormData
    if (contentType.includes('multipart/form-data')) {
      // Forward FormData as-is (with file uploads)
      const formData = await request.formData()
      const backendFormData = new FormData()
      
      // Copy all fields from formData to backendFormData
      for (const [key, value] of formData.entries()) {
        backendFormData.append(key, value)
      }

      console.log('📦 Update with files')
      
      const response = await fetch(`${CATALOG_SERVICE_URL}/api/Product/Update-Product?id=${id}`, {
        method: 'PUT',
        headers, // Don't set Content-Type for FormData, let fetch handle it
        body: backendFormData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Backend error:', response.status, errorData)
        return NextResponse.json(errorData, { status: response.status })
      }

      const result = await response.json()
      console.log('✅ Update success:', result)
      return NextResponse.json(result, { status: 200 })
    } else {
      // JSON payload
      body = await request.json()
      headers['Content-Type'] = 'application/json'
      
      console.log('📦 Update payload:', body)

      const response = await fetch(`${CATALOG_SERVICE_URL}/api/Product/Update-Product?id=${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Backend error:', response.status, errorData)
        return NextResponse.json(errorData, { status: response.status })
      }

      const result = await response.json()
      console.log('✅ Update success:', result)
      return NextResponse.json(result, { status: 200 })
    }
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
