import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const SALES_SERVICE_URL = process.env.SALES_URL || process.env.NEXT_PUBLIC_SALES_URL || 'http://13.229.29.52:5006'

interface SaleFromApi {
  id: string
  saleDate: string
  status?: string
  paymentStatus?: string
  totalAmount?: number
  subtotal?: number
}

function getForwardAuthHeader(request: NextRequest): string {
  const authHeader = request.headers.get('authorization')
  if (authHeader) return authHeader

  const cookieToken = request.cookies.get('auth_token')?.value
  return cookieToken ? `Bearer ${cookieToken}` : ''
}

function isToday(dateStr: string): boolean {
  try {
    // Parse date string more robustly
    // Handle formats like: "2026-04-02T10:30:00", "2026-04-02", "2026-04-02T10:30:00Z", etc.
    let date: Date
    
    if (dateStr.includes('T')) {
      // ISO format with time
      date = new Date(dateStr)
    } else {
      // Date-only format (YYYY-MM-DD)
      // Parse manually to avoid timezone issues
      const [year, month, day] = dateStr.split('-').map(Number)
      if (!year || !month || !day) return false
      date = new Date(year, month - 1, day)
    }

    if (isNaN(date.getTime())) return false

    const today = new Date()

    // Compare using local dates to avoid timezone issues
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    )
  } catch {
    return false
  }
}

function mapOrderStatus(status: string | null, paymentStatus: string | null): string {
  if (!status) return 'Đang xử lý'

  const s = String(status).toUpperCase()
  const p = String(paymentStatus || '').toUpperCase()

  if (s.includes('CANCEL')) return 'Đã hủy'
  if (s.includes('RETURN')) return 'Đã trả'
  if (s.includes('COMPLETE') || s.includes('SUCCESS') || p === 'PAID' || p === 'COMPLETED' || p === 'SUCCESS')
    return 'Thành công'

  return 'Đang xử lý'
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

    let total = 0
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

          // Calculate revenue from today's successful orders
          total = sales
            .filter((sale: SaleFromApi) => isToday(sale.saleDate))
            .filter((sale: SaleFromApi) => {
              const status = mapOrderStatus(sale.status || null, sale.paymentStatus || null)
              return status === 'Thành công'
            })
            .reduce((sum: number, sale: SaleFromApi) => sum + (sale.totalAmount || sale.subtotal || 0), 0)

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

    return NextResponse.json({
      total,
      percentChange: 0,
    })
  } catch (error) {
    console.error('Error fetching revenue:', error)
    return NextResponse.json({ total: 0, percentChange: 0, error: 'Failed to fetch revenue' }, { status: 200 })
  }
}
