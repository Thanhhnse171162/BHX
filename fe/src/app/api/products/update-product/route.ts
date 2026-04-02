import { NextRequest, NextResponse } from 'next/server'

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
 * PUT /api/products/update-product?id={id} - Cập nhật product
 * Converts FormData to JSON and forwards to backend
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

    console.log('🔄 Forwarding PUT /api/products/update-product to:', CATALOG_SERVICE_URL)

    // Parse FormData and convert to JSON object (skip files)
    const formData = await request.formData()
    const jsonPayload: Record<string, unknown> = {}

    for (const [key, value] of formData.entries()) {
      // Skip file fields, only include text fields
      if (!(value instanceof File)) {
        // Convert boolean string values back to actual booleans
        if (value === 'true') {
          jsonPayload[key] = true
        } else if (value === 'false') {
          jsonPayload[key] = false
        } else {
          jsonPayload[key] = value
        }
      }
    }

    console.log('📋 Converted FormData to JSON:', JSON.stringify(jsonPayload, null, 2))

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
      body: JSON.stringify(jsonPayload),
    })

    const result = await parseResponseBody(response)

    if (!response.ok) {
      console.error('❌ Backend error:', response.status, result)
      return NextResponse.json(
        result ?? { success: false, error: `Backend returned ${response.status}` },
        { status: response.status }
      )
    }

    console.log('✅ Update success:', result)
    return NextResponse.json(result ?? { success: true }, { status: response.status })
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

