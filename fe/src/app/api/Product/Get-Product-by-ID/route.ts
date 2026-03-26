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
 * GET /api/Product/Get-Product-by-ID?id=...
 * Proxy to backend: GET /api/Product/Get-Product-by-ID?id=...
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id') || ''
    const qs = new URLSearchParams()
    if (id) qs.set('id', id)

    const response = await fetch(`${CATALOG_SERVICE_URL}/api/Product/Get-Product-by-ID?${qs.toString()}`, {
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

