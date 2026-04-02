import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const SALES_SERVICE_URL = process.env.SALES_URL || process.env.NEXT_PUBLIC_SALES_URL || 'http://13.229.29.52:5006'

function getForwardAuthHeader(request: NextRequest): string {
  const authHeader = request.headers.get('authorization')
  if (authHeader) return authHeader

  const cookieToken = request.cookies.get('auth_token')?.value
  return cookieToken ? `Bearer ${cookieToken}` : ''
}

function isToday(dateStr: string): boolean {
  try {
    const date = new Date(dateStr)
    const today = new Date()

    return (
      date.getUTCFullYear() === today.getUTCFullYear() &&
      date.getUTCMonth() === today.getUTCMonth() &&
      date.getUTCDate() === today.getUTCDate()
    )
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = getForwardAuthHeader(request)
    const storeId = request.nextUrl.searchParams.get('storeId')

    // Fetch all sales
    const urls = [
      storeId ? `${SALES_SERVICE_URL}/api/sales?storeId=${encodeURIComponent(storeId)}` : null,
      storeId ? `${SALES_SERVICE_URL}/api/sales/store/${encodeURIComponent(storeId)}` : null,
      `${SALES_SERVICE_URL}/api/sales`,
    ].filter(Boolean) as string[]

    let count = 0
    let found = false

    for (const url of urls) {
      try {
        const response = await axios.get(url, {
          headers: {
            Authorization: authHeader,
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
            Accept: 'application/json',
          },
          validateStatus: () => true,
        })

        if (response.status >= 200 && response.status < 300) {
          const data = response.data
          const sales = Array.isArray(data) ? data : data?.data || []

          // Count today's invoices
          count = sales.filter((sale: any) => isToday(sale.saleDate)).length

          found = true
          break
        }

        if (response.status !== 404) {
          break
        }
      } catch (error) {
        console.error(`Error fetching from ${url}:`, error)
        if (!found) {
          continue
        }
      }
    }

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Error fetching invoice count:', error)
    return NextResponse.json({ count: 0, error: 'Failed to fetch invoice count' }, { status: 200 })
  }
}
