import { NextRequest, NextResponse } from 'next/server'

const IAM_SERVICE_URL = process.env.NEXT_PUBLIC_IAM_URL || 'http://13.229.29.52:5000'

// PUT /api/users/update/[id] - Update user via IAM service
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { email, fullName, roleId, workplaceType, workplaceId } = body

    console.log('📝 Update user via IAM:', { id: params.id, email, fullName, roleId, workplaceType, workplaceId })

    if (!email && !fullName && roleId === undefined && !workplaceType && !workplaceId) {
      return NextResponse.json(
        { error: 'At least one field to update is required' },
        { status: 400 }
      )
    }

    // Get authorization header from request
    const authHeader = request.headers.get('authorization') || ''

    // Build payload with only provided fields
    const payload: any = {}
    if (email) payload.email = email
    if (fullName) payload.fullName = fullName
    if (roleId !== undefined && roleId !== null) payload.roleId = roleId
    if (workplaceType) payload.workplaceType = workplaceType
    if (workplaceId) payload.workplaceId = workplaceId

    // Call IAM service to update user
    const response = await fetch(`${IAM_SERVICE_URL}/api/users/update/${params.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ IAM service error:', response.status, data)
      return NextResponse.json(
        { error: data.error || `IAM service returned ${response.status}` },
        { status: response.status }
      )
    }

    console.log('✅ User updated via IAM:', data)
    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    console.error('❌ Update user error:', error)

    const errorMessage = error.message || String(error)
    const errorCode = error.code

    // Detect connection errors
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
      console.warn('⚠️  IAM service unavailable:', errorMessage)
      return NextResponse.json(
        { error: 'IAM service unavailable. Please try again later.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: `Failed to update user: ${errorMessage}` },
      { status: 500 }
    )
  }
}

