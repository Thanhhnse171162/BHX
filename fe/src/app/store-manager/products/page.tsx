'use client'

import { useEffect, useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import useAuthStore from '@/store/auth.store'
import { InventoryAPIService, type InventoryItem } from '@/services/inventory-api.service'
import { ProductAPIService, type ProductFromAPI } from '@/services/product-api.service'
import { Button } from '@/shared/ui/Button'
import { localApiClient } from '@/shared/api/http'

function normalizeId(value?: string | null) {
  return String(value || '').trim().toLowerCase()
}

function resolveLocationContext(user: ReturnType<typeof useAuthStore.getState>['user']) {
  const normalizedType =
    user?.workplaceType ||
    ((user as any)?.workplace_type as string | undefined) ||
    ((user as any)?.workplace?.type as string | undefined) ||
    (user?.storeId ? 'STORE' : user?.warehouseId ? 'WAREHOUSE' : undefined)

  const normalizedId =
    user?.workplaceId ||
    ((user as any)?.workplace_id as string | undefined) ||
    ((user as any)?.workplace?.id as string | undefined) ||
    user?.storeLocationId ||
    user?.storeId ||
    user?.warehouseId ||
    ''

  const locationType = String(normalizedType || '').trim().toUpperCase()
  const locationId = String(normalizedId || '').trim()

  if (locationType !== 'STORE' && locationType !== 'WAREHOUSE') {
    return { locationType: '', locationId: '' }
  }

  return { locationType, locationId }
}

function formatDateTime(value?: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('vi-VN')
}

export default function StoreManagerProductsPage() {
  const PAGE_SIZE = 10
  const { user, token } = useAuthStore()
  const [rows, setRows] = useState<InventoryItem[]>([])
  const [productMap, setProductMap] = useState<Record<string, ProductFromAPI>>({})
  const [locationMap, setLocationMap] = useState<Record<string, string>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { locationType, locationId } = useMemo(() => resolveLocationContext(user), [user])

  const fetchInventory = async () => {
    if (!token) {
      setRows([])
      setError('Bạn chưa đăng nhập.')
      setIsLoading(false)
      return
    }

    if (!locationType || !locationId) {
      setRows([])
      setError('Không xác định được locationType/locationId từ tài khoản đăng nhập.')
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const [data, products, locations] = await Promise.all([
        InventoryAPIService.getInventoryByLocation(locationType as 'STORE' | 'WAREHOUSE', locationId),
        ProductAPIService.getAllProducts().catch(() => []),
        localApiClient.get('/warehouses?status=ACTIVE&is_deleted=0').catch(() => ({ data: [] as any })),
      ])

      const pMap: Record<string, ProductFromAPI> = {}
      for (const product of products) {
        const key = normalizeId(product.id)
        if (key) pMap[key] = product
      }

      const locationPayload = (locations as any)?.data
      const locationList =
        Array.isArray(locationPayload?.data) ? locationPayload.data :
        Array.isArray(locationPayload) ? locationPayload :
        []

      const lMap: Record<string, string> = {}
      for (const location of locationList) {
        const key = normalizeId((location as any)?.id)
        const name = String((location as any)?.name || '').trim()
        if (key && name) lMap[key] = name
      }

      const userLocationName =
        String((user as any)?.workplace?.name || (user as any)?.storeName || '').trim()
      if (locationId && userLocationName) {
        lMap[normalizeId(locationId)] = userLocationName
      }

      setProductMap(pMap)
      setLocationMap(lMap)
      setRows(Array.isArray(data) ? data : [])
      setCurrentPage(1)
    } catch (err: any) {
      setRows([])
      const message = err?.response?.data?.message || err?.message || 'Không tải được dữ liệu inventory.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchInventory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, locationType, locationId, user])

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const pagedRows = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE
    return rows.slice(start, start + PAGE_SIZE)
  }, [rows, safeCurrentPage])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }

  const getInventoryLabel = (item: InventoryItem, index: number) => {
    const sequence = String(index + 1).padStart(4, '0')
    if (item.isLowStock) return `INV-LS-${sequence}`
    return `INV-${sequence}`
  }

  const getProductLabel = (item: InventoryItem) => {
    const fromNested = String(item.product?.name || '').trim()
    if (fromNested) return fromNested

    const fromFlat = String(item.productName || item.name || '').trim()
    if (fromFlat) return fromFlat

    const mapped = productMap[normalizeId(item.productId)]
    if (mapped?.name) return mapped.name

    return 'Sản phẩm chưa rõ tên'
  }

  const getLocationLabel = (item: InventoryItem) => {
    const key = normalizeId(item.locationId)
    return locationMap[key] || `${item.locationType} hiện tại`
  }

  return (
    <div className="p-6 space-y-4 bg-[#f5f7fb] min-h-screen">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[30px] leading-[32px] font-extrabold text-slate-900">Sản phẩm theo cửa hàng</h1>
          <p className="text-xs text-slate-500 mt-1">
            locationType: <span className="font-semibold">{locationType || '-'}</span> 
            
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchInventory} className="gap-2" disabled={isLoading}>
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Làm mới
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {[
                  'Inventory',
                  'Sản phẩm',
                  'Location Type',
                  'Vị trí',
                  'Quantity',
                  'Reserved Qty',
                  'Available Qty',
                  'Min Stock',
                  'Max Stock',
                  'Low Stock',
                  'Last Stock Check',
                  'Updated At',
                ].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-gray-400 text-[13px]">Đang tải dữ liệu...</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-gray-400 text-[13px]">Không có dữ liệu inventory cho location hiện tại</td>
                </tr>
              ) : (
                pagedRows.map((item, index) => (
                  <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap font-semibold">{getInventoryLabel(item, (safeCurrentPage - 1) * PAGE_SIZE + index)}</td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{getProductLabel(item)}</td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{item.locationType}</td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{getLocationLabel(item)}</td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{item.quantity}</td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{item.reservedQuantity}</td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{item.availableQuantity}</td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{item.minStockLevel}</td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{item.maxStockLevel}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          item.isLowStock
                            ? 'bg-red-100 text-red-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {item.isLowStock ? 'Hết hàng' : 'Còn hàng'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{formatDateTime(item.lastStockCheck)}</td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{formatDateTime(item.updatedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && rows.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
            <p className="text-xs text-slate-500">
              Hiển thị {(safeCurrentPage - 1) * PAGE_SIZE + 1}-{Math.min(safeCurrentPage * PAGE_SIZE, rows.length)} / {rows.length} sản phẩm
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={safeCurrentPage === 1}
                onClick={() => handlePageChange(safeCurrentPage - 1)}
              >
                Prev
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  size="sm"
                  variant={page === safeCurrentPage ? 'primary' : 'outline'}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Button>
              ))}

              <Button
                size="sm"
                variant="outline"
                disabled={safeCurrentPage === totalPages}
                onClick={() => handlePageChange(safeCurrentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
