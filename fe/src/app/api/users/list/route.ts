import { NextRequest, NextResponse } from 'next/server'

const IAM_SERVICE_URL = process.env.NEXT_PUBLIC_IAM_URL || 'http://13.229.29.52:5000'

export async function GET(request: NextRequest) {
  try {
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

    const response = await fetch(`${IAM_SERVICE_URL}/api/users`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    })

    const raw = await response.text()
    let result: unknown = null

    if (raw && raw.trim()) {
      try {
        result = JSON.parse(raw)
      } catch {
        result = raw
      }
    }

    if (!response.ok) {
      return NextResponse.json(
        result ?? { success: false, message: 'Error fetching users list' },
        { status: response.status }
      )
    }

    return NextResponse.json(result ?? { success: true, data: [] }, { status: response.status })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'Không thể tải danh sách user từ IAM',
        details: error?.message,
      },
      { status: 500 }
    )
  }
}
