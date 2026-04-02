import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/cashier/revenue/today
 * Returns the total revenue and percent change for today
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')
    
    // Call backend API (replace with your actual backend URL)
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
    const response = await fetch(`${backendUrl}/api/revenue/today`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: token }),
      },
    })

    if (!response.ok) {
      return NextResponse.json({ total: 0, percentChange: 0, error: 'Failed to fetch revenue' }, { status: 200 })
    }

    const data = await response.json()
    return NextResponse.json({ 
      total: data.total || 0,
      percentChange: data.percentChange || 0
    })
  } catch (error) {
    console.error('Revenue error:', error)
    return NextResponse.json({ total: 0, percentChange: 0, error: 'Server error' }, { status: 200 })
  }
}
