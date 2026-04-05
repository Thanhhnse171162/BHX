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
  storeId?: string
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

    // Extract YYYY-MM-DD part from any date string
    const dateMatch = String(dateStr).match(/(\d{4})-(\d{2})-(\d{2})/)
    if (!dateMatch) return false

    const [, yearStr, monthStr, dayStr] = dateMatch
    const year = parseInt(yearStr, 10)
    const month = parseInt(monthStr, 10)
    const day = parseInt(dayStr, 10)

    if (!year || !month || !day || isNaN(year) || isNaN(month) || isNaN(day)) return false

    // Get today's date in UTC
    const today = new Date()
    const todayYear = today.getUTCFullYear()
    const todayMonth = today.getUTCMonth() + 1
    const todayDay = today.getUTCDate()

    // Compare only the date part
    return year === todayYear && month === todayMonth && day === todayDay
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
              // Also filter by storeId if provided
              const matchesStore = !storeId || sale.storeId === storeId || (sale as any).storeId === storeId
              console.log(`[DEBUG] Sale ${sale.id} saleDate=${sale.saleDate} isToday=${isT} storeId=${(sale as any).storeId || sale.storeId} matchesStore=${matchesStore}`)
              return isT && matchesStore
            })
            .reduce((total: number, sale: SaleFromApi) => {
              // Try multiple possible field names for items/products
              const itemsArray = sale.items || (sale as any)?.lineItems || (sale as any)?.products || (sale as any)?.details || []
              const itemCount = itemsArray.reduce((sum: number, item: any) => {
                // Handle various possible quantity field names
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
