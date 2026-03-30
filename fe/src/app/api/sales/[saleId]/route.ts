import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const SALES_SERVICE_URL = process.env.SALES_URL || process.env.NEXT_PUBLIC_SALES_URL || 'http://13.229.29.52:5006'

export async function GET(
  request: NextRequest,
  { params }: { params: { saleId: string } }
) {
  try {
    const saleId = params.saleId
    const authHeader = request.headers.get('authorization') || ''

    // Try common backend patterns for querying sale status by id.
    const candidates = [
      `${SALES_SERVICE_URL}/api/sales/${saleId}`,
      `${SALES_SERVICE_URL}/api/sales/simple/${saleId}`,
      `${SALES_SERVICE_URL}/api/sales/${saleId}/status`,
    ]

    for (const url of candidates) {
      const response = await axios.get(url, {
        headers: {
          Authorization: authHeader,
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
        validateStatus: () => true,
      })

      if (response.status >= 200 && response.status < 300) {
        return NextResponse.json(response.data, { status: response.status })
      }

      if (response.status !== 404) {
        return NextResponse.json(response.data, { status: response.status })
      }
    }

    return NextResponse.json(
      { message: 'Sale not found' },
      { status: 404 }
    )
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        {
          message: 'Error fetching sale status',
          error: error.response?.data || error.message,
        },
        { status: error.response?.status || 500 }
      )
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
