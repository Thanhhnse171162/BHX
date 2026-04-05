'use client'

import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { useAuth } from '@/shared/hooks/useAuth'
import { InventoryAPIService, InventoryItem } from '@/services/inventory-api.service'
import { ProductAPIService } from '@/services/product-api.service'
import { Package, AlertTriangle, Search, Filter, RefreshCw, Edit2 } from 'lucide-react'
import Modal from '@/shared/ui/Modal'
import { Input } from '@/shared/ui/Input'
import { useAuthStore } from '@/store/auth.store'

// Extended inventory item with product details
interface InventoryWithProduct extends InventoryItem {
  productDetails?: {
    id: string
    sku: string
    barcode?: string
    name: string
    categoryName?: string
    brand?: string
    price: number
    unit: string
  }
}

export default function WarehouseManagerInventoryPage() {
  const { user } = useAuth()
  const [inventory, setInventory] = useState<InventoryWithProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLowStock, setFilterLowStock] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  // Min stock modal state
  const [isMinStockModalOpen, setIsMinStockModalOpen] = useState(false)
  const [minStockEditingId, setMinStockEditingId] = useState<string | null>(null)
  const [minStockEditValue, setMinStockEditValue] = useState(0)
  const [isUpdatingMinStock, setIsUpdatingMinStock] = useState(false)
  const [minStockError, setMinStockError] = useState<string | null>(null)
  // Export expired batches modal state
  const [isExportExpiredModalOpen, setIsExportExpiredModalOpen] = useState(false)
  const [isExportingExpired, setIsExportingExpired] = useState(false)
  const [exportExpiredError, setExportExpiredError] = useState<string | null>(null)
  const [exportExpiredSuccess, setExportExpiredSuccess] = useState<string | null>(null)
  const [isNoExpiredBatchesModalOpen, setIsNoExpiredBatchesModalOpen] = useState(false)

  const fetchInventory = useCallback(async () => {
    if (!user?.workplaceId) {
      setError('Không tìm thấy thông tin kho')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Fetch inventory and products in parallel
      const [inventoryData, productsData] = await Promise.all([
        InventoryAPIService.getInventoryByWarehouse(user.workplaceId),
        ProductAPIService.getAllProducts().catch(() => [])
      ])

      // Create a map of products for quick lookup
      const productsMap = new Map(productsData.map((p: any) => [p.id, p]))

      // Enrich inventory with product details
      const enrichedInventory = inventoryData.map((item) => ({
        ...item,
        productDetails: productsMap.get(item.productId) || undefined
      }))

      setInventory(enrichedInventory)
    } catch (err: any) {
      console.error('Error fetching inventory:', err)
      setError(err?.response?.data?.message || 'Không thể tải dữ liệu tồn kho')
    } finally {
      setLoading(false)
    }
  }, [user?.workplaceId])

  useEffect(() => {
    void fetchInventory()
  }, [fetchInventory])

  // Filter inventory
  const filteredInventory = inventory.filter((item) => {
    const productName = item.productDetails?.name || item.productName || item.name || ''
    const sku = item.productDetails?.sku || item.sku || ''
    const barcode = item.productDetails?.barcode || item.barcode || ''
    
    const searchMatch =
      searchTerm === '' ||
      productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      barcode.toLowerCase().includes(searchTerm.toLowerCase())

    const lowStockMatch = !filterLowStock || item.isLowStock

    return searchMatch && lowStockMatch
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedInventory = filteredInventory.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterLowStock])

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentPage])

  // Calculate stats
  const stats = {
    totalItems: inventory.length,
    lowStock: inventory.filter((item) => item.isLowStock).length,
    totalQuantity: inventory.reduce((sum, item) => sum + item.quantity, 0),
    availableQuantity: inventory.reduce((sum, item) => sum + item.availableQuantity, 0),
  }

  const getUnit = (item: InventoryWithProduct) => {
    return String(item.unit || item.Unit || item.productDetails?.unit || item.product?.unit || '').trim()
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

  const handleExportExpiredBatches = async () => {
    if (!user?.workplaceId) {
      setExportExpiredError('Không tìm thấy thông tin kho')
      return
    }

    setIsExportingExpired(true)
    setExportExpiredError(null)
    setExportExpiredSuccess(null)

    try {
      const token = useAuthStore.getState().token
      const response = await axios.post(
        'http://13.229.29.52:5003/api/ProductBatch/expired-batches/create-outbound',
        {
          warehouseId: user.workplaceId,
          locationType: 'WAREHOUSE',
          locationId: user.workplaceId,
          notes: 'hết hạn'
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (response.data.success) {
        // Check if any batches were found and processed
        if (response.data.data.totalBatchesProcessed === 0) {
          setIsExportExpiredModalOpen(false)
          setIsNoExpiredBatchesModalOpen(true)
        } else {
          setExportExpiredSuccess(
            `Đã xuất thành công: ${response.data.data.totalBatchesProcessed} lô hàng, ` +
            `tổng số lượng ${response.data.data.totalQuantityOutbound} sản phẩm`
          )
          // Refresh inventory after successful export
          setTimeout(() => {
            fetchInventory()
            setIsExportExpiredModalOpen(false)
            setExportExpiredSuccess(null)
          }, 2000)
        }
      }
    } catch (error: any) {
      console.error('Error exporting expired batches:', error)
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        error?.message ||
        'Lỗi khi xuất lô hết hạn. Vui lòng thử lại.'
      
      // Check if the error is about no expired batches found
      if (errorMessage.toLowerCase().includes('no expired batches found')) {
        setIsExportExpiredModalOpen(false)
        setIsNoExpiredBatchesModalOpen(true)
      } else {
        setExportExpiredError(errorMessage)
      }
    } finally {
      setIsExportingExpired(false)
    }
  }

  const handleUpdateMinStock = async () => {
    if (!minStockEditingId) return

    setIsUpdatingMinStock(true)
    setMinStockError(null)

    try {
      await InventoryAPIService.updateMinStockLevel(minStockEditingId, minStockEditValue)

      // Update local inventory state
      setInventory(
        inventory.map((item) =>
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2d6e3e]"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-900 mb-2">Lỗi tải dữ liệu</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={fetchInventory}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Thử lại
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý tồn kho</h1>
          <p className="text-gray-600 mt-1">Quản lý hàng tồn kho và mức tồn kho</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsExportExpiredModalOpen(true)
              setExportExpiredError(null)
              setExportExpiredSuccess(null)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Package className="w-4 h-4" />
            Xuất lô hết hạn
          </button>
          <button
            onClick={fetchInventory}
            className="flex items-center gap-2 px-4 py-2 bg-[#2d6e3e] text-white rounded-lg hover:bg-[#1e4d2b] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tổng sản phẩm</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tổng số lượng</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalQuantity.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Khả dụng</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.availableQuantity.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Sắp hết hàng</p>
              <p className="text-2xl font-bold text-red-900">{stats.lowStock}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, SKU, barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d6e3e] focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setFilterLowStock(!filterLowStock)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              filterLowStock
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            {filterLowStock ? 'Chỉ sắp hết' : 'Tất cả'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sản phẩm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU / Barcode
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tổng SL
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Đã đặt
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Khả dụng
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Min / Max
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cập nhật
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedInventory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    {searchTerm || filterLowStock
                      ? 'Không tìm thấy sản phẩm phù hợp'
                      : 'Chưa có dữ liệu tồn kho'}
                  </td>
                </tr>
              ) : (
                paginatedInventory.map((item) => {
                  const productName = item.productDetails?.name || item.productName || item.name || 'Chưa có thông tin'
                  const sku = item.productDetails?.sku || item.sku || 'N/A'
                  const barcode = item.productDetails?.barcode || item.barcode || '-'
                  const categoryName = item.productDetails?.categoryName || item.product?.categoryName || ''
                  const unit = getUnit(item)

                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{productName}</div>
                        {categoryName && (
                          <div className="text-xs text-gray-500">{categoryName}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{sku}</div>
                        <div className="text-xs text-gray-500">{barcode}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-semibold text-gray-900">
                          {item.quantity.toLocaleString()}{unit ? ` ${unit}` : ''}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm text-gray-600">
                          {item.reservedQuantity.toLocaleString()}{unit ? ` ${unit}` : ''}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-semibold text-emerald-600">
                          {item.availableQuantity.toLocaleString()}{unit ? ` ${unit}` : ''}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <span className="text-xs text-gray-600">
                            {item.minStockLevel}{unit ? ` ${unit}` : ''} / {item.maxStockLevel}{unit ? ` ${unit}` : ''}
                          </span>
                          <button
                            onClick={() => handleEditMinStockClick(item.id, item.minStockLevel)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors flex-shrink-0"
                            title="Edit minimum stock level"
                          >
                            <Edit2 size={16} />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {item.isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                            <AlertTriangle className="w-3 h-3" />
                            Sắp hết
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                            Đủ hàng
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(item.updatedAt).toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {filteredInventory.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Summary */}
            <div className="text-sm text-gray-600">
              Hiển thị {startIndex + 1} - {Math.min(endIndex, filteredInventory.length)} trong tổng số{' '}
              {filteredInventory.length} sản phẩm
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-2">
              {/* Previous Button */}
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Trước
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Show first page, last page, current page, and pages around current
                  const showPage =
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)

                  if (!showPage) {
                    // Show ellipsis
                    if (page === currentPage - 2 || page === currentPage + 2) {
                      return (
                        <span key={page} className="px-2 text-gray-400">
                          ...
                        </span>
                      )
                    }
                    return null
                  }

                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-[#2d6e3e] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {page}
                    </button>
                  )
                })}
              </div>

              {/* Next Button */}
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tiếp
              </button>
            </div>
          </div>
        </div>
      )}

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
              <button
                onClick={handleCloseMinStockModal}
                disabled={isUpdatingMinStock}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateMinStock}
                disabled={isUpdatingMinStock}
                className="px-4 py-2 rounded-lg bg-[#2d6e3e] text-white hover:bg-[#1e4d2b] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdatingMinStock ? 'Updating...' : 'Update'}
              </button>
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

      {/* Export Expired Batches Modal */}
      <Modal
        isOpen={isExportExpiredModalOpen}
        onClose={() => !isExportingExpired && setIsExportExpiredModalOpen(false)}
        title="Xuất lô hàng hết hạn"
        size="sm"
        footer={
          <div className="flex flex-col gap-3">
            {exportExpiredError && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                {exportExpiredError}
              </div>
            )}
            {exportExpiredSuccess && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
                {exportExpiredSuccess}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsExportExpiredModalOpen(false)}
                disabled={isExportingExpired}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hủy
              </button>
              <button
                onClick={handleExportExpiredBatches}
                disabled={isExportingExpired}
                className="px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isExportingExpired ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Package className="w-4 h-4" />
                    Xuất ngay
                  </>
                )}
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Bạn có chắc chắn muốn xuất tất cả các lô hàng hết hạn khỏi kho?
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-900">
              ⓘ Hệ thống sẽ tạo phiếu xuất kho (outbound) cho tất cả các lô hàng có ngày hết hạn đã qua.
            </p>
          </div>
        </div>
      </Modal>

      {/* No Expired Batches Found Modal */}
      <Modal
        isOpen={isNoExpiredBatchesModalOpen}
        onClose={() => setIsNoExpiredBatchesModalOpen(false)}
        title="Không có lô hàng hết hạn"
        size="sm"
        footer={
          <div className="flex justify-end">
            <button
              onClick={() => setIsNoExpiredBatchesModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-[#2d6e3e] text-white hover:bg-[#1e4d2b]"
            >
              OK
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold text-gray-900">Không có lô hàng hết hạn</p>
            <p className="text-gray-600">
              Hiện tại tất cả các lô hàng trong kho của bạn đều còn hạn sử dụng. Không cần xuất kho lúc này.
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-900">
              ✓ Tồn kho của bạn đang ở trạng thái tốt!
            </p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
