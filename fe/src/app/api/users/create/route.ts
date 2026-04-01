import { NextRequest, NextResponse } from 'next/server'

const IAM_SERVICE_URL = process.env.NEXT_PUBLIC_IAM_URL || 'http://13.229.29.52:5000'

// POST /api/users/create - Create user via IAM service
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fullName, email, password, roleName, phone, workplaceType, workplaceId } = body

    console.log('📝 Create user via IAM:', { fullName, email, roleName, workplaceType, workplaceId })

    if (!fullName || !email || !password || !roleName) {
      return NextResponse.json(
        { error: 'fullName, email, password, and roleName are required' },
        { status: 400 }
      )
    }

    // Get authorization header from request
    const authHeader = request.headers.get('authorization') || ''

    // Call IAM service to create user
    const response = await fetch(`${IAM_SERVICE_URL}/api/users/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        fullName,
        email,
        password,
        roleName,
        phone: phone || '',
        workplaceType: workplaceType || '',
        workplaceId: workplaceId || null,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ IAM service error:', response.status, data)
      return NextResponse.json(
        { error: data.error || `IAM service returned ${response.status}` },
        { status: response.status }
      )
    }

    console.log('✅ User created via IAM:', data)
    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('❌ Create user error:', error)

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
      { error: `Failed to create user: ${errorMessage}` },
      { status: 500 }
    )
  }
}
