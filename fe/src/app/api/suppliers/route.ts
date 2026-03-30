import { NextRequest, NextResponse } from 'next/server'

const CATALOG_SERVICE_URL = process.env.NEXT_PUBLIC_CATALOG_URL || 'http://13.229.29.52:5001'

function buildForwardHeaders(request: NextRequest): HeadersInit {
  const authHeader = request.headers.get('authorization')
  const cookieToken = request.cookies.get('auth_token')?.value

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: '*/*',
  }

  if (authHeader) {
    headers.Authorization = authHeader
  } else if (cookieToken) {
    headers.Authorization = `Bearer ${cookieToken}`
  }

  return headers
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const raw = await response.text()
  if (!raw || !raw.trim()) return null

  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

// GET /api/suppliers
export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${CATALOG_SERVICE_URL}/api/Supplier/suppliers`, {
      method: 'GET',
      headers: buildForwardHeaders(request),
      cache: 'no-store',
    })

    const payload = await parseResponseBody(response)
    if (!response.ok) {
      return NextResponse.json(payload ?? { error: 'Failed to fetch suppliers' }, { status: response.status })
    }

    return NextResponse.json(payload ?? [], { status: response.status })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'Không thể tải danh sách nhà cung cấp',
        details: error?.message,
      },
      { status: 500 }
    )
  }
}

// POST /api/suppliers
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetch(`${CATALOG_SERVICE_URL}/api/Supplier/suppliers/add`, {
      method: 'POST',
      headers: buildForwardHeaders(request),
      body: JSON.stringify(body),
    })

    const payload = await parseResponseBody(response)
    if (!response.ok) {
      return NextResponse.json(payload ?? { error: 'Failed to create supplier' }, { status: response.status })
    }

    return NextResponse.json(payload ?? {}, { status: response.status })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'Không thể tạo nhà cung cấp',
        details: error?.message,
      },
      { status: 500 }
    )
  }
}
