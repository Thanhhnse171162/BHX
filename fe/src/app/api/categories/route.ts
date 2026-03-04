import { NextRequest, NextResponse } from 'next/server'

const CATALOG_SERVICE_URL = process.env.NEXT_PUBLIC_CATALOG_URL || 'http://localhost:5001'

/**
 * GET /api/categories - Lấy tất cả categories từ backend
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
      return NextResponse.json(
        { 
          success: false,
          error: `Backend returned ${response.status}`,
          details: errorText
        },
        { status: response.status }
      )
    }

    const result = await response.json()
    console.log('✅ Backend response:', result)
    
    // Backend có thể trả về { data: [...] } hoặc trực tiếp array
    const categories = result.data || result
    console.log('✅ Categories loaded:', categories.length, 'items')
    
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
