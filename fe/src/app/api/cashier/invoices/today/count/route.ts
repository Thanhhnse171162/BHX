import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/cashier/invoices/today/count
 * Returns the count of invoices created today for the current store/cashier
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')
    
    // Call backend API (replace with your actual backend URL)
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
    const response = await fetch(`${backendUrl}/api/invoices/today/count`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: token }),
      },
    })

    if (!response.ok) {
      return NextResponse.json({ count: 0, error: 'Failed to fetch invoice count' }, { status: 200 })
    }

    const data = await response.json()
    return NextResponse.json({ count: data.count || 0 })
  } catch (error) {
    console.error('Invoice count error:', error)
    return NextResponse.json({ count: 0, error: 'Server error' }, { status: 200 })
  }
}
