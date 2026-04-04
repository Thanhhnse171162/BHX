import { NextRequest, NextResponse } from 'next/server'

const IAM_SERVICE_URL = process.env.NEXT_PUBLIC_IAM_URL || 'http://13.229.29.52:5000'

async function proxyIamRequest(request: NextRequest, path: string, init: RequestInit = {}) {
  const authHeader = request.headers.get('authorization') || ''
  const cookieToken = request.cookies.get('auth_token')?.value
  const authorization = authHeader || (cookieToken ? `Bearer ${cookieToken}` : '')

  const response = await fetch(`${IAM_SERVICE_URL}${path}`, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: authorization,
    },
  })

  const data = await response.json().catch(() => ({}))

  return { response, data }
}

// GET /api/users/[id] - Get user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { response, data } = await proxyIamRequest(
      request,
      `/api/users/details/${encodeURIComponent(params.id)}`
    )

    if (!response.ok) {
      const status = response.status === 404 ? 404 : response.status
      return NextResponse.json(
        { error: data.error || 'Failed to fetch user' },
        { status }
      )
    }

    return NextResponse.json(data.data || data)
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user from IAM service' },
      { status: 500 }
    )
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { response, data } = await proxyIamRequest(
      request,
      `/api/users/update/${encodeURIComponent(params.id)}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || `IAM service returned ${response.status}` },
        { status: response.status }
      )
    }

    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error('Update user error:', error)
    const errorMessage = error.message || String(error)
    const errorCode = error.code

    const isConnectionError = 
      errorMessage.includes('connect') ||
      errorMessage.includes('ENOTFOUND') ||
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('ETIMEDOUT') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('connection') ||
      errorCode === 'ESOCKET' ||
      errorCode === 'ENOTFOUND' ||
      errorCode === 'ECONNREFUSED' ||
      errorCode === 'ETIMEDOUT'

    if (isConnectionError) {
      console.warn('⚠️  IAM service unavailable on Vercel:', errorMessage)
      return NextResponse.json(
        { error: 'IAM service unavailable. User update is only available when the backend service is reachable.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: `Failed to update user: ${errorMessage}` },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { response, data } = await proxyIamRequest(
      request,
      `/api/users/${encodeURIComponent(params.id)}`,
      { method: 'DELETE' }
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || `IAM service returned ${response.status}` },
        { status: response.status }
      )
    }

    return NextResponse.json(data, { status: response.status || 200 })
  } catch (error: any) {
    console.error('Delete user error:', error)
    const errorMessage = error.message || String(error)
    const errorCode = error.code
    
    // Detect backend service connection issues
    const isConnectionError = 
      errorMessage.includes('connect') ||
      errorMessage.includes('ENOTFOUND') ||
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('ETIMEDOUT') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('connection') ||
      errorCode === 'ESOCKET' ||
      errorCode === 'ENOTFOUND' ||
      errorCode === 'ECONNREFUSED' ||
      errorCode === 'ETIMEDOUT'

    if (isConnectionError) {
      console.warn('⚠️  IAM service unavailable on Vercel:', errorMessage)
      return NextResponse.json(
        { error: 'IAM service unavailable. User deletion is only available when the backend service is reachable.' },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: `Failed to delete user: ${errorMessage}` },
      { status: 500 }
    )
  }
}


