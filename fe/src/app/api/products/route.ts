import { NextRequest, NextResponse } from 'next/server'

const CATALOG_SERVICE_URL = process.env.NEXT_PUBLIC_CATALOG_URL || 'http://13.229.29.52:5001'

async function parseResponseBody(response: Response) {
  const raw = await response.text()

  // Some backend endpoints can return an empty body (e.g. 201/204)
  // or a non-JSON payload even when request succeeded.
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
 * GET /api/products - Lấy tất cả products
 * Proxy request đến Product Service để tránh CORS
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Forwarding GET /api/products to:', CATALOG_SERVICE_URL)

    // Lấy token từ request headers
    const authHeader = request.headers.get('authorization')
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    const response = await fetch(`${CATALOG_SERVICE_URL}/api/Product/Get-All-Products`, {
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

    const result = await parseResponseBody(response)
    // Backend trả về { success, message, data: [...] }
    const products = result && typeof result === 'object' && 'data' in result
      ? (result as any).data || []
      : Array.isArray(result)
        ? result
        : []
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
    console.log('🔍 Forwarding POST /api/products to:', CATALOG_SERVICE_URL)

    // Lấy token từ request headers
    const authHeader = request.headers.get('authorization')
    const incomingContentType = request.headers.get('content-type')
    const incomingContentLength = request.headers.get('content-length')
    const headers: HeadersInit = {}
    
    console.log('📦 Incoming create product content-type:', incomingContentType)
    console.log('📏 Incoming create product content-length:', incomingContentLength)
    console.log('🔐 Authorization header:', authHeader ? `present (${authHeader.substring(0, 30)}...)` : '❌ MISSING')
    
    if (authHeader) {
      headers['Authorization'] = authHeader
      console.log('✅ Authorization attached to backend request')
    } else {
      console.log('⚠️ No authorization header found in request')
    }

    if (incomingContentType) {
      headers['Content-Type'] = incomingContentType
    }

    // Forward raw body to preserve multipart boundary and exact payload format.
    const rawBody = await request.arrayBuffer()
    const backendBody: BodyInit | undefined = rawBody.byteLength > 0 ? rawBody : undefined

    const response = await fetch(`${CATALOG_SERVICE_URL}/api/Product/Add-Product`, {
      method: 'POST',
      headers,
      body: backendBody,
    })

    const result = await parseResponseBody(response)
    
    if (!response.ok) {
      console.error('❌ Backend create product failed:', {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type'),
        body: result,
      })
      return NextResponse.json(
        result ?? { success: false, error: `Backend returned ${response.status}` },
        { status: response.status }
      )
    }

    // Backend returns { success, message, data: {...} }
    const product = result && typeof result === 'object' && 'data' in result
      ? (result as any).data
      : result

    console.log('✅ Product created:', product && typeof product === 'object' ? (product as any).id : 'unknown-id')
    return NextResponse.json(
      product ?? { success: true, message: 'Product created successfully' },
      { status: response.status }
    )
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
