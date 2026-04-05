import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const token = request.headers.get('Authorization')
    const inventoryUrl = process.env.NEXT_PUBLIC_INVENTORY_URL || 'http://13.229.29.52:5003'

    console.log('Proxying request to:', `${inventoryUrl}/api/ProductBatch/batch/adjust-quantity`)
    console.log('Token:', token ? 'Present' : 'Missing')
    console.log('Body:', body)

    const response = await fetch(
      `${inventoryUrl}/api/ProductBatch/batch/adjust-quantity`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': token } : {}),
        },
        body: JSON.stringify(body),
      }
    )

    console.log('Backend response status:', response.status)

    const text = await response.text()
    console.log('Backend response text:', text)

    let data
    try {
      data = JSON.parse(text)
    } catch {
      data = { body: text }
    }

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error proxying request:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error details:', message)
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    )
  }
}
