import { NextRequest, NextResponse } from 'next/server'

const CATALOG_SERVICE_URL = process.env.NEXT_PUBLIC_CATALOG_URL || 'http://localhost:5001'

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
 * GET /api/Product/Get-All-Products
 * Proxy to backend: GET /api/Product/Get-All-Products
 */
export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${CATALOG_SERVICE_URL}/api/Product/Get-All-Products`, {
      method: 'GET',
      headers: {
        Accept: '*/*',
        Authorization: getAuthHeader(request),
      },
      cache: 'no-store',
    })

    const result = await parseResponseBody(response)
    return NextResponse.json(result, { status: response.status })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Product proxy error', error: error?.message ?? String(error) },
      { status: 500 }
    )
  }
}

