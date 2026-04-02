import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const SALES_SERVICE_URL = process.env.SALES_URL || process.env.NEXT_PUBLIC_SALES_URL || 'http://13.229.29.52:5006'

interface SaleItemFromApi {
  quantity: number
}

interface SaleFromApi {
  id: string
  saleNumber: string
  customerId: string | null
  saleDate: string
  status: string
  paymentStatus: string
  items: SaleItemFromApi[]
}

interface InvoiceListItem {
  id: string
  invoiceNumber: string
  customerName: string
  itemCount: number
  time: string
  status: string
}

function getForwardAuthHeader(request: NextRequest): string {
  const authHeader = request.headers.get('authorization')
  if (authHeader) return authHeader

  const cookieToken = request.cookies.get('auth_token')?.value
  return cookieToken ? `Bearer ${cookieToken}` : ''
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

    let invoices: InvoiceListItem[] = []
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

          // Filter today's invoices and format
          invoices = sales
            .filter((sale: SaleFromApi) => isToday(sale.saleDate))
            .sort((a: SaleFromApi, b: SaleFromApi) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime())
            .map((sale: SaleFromApi) => {
              const d = new Date(sale.saleDate)
              const itemCount = (sale.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0)
              const customerName = sale.customerId ? `KH ${sale.customerId.slice(0, 8)}` : 'Khách vãng lai'

              return {
                id: sale.id,
                invoiceNumber: sale.saleNumber || sale.id,
                customerName,
                itemCount,
                time: d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                status: mapOrderStatus(sale.status, sale.paymentStatus),
              }
            })

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
      invoices,
      count: invoices.length,
    })
  } catch (error) {
    console.error('Error fetching invoice list:', error)
    return NextResponse.json({
      invoices: [],
      count: 0,
      error: 'Failed to fetch invoices',
    })
  }
}
