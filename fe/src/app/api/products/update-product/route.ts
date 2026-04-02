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
 * Forwards FormData or JSON payload to backend depending on incoming content-type
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

    const contentType = request.headers.get('content-type') || ''
    const isFormData = contentType.includes('multipart/form-data')

    let body: BodyInit
    let logPayload: Record<string, unknown> = {}

    if (isFormData) {
      // Keep multipart body unchanged so backend model binding receives expected media type.
      const formData = await request.formData()
      body = formData

      for (const [key, value] of formData.entries()) {
        logPayload[key] = value instanceof File
          ? `[File: ${value.name || 'unnamed'}]`
          : value
      }
      console.log('📋 Forwarding FormData fields:', JSON.stringify(logPayload, null, 2))
    } else {
      const jsonPayload = await request.json().catch(() => null)
      if (!jsonPayload || typeof jsonPayload !== 'object') {
        return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 })
      }

      body = JSON.stringify(jsonPayload)
      logPayload = jsonPayload as Record<string, unknown>
      console.log('📋 Forwarding JSON payload:', JSON.stringify(logPayload, null, 2))
    }

    const authHeader = request.headers.get('authorization')
    const headers: HeadersInit = {}
    if (!isFormData) {
      headers['Content-Type'] = 'application/json'
    }
    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    const response = await fetch(`${CATALOG_SERVICE_URL}/api/Product/Update-Product?id=${id}`, {
      method: 'PUT',
      headers,
      body,
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Update Product Error:', message)
    return NextResponse.json(
      { 
        success: false,
        error: 'Không thể cập nhật product',
        details: message
      },
      { status: 500 }
    )
  }
}

