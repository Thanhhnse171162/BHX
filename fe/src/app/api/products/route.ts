import { NextRequest, NextResponse } from 'next/server'

const CATALOG_SERVICE_URL = process.env.NEXT_PUBLIC_CATALOG_URL || 'http://localhost:5001'

/**
 * GET /api/products - Lấy tất cả products
 * Proxy request đến Product Service để tránh CORS
 */
export async function GET(_request: NextRequest) {
  try {
    console.log('🔍 Forwarding GET /api/products to:', CATALOG_SERVICE_URL)

    const response = await fetch(`${CATALOG_SERVICE_URL}/api/Product`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
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
    // Backend trả về { success, message, data: [...] }
    const products = result.data || []
    console.log('✅ Products fetched:', products.length, 'items')
    
    return NextResponse.json(products, { status: 200 })
  } catch (error: any) {
    console.error('❌ Product API Error:', error.message)
    return NextResponse.json(
      { 
        success: false,
        error: 'Không thể kết nối đến Product Service. Vui lòng kiểm tra backend đang chạy.',
        details: error.message
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/products - Tạo product mới
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🔍 Forwarding POST /api/products to:', CATALOG_SERVICE_URL)

    const response = await fetch(`${CATALOG_SERVICE_URL}/api/Product`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const result = await response.json()
    
    if (!response.ok) {
      return NextResponse.json(result, { status: response.status })
    }

    // Backend returns { success, message, data: {...} }
    const product = result.data || result
    console.log('✅ Product created:', product.id)
    return NextResponse.json(product, { status: response.status })
  } catch (error: any) {
    console.error('❌ Create Product Error:', error.message)
    return NextResponse.json(
      { 
        success: false,
        error: 'Không thể tạo product',
        details: error.message
      },
      { status: 500 }
    )
  }
}
