import { NextRequest, NextResponse } from 'next/server'
import { getAllCategories as getAllCategoriesFromDb } from '@/lib/db/product-repository'

const CATALOG_SERVICE_URL = process.env.NEXT_PUBLIC_CATALOG_URL || 'http://13.229.29.52:5001'

async function parseResponseBody(response: Response) {
  const raw = await response.text()
  if (!raw || !raw.trim()) {
    return null
  }

  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

/**
 * GET /api/categories - Lấy tất cả categories từ backend
 * Fallback: Nếu backend response không có ID, đọc từ ProductDB local
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Forwarding GET /api/categories to:', CATALOG_SERVICE_URL)

    // Lấy token từ request headers
    const authHeader = request.headers.get('authorization')
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    const response = await fetch(`${CATALOG_SERVICE_URL}/api/Category/get-all-categories`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error('❌ Backend error:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('Error response:', errorText)
      // Fallback: try to load from ProductDB
      try {
        console.log('🔄 Fallback: Loading categories from ProductDB...')
        const dbCategories = await getAllCategoriesFromDb()
        return NextResponse.json(dbCategories, { status: 200 })
      } catch (dbError: any) {
        console.error('❌ ProductDB fallback also failed:', dbError.message)
        return NextResponse.json(
          { 
            success: false,
            error: `Backend returned ${response.status}`,
            details: errorText
          },
          { status: response.status }
        )
      }
    }

    const result = await response.json()
    console.log('✅ Backend response:', result)
    
    // Backend có thể trả về { data: [...] } hoặc trực tiếp array
    let categories = result.data || result
    if (!Array.isArray(categories)) {
      categories = []
    }
    
    console.log('✅ Categories loaded:', categories.length, 'items')
    
    // Check if categories have ID field
    const hasIdField = categories.length > 0 && 
      (categories[0].id || categories[0].ID || categories[0].Id || 
       categories[0].categoryId || categories[0].CategoryId || 
       categories[0].categoryID || categories[0].CategoryID)
    
    if (!hasIdField && categories.length > 0) {
      console.log('⚠️ Categories from backend do not have ID field. Fallback to ProductDB...')
      try {
        const dbCategories = await getAllCategoriesFromDb()
        console.log('✅ Loaded', dbCategories.length, 'categories from ProductDB')
        return NextResponse.json(dbCategories, { status: 200 })
      } catch (dbError: any) {
        console.error('❌ ProductDB fallback failed:', dbError.message)
        // Return backend data as-is if fallback fails
        return NextResponse.json(categories, { status: 200 })
      }
    }
    
    return NextResponse.json(categories, { status: 200 })
  } catch (error: any) {
    console.error('❌ Category API Error:', error.message)
    
    // Final fallback: try ProductDB
    try {
      console.log('🔄 Final fallback: Loading categories from ProductDB...')
      const dbCategories = await getAllCategoriesFromDb()
      return NextResponse.json(dbCategories, { status: 200 })
    } catch (dbError: any) {
      console.error('❌ All fallbacks failed:', dbError.message)
      return NextResponse.json(
        { 
          success: false,
          error: 'Không thể kết nối đến Category Service và ProductDB.',
          details: error.message
        },
        { status: 500 }
      )
    }
  }
}

/**
 * POST /api/categories - Tạo category mới
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🔍 Forwarding POST /api/categories to:', CATALOG_SERVICE_URL)

    // Lấy token từ request headers
    const authHeader = request.headers.get('authorization')
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    const response = await fetch(`${CATALOG_SERVICE_URL}/api/Category/add-category`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    const data = await parseResponseBody(response)
    
    if (!response.ok) {
      return NextResponse.json(
        data ?? { success: false, error: `Backend returned ${response.status}` },
        { status: response.status }
      )
    }

    if (typeof data === 'string') {
      return NextResponse.json(
        {
          success: true,
          message: data,
        },
        { status: response.status }
      )
    }

    return NextResponse.json(data ?? { success: true }, { status: response.status })
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
