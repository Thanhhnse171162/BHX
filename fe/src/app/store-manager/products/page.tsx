'use client'

import { useEffect, useMemo, useState } from 'react'
import { RefreshCw, Edit2, Download } from 'lucide-react'
import useAuthStore from '@/store/auth.store'
import { InventoryAPIService, type InventoryItem } from '@/services/inventory-api.service'
import { ProductAPIService, type ProductFromAPI } from '@/services/product-api.service'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import Modal from '@/shared/ui/Modal'
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
  // Min stock modal state
  const [isMinStockModalOpen, setIsMinStockModalOpen] = useState(false)
  const [minStockEditingId, setMinStockEditingId] = useState<string | null>(null)
  const [minStockEditValue, setMinStockEditValue] = useState(0)
  const [isUpdatingMinStock, setIsUpdatingMinStock] = useState(false)
  const [minStockError, setMinStockError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false)
  const [errorModal, setErrorModal] = useState<{ title: string; message: string; details?: string } | null>(null)

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

  const handleEditMinStockClick = (inventoryId: string, currentValue: number) => {
    setMinStockEditingId(inventoryId)
    setMinStockEditValue(currentValue)
    setMinStockError(null)
    setIsMinStockModalOpen(true)
  }

  const handleCloseMinStockModal = () => {
    setIsMinStockModalOpen(false)
    setMinStockEditingId(null)
    setMinStockEditValue(0)
    setMinStockError(null)
  }

  const handleUpdateMinStock = async () => {
    if (!minStockEditingId) return

    setIsUpdatingMinStock(true)
    setMinStockError(null)

    try {
      await InventoryAPIService.updateMinStockLevel(minStockEditingId, minStockEditValue)

      // Update local inventory state
      setRows(
        rows.map((item) =>
          item.id === minStockEditingId
            ? { ...item, minStockLevel: minStockEditValue }
            : item
        )
      )

      handleCloseMinStockModal()
    } catch (error: any) {
      console.error('Error updating min stock level:', error)
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        'Failed to update min stock level. Please try again.'
      setMinStockError(errorMessage)
    } finally {
      setIsUpdatingMinStock(false)
    }
  }

  const handleExportExpiredBatches = () => {
    setIsExportConfirmOpen(true)
  }

  const confirmExportExpiredBatches = async () => {
    if (!token || !locationId) {
      setErrorModal({
        title: '❌ Lỗi',
        message: 'Vui lòng đảm bảo bạn đã đăng nhập và được gán cửa hàng/kho.',
      })
      return
    }

    setExporting(true)
    try {
      const response = await fetch('http://localhost:5003/api/ProductBatch/expired-batches/create-outbound', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          warehouseId: locationId,
          locationType: locationType || 'WAREHOUSE',
          locationId: locationId,
          notes: 'hết hạn',
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Không thể xuất lô hết hạn' }))
        
        // Phân tích lỗi từ backend
        let errorTitle = 'Lỗi xuất lô hết hạn'
        let errorMessage = error.message || 'Đã xảy ra lỗi khi xuất lô'
        let errorDetails = ''

        if (errorMessage.includes('Insufficient inventory')) {
          errorTitle = '❌ Tồn kho không đủ'
          errorMessage = 'Không thể xuất lô vì tồn kho không đủ.'
          const match = errorMessage.match(/available (\d+).*required (\d+)/)
          if (match) {
            errorDetails = `Có sẵn: ${match[1]} đơn vị\nYêu cầu: ${match[2]} đơn vị`
          }
        } else if (errorMessage.includes('No expired batches')) {
          errorTitle = '✅ Không có lô hết hạn'
          errorMessage = 'Không có lô nào hết hạn trong kho hiện tại.'
        }

        setErrorModal({
          title: errorTitle,
          message: errorMessage,
          details: errorDetails || undefined,
        })
        setIsExportConfirmOpen(false)
        setExporting(false)
        return
      }

      const data = await response.json()
      const totalBatches = data.data?.totalBatchesProcessed || 0
      const totalQty = data.data?.totalQuantityOutbound || 0
      
      setErrorModal({
        title: '✅ Xuất lô thành công',
        message: `Đã xuất ${totalBatches} lô hết hạn`,
        details: `Tổng số lượng: ${totalQty} đơn vị`,
      })
      
      setIsExportConfirmOpen(false)
      setTimeout(() => setErrorModal(null), 2000)
      await fetchInventory()
    } catch (err) {
      setErrorModal({
        title: '❌ Lỗi kết nối',
        message: err instanceof Error ? err.message : 'Không thể kết nối đến server',
      })
      setIsExportConfirmOpen(false)
    } finally {
      setExporting(false)
    }
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
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchInventory} className="gap-2" disabled={isLoading}>
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Làm mới
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExpiredBatches} className="gap-2" disabled={exporting} style={{ borderColor: '#dc2626', color: '#dc2626' }}>
            <Download size={14} />
            Xuất lô hết hạn
          </Button>
        </div>
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
                    <td className="py-3 px-4 text-slate-700">
                      <div className="flex items-center gap-3 whitespace-nowrap">
                        <span className="font-semibold">{item.minStockLevel}</span>
                        <button
                          onClick={() => handleEditMinStockClick(item.id, item.minStockLevel)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                          title="Edit minimum stock level"
                        >
                          <Edit2 size={16} />
                        </button>
                      </div>
                    </td>
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

      {/* Min Stock Level Modal */}
      <Modal
        isOpen={isMinStockModalOpen}
        onClose={handleCloseMinStockModal}
        title="Điều chỉnh mức tồn kho tối thiểu"
        size="sm"
        footer={
          <div className="flex flex-col gap-3">
            {minStockError && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                {minStockError}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={handleCloseMinStockModal} disabled={isUpdatingMinStock}>
                Cancel
              </Button>
              <Button onClick={handleUpdateMinStock} disabled={isUpdatingMinStock}>
                {isUpdatingMinStock ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Mức tồn kho tối thiểu"
            type="number"
            value={minStockEditValue}
            onChange={(e) => setMinStockEditValue(Number(e.target.value))}
            placeholder="0"
            min={0}
            required
          />
          <p className="text-sm text-gray-500">
            Giá trị này xác định khi nào hàng tồn kho được coi là thấp.
          </p>
        </div>
      </Modal>

      {isExportConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 space-y-4 shadow-lg">
            <div className="flex items-start justify-between">
              <h3 className="text-xl font-bold text-gray-900">Xuất lô hàng hết hạn</h3>
              <button 
                onClick={() => setIsExportConfirmOpen(false)}
                disabled={exporting}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <p className="text-sm text-gray-700">
              Bạn có chắc chắn muốn xuất tất cả các lô hàng hết hạn khỏi kho?
            </p>

            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
              <p className="text-sm text-blue-900">
                ⓘ Hệ thống sẽ tạo phiếu xuất kho (outbound) cho tất cả các lô hàng có ngày hết hạn đã qua.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setIsExportConfirmOpen(false)}
                disabled={exporting}
                className="text-gray-700"
              >
                Hủy
              </Button>
              <button
                onClick={confirmExportExpiredBatches}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {exporting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                {!exporting && <Download size={16} />}
                {exporting ? 'Đang xử lý...' : 'Xuất ngay'}
              </button>
            </div>
          </div>
        </div>
      )}

      {errorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 space-y-4 shadow-lg">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{errorModal.title}</h3>
              <p className="text-sm text-gray-600 mt-2">{errorModal.message}</p>
              {errorModal.details && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-700 whitespace-pre-line">{errorModal.details}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setErrorModal(null)}
                className="text-gray-700"
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
