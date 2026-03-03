import { NextRequest, NextResponse } from 'next/server'

const CATALOG_SERVICE_URL = process.env.NEXT_PUBLIC_CATALOG_URL || 'http://localhost:5001'

/**
 * GET /api/categories - Lấy tất cả categories
 * WORKAROUND: Backend không có GET /api/Category endpoint
 * Lấy categories từ products thay vì
 */
export async function GET(_request: NextRequest) {
  try {
    console.log('🔍 Forwarding GET /api/categories (via products) to:', CATALOG_SERVICE_URL)

    // Backend không có GET /api/Category, phải lấy từ products
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
    const products = result.data || []
    
    // Extract unique categories từ products
    const categoriesMap = new Map()
    products.forEach((product: any) => {
      if (product.categoryId && !categoriesMap.has(product.categoryId)) {
        categoriesMap.set(product.categoryId, {
          id: product.categoryId,
          name: product.categoryName,
          description: null,
          parentId: null,
          parentName: null,
          level: 1,
          displayOrder: 0,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      }
    })
    
    const categories = Array.from(categoriesMap.values())
    console.log('✅ Categories extracted from products:', categories.length, 'items')
    
    return NextResponse.json(categories, { status: 200 })
  } catch (error: any) {
    console.error('❌ Category API Error:', error.message)
    return NextResponse.json(
      { 
        success: false,
        error: 'Không thể kết nối đến Category Service.',
        details: error.message
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/categories - Tạo category mới
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🔍 Forwarding POST /api/categories to:', CATALOG_SERVICE_URL)

    const response = await fetch(`${CATALOG_SERVICE_URL}/api/Category`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    console.log('✅ Category created:', data.id)
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error('❌ Create Category Error:', error.message)
    return NextResponse.json(
      { 
        success: false,
        error: 'Không thể tạo category',
        details: error.message
      },
      { status: 500 }
    )
  }
}
