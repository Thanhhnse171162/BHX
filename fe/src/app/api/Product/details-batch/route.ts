import { NextRequest, NextResponse } from 'next/server'

const CATALOG_SERVICE_URL = process.env.NEXT_PUBLIC_CATALOG_URL || 'http://13.229.29.52:5001'

function getAuthHeader(request: NextRequest) {
  return request.headers.get('authorization') || ''
}

async function parseResponseBody(response: Response) {
  const raw = await response.text()
  if (!raw || !raw.trim()) return null
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

/**
 * POST /api/Product/details-batch
 * Proxy to backend: POST /api/Product/details-batch
 *
 * NOTE: Request/Response schema is NOT confirmed in prompt.
 * We pass-through body and response "as-is".
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))

    const response = await fetch(`${CATALOG_SERVICE_URL}/api/Product/details-batch`, {
      method: 'POST',
      headers: {
        Accept: '*/*',
        Authorization: getAuthHeader(request),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const result = await parseResponseBody(response)
    return NextResponse.json(result, { status: response.status })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Product details-batch proxy error', error: error?.message ?? String(error) },
      { status: 500 }
    )
  }
}
