import { NextRequest, NextResponse } from 'next/server'

const IAM_SERVICE_URL = process.env.IAM_URL || process.env.NEXT_PUBLIC_IAM_URL || 'http://13.229.29.52:5000'

// GET /api/users - Proxy to IAM service
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    const response = await fetch(`${IAM_SERVICE_URL}/api/users`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(errorData, { status: response.status })
    }

    const result = await response.json()
    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: `Failed to fetch users: ${error.message}` },
      { status: 500 }
    )
  }
}

// POST /api/users - Proxy to IAM service
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const authHeader = request.headers.get('authorization')
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    const response = await fetch(`${IAM_SERVICE_URL}/api/users`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(errorData, { status: response.status })
    }

    const result = await response.json()
    return NextResponse.json(result, { status: response.status })
  } catch (error: any) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: `Failed to create user: ${error.message}` },
      { status: 500 }
    )
  }
}


