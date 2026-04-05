import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    let authHeader = request.headers.get('Authorization') || ''
    const inventoryUrl = process.env.NEXT_PUBLIC_INVENTORY_URL || 'http://13.229.29.52:5003'

    // Ensure Bearer prefix is present
    if (authHeader && !authHeader.startsWith('Bearer ')) {
      authHeader = `Bearer ${authHeader}`
    }

    console.log('=== Adjust Batch Quantity Proxy ===')
    console.log('Target URL:', `${inventoryUrl}/api/ProductBatch/batch/adjust-quantity`)
    console.log('Auth Header:', authHeader ? `${authHeader.substring(0, 20)}...` : 'MISSING')
    console.log('Request Body:', JSON.stringify(body))

    const response = await fetch(
      `${inventoryUrl}/api/ProductBatch/batch/adjust-quantity`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { 'Authorization': authHeader } : {}),
        },
        body: JSON.stringify(body),
      }
    )

    console.log('Backend Status:', response.status)
    console.log('Backend Headers:', Object.fromEntries(response.headers.entries()))

    const text = await response.text()
    console.log('Backend Response:', text)

    let data
    try {
      data = JSON.parse(text)
    } catch {
      data = { error: text, status: response.status }
    }

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('=== Proxy Error ===')
    console.error('Error:', error)
    console.error('Stack:', error instanceof Error ? error.stack : 'N/A')
    
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
