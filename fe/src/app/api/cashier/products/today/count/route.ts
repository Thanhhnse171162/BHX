import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export const dynamic = 'force-dynamic'

const SALES_SERVICE_URL = process.env.SALES_URL || process.env.NEXT_PUBLIC_SALES_URL || 'http://13.229.29.52:5006'

interface SaleItemFromApi {
  quantity: number
}

interface SaleFromApi {
  id: string
  saleDate: string
  items?: SaleItemFromApi[]
}

function getForwardAuthHeader(request: NextRequest): string {
  const authHeader = request.headers.get('authorization')
  if (authHeader) return authHeader

  const cookieToken = request.cookies.get('auth_token')?.value
  return cookieToken ? `Bearer ${cookieToken}` : ''
}

function isToday(dateStr: string): boolean {
  try {
    if (!dateStr) return false

    let date: Date

    // Try parsing as ISO string first
    if (typeof dateStr === 'string' && (dateStr.includes('T') || dateStr.includes('Z'))) {
      date = new Date(dateStr)
    } else if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      // Date-only format (YYYY-MM-DD)
      const [year, month, day] = dateStr.split('-').map(Number)
      if (!year || !month || !day) return false
      // Create date at midnight to avoid timezone issues
      date = new Date(year, month - 1, day, 0, 0, 0, 0)
    } else {
      return false
    }

    if (isNaN(date.getTime())) return false

    // Get today's date at midnight (local timezone)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get the passed date at midnight
    const compareDate = new Date(date)
    compareDate.setHours(0, 0, 0, 0)

    // Compare timestamps
    return compareDate.getTime() === today.getTime()
  } catch (error) {
    console.error('[DEBUG] Error in isToday:', error, 'dateStr:', dateStr)
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

          if (sales.length > 0) {
            console.log('[DEBUG] Sample sale data:', JSON.stringify(sales[0], null, 2))
            console.log('[DEBUG] First few saleDate values:', sales.slice(0, 3).map((s: SaleFromApi) => s.saleDate))
            console.log('[DEBUG] Today date:', new Date().toISOString())
          }

          // Count total items sold today - matching invoices/list logic
          count = sales
            .filter((sale: SaleFromApi) => {
              const isT = isToday(sale.saleDate)
              console.log(`[DEBUG] Sale ${sale.id} saleDate=${sale.saleDate} isToday=${isT}`)
              return isT
            })
            .reduce((total: number, sale: SaleFromApi) => {
              // Try multiple possible field names for items/products - same as invoices/list
              const itemsArray = sale.items || (sale as any)?.lineItems || (sale as any)?.products || []
              const itemCount = itemsArray.reduce((sum: number, item: any) => {
                // Handle various possible quantity field names - same as invoices/list
                const qty = item.quantity || item.qty || item.amount || item.quantity_ordered || 1
                return sum + Number(qty)
              }, 0)
              console.log(`[DEBUG] Sale ${sale.id} itemCount=${itemCount}`)
              return total + itemCount
            }, 0)

          console.log('[DEBUG] Final product count:', count)
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
    console.error('Error fetching product count:', error)
    return NextResponse.json({ count: 0, error: 'Failed to fetch product count' }, { status: 200 })
  }
}
