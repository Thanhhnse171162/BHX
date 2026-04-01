import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const INVENTORY_SERVICE_URL =
  process.env.INVENTORY_URL ||
  process.env.NEXT_PUBLIC_INVENTORY_URL ||
  'http://13.229.29.52:5003'

// Tạo axios instance với timeout
const axiosInstance = axios.create({
  timeout: 10000, // 10 giây timeout
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryString = searchParams.toString()
    const url = `${INVENTORY_SERVICE_URL}/api/inventory-checks${queryString ? `?${queryString}` : ''}`

    console.log('🔍 Calling inventory service:', {
      url,
      hasAuth: !!request.headers.get('authorization'),
      env: process.env.NODE_ENV,
      serviceUrl: INVENTORY_SERVICE_URL,
    })

    const response = await axiosInstance.get(url, {
      headers: {
        Authorization: request.headers.get('authorization') || '',
      },
    })

    return NextResponse.json(response.data, { status: response.status })
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Inventory service error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        code: error.code,
        url: error.config?.url,
      })
      
      return NextResponse.json(
        {
          message: 'Error fetching inventory checks',
          error: error.response?.data || error.message,
          details: {
            status: error.response?.status,
            code: error.code,
          },
        },
        { status: error.response?.status || 500 }
      )
    }

    console.error('❌ Unexpected error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const url = `${INVENTORY_SERVICE_URL}/api/inventory-checks`

    console.log('Creating inventory check with payload:', JSON.stringify(body, null, 2))

    const response = await axiosInstance.post(url, body, {
      headers: {
        Authorization: request.headers.get('authorization') || '',
        'Content-Type': 'application/json',
      },
    })

    console.log('Inventory check created successfully:', response.data)
    return NextResponse.json(response.data, { status: response.status })
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Inventory check creation failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      })
      return NextResponse.json(
        {
          success: false,
          message: error.response?.data?.message || 'Error creating inventory check',
          error: error.response?.data || error.message,
        },
        { status: error.response?.status || 500 }
      )
    }

    console.error('Unexpected error in POST /api/inventory-checks:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
