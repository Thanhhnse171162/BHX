import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const IAM_SERVICE_URL = process.env.NEXT_PUBLIC_IAM_URL || 'http://13.229.29.52:5000'

// DELETE /api/users/delete/[id] - Soft delete user via IAM service
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('📝 Delete user via IAM:', { id: params.id })

    // Get authorization header from request
    const authHeader = request.headers.get('authorization') || ''

    // Call IAM service to delete (soft delete) user
    const response = await fetch(`${IAM_SERVICE_URL}/api/users/${params.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: authHeader,
      },
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      console.error('❌ IAM service error:', response.status, data)
      return NextResponse.json(
        { error: data.error || `IAM service returned ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json().catch(() => ({ success: true }))
    console.log('✅ User deleted via IAM:', data)
    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    console.error('❌ Delete user error:', error)

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
      { error: `Failed to delete user: ${errorMessage}` },
      { status: 500 }
    )
  }
}
