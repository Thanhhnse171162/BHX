'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Search, Package, TrendingUp, AlertTriangle, XCircle, ChevronLeft, ChevronRight, Edit2 } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import Modal from '@/shared/ui/Modal'
import { InventoryAPIService, InventoryItem } from '@/services/inventory-api.service'
import { ProductAPIService, ProductFromAPI } from '@/services/product-api.service'
import { useAuthStore } from '@/store/auth.store'

type FilterTab = 'all' | 'in-stock' | 'low-stock' | 'out-of-stock'

interface InventoryWithProductInfo extends InventoryItem {
  productName?: string
  productSKU?: string
  categoryName?: string
}

function getInventoryUnit(item: InventoryWithProductInfo): string {
  return String(item.unit || item.Unit || item.product?.unit || '').trim()
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryWithProductInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTab, setFilterTab] = useState<FilterTab>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  // Min stock modal state
  const [isMinStockModalOpen, setIsMinStockModalOpen] = useState(false)
  const [minStockEditingId, setMinStockEditingId] = useState<string | null>(null)
  const [minStockEditValue, setMinStockEditValue] = useState(0)
  const [isUpdatingMinStock, setIsUpdatingMinStock] = useState(false)
  const [minStockError, setMinStockError] = useState<string | null>(null)

  const { user, hydrated } = useAuthStore()

  // Warehouse mapping dựa trên workplace_id từ database (chữ thường)
  const warehouseNames: { [key: string]: string } = {
    'a0000001-0001-0001-0001-000000000001': 'Kho HCM',
    'a0000001-0001-0001-0001-000000000002': 'Kho Chi Nhánh Quận 12',
    'a0000001-0001-0001-0001-000000000003': 'Kho Chi Nhánh Bình Dương',
    'a0000001-0001-0001-0001-000000000004': 'Kho Chi Nhánh Long An',
    'b0000001-0001-0001-0001-000000000001': 'Cửa Hàng Thủ Đức',
    'b0000001-0001-0001-0001-000000000002': 'Cửa Hàng Giải Phóng HCM',
    'b0000001-0001-0001-0001-000000000003': 'Cửa Hàng Bình Dương',
    'b0000001-0001-0001-0001-000000000004': 'Cửa Hàng Củ Chi',
    'b0000001-0001-0001-0001-000000000005': 'Cửa Hàng Biên Hòa',
    'b0000001-0001-0001-0001-000000000006': 'Cửa Hàng Quận 7',
  }
  
  const locationName = user?.workplaceId 
    ? (warehouseNames[user.workplaceId.toLowerCase()] || warehouseNames[user.workplaceId] || 'Địa điểm chưa xác định')
    : 'Địa điểm chưa xác định'

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      if (!user?.workplaceType || !user?.workplaceId) {
        setInventory([])
        setError('Tài khoản chưa có thông tin kho/cửa hàng (workplace). Vui lòng đăng xuất và đăng nhập lại.')
        return
      }

      // Debug log
      console.log('Fetching inventory for:', {
        workplaceType: user.workplaceType,
        workplaceId: user.workplaceId,
        locationName: locationName
      })

      const [inventoryData, productsData] = await Promise.all([
        InventoryAPIService.getInventoryByLocation(
          user.workplaceType as 'WAREHOUSE' | 'STORE',
          user.workplaceId
        ),
        ProductAPIService.getAllProducts().catch(() => [] as ProductFromAPI[])
      ])

      console.log('Inventory data received:', inventoryData.length, 'items')

      // Create product map for quick lookup
      const productMap = new Map(
        productsData.map(p => [p.id, { name: p.name, sku: p.sku, categoryName: p.categoryName }])
      )

      // Enrich inventory with product info
      const enrichedInventory = inventoryData.map(item => {
        const productInfo = productMap.get(item.productId)
        return {
          ...item,
          productName: productInfo?.name || `Product ${item.productId.substring(0, 8)}`,
          productSKU: productInfo?.sku || 'N/A',
          categoryName: productInfo?.categoryName || 'Unknown'
        }
      })

      setInventory(enrichedInventory)
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Không thể tải dữ liệu inventory. Vui lòng kiểm tra backend.')
    } finally {
      setIsLoading(false)
    }
  }, [user?.workplaceType, user?.workplaceId, locationName])

  useEffect(() => {
    if (!hydrated) return
    void fetchData()
  }, [hydrated, fetchData])

  // Calculate stats (from all inventory items)
  const stats = useMemo(() => {
    const total = inventory.length
    const totalStock = inventory.reduce((sum, item) => sum + item.quantity, 0)
    const lowStock = inventory.filter(i => i.isLowStock && i.availableQuantity > 0).length
    const outOfStock = inventory.filter(i => i.availableQuantity === 0).length

    return { total, totalStock, lowStock, outOfStock }
  }, [inventory])

  // Filter data (không group, hiện tất cả items)
  const filteredData = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch = 
        item.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.productSKU?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.categoryName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.locationId.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesFilter = 
        filterTab === 'all' || 
        (filterTab === 'in-stock' && item.availableQuantity > 0 && !item.isLowStock) ||
        (filterTab === 'low-stock' && item.isLowStock && item.availableQuantity > 0) ||
        (filterTab === 'out-of-stock' && item.availableQuantity === 0)
      
      return matchesSearch && matchesFilter
    })
  }, [inventory, searchTerm, filterTab])

  // Paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredData.slice(startIndex, endIndex)
  }, [filteredData, currentPage])

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterTab])

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

  const StatusBadge = ({ item }: { item: InventoryWithProductInfo }) => {
    if (item.availableQuantity === 0) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Hết hàng
        </span>
      )
    } else if (item.isLowStock) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          Tồn kho thấp
        </span>
      )
    } else {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Còn hàng
        </span>
      )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý tồn kho</h1>
        <p className="text-gray-600 mt-1">
          Tồn kho của <span className="font-semibold text-[#2d6e3e]">{locationName}</span> - Hiển thị {filteredData.length} sản phẩm
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Tổng sản phẩm</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Tổng tồn kho</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalStock.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Tồn kho thấp</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{stats.lowStock}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="text-orange-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Hết hàng</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.outOfStock}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="text-red-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Tìm theo sản phẩm, SKU, danh mục hoặc địa điểm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            <Button
              variant={filterTab === 'all' ? 'primary' : 'outline'}
              onClick={() => setFilterTab('all')}
              className={filterTab === 'all' ? 'bg-blue-600 hover:bg-blue-700' : ''}
            >
              Tất cả
            </Button>
            <Button
              variant={filterTab === 'in-stock' ? 'primary' : 'outline'}
              onClick={() => setFilterTab('in-stock')}
              className={filterTab === 'in-stock' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              Còn hàng
            </Button>
            <Button
              variant={filterTab === 'low-stock' ? 'primary' : 'outline'}
              onClick={() => setFilterTab('low-stock')}
              className={filterTab === 'low-stock' ? 'bg-orange-600 hover:bg-orange-700' : ''}
            >
              Tồn kho thấp
            </Button>
            <Button
              variant={filterTab === 'out-of-stock' ? 'primary' : 'outline'}
              onClick={() => setFilterTab('out-of-stock')}
              className={filterTab === 'out-of-stock' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              Hết hàng
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 mt-4">Đang tải dữ liệu tồn kho...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <XCircle className="mx-auto text-red-500" size={48} />
            <p className="text-red-600 mt-4 font-medium">{error}</p>
            <Button 
              variant="outline" 
              onClick={fetchData}
              className="mt-4"
            >
              Thử lại
            </Button>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="mx-auto text-gray-400" size={48} />
            <p className="text-gray-500 mt-4">Không tìm thấy sản phẩm tồn kho</p>
            <p className="text-gray-400 text-sm mt-2">Thử điều chỉnh tìm kiếm hoặc bộ lọc</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Sản phẩm
                  </th>
                  <th className="text-center py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Số lượng
                  </th>
                  <th className="text-center py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Có sẵn
                  </th>
                  <th className="text-center py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Đã đặt
                  </th>
                  <th className="text-center py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tối thiểu/Tối đa
                  </th>
                  <th className="text-center py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    {(() => {
                      const unit = getInventoryUnit(item)
                      return (
                        <>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {item.productName?.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{item.productName}</p>
                          <p className="text-xs text-gray-500">SKU: {item.productSKU}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="text-lg font-bold text-gray-900">
                        {item.quantity.toLocaleString()}{unit ? ` ${unit}` : ''}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="text-sm font-semibold text-green-600">
                        {item.availableQuantity.toLocaleString()}{unit ? ` ${unit}` : ''}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="text-sm text-gray-700">
                        {item.reservedQuantity.toLocaleString()}{unit ? ` ${unit}` : ''}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">{item.minStockLevel}{unit ? ` ${unit}` : ''}</span>
                          <span className="text-gray-400 mx-1">/</span>
                          <span className="font-medium">{item.maxStockLevel}{unit ? ` ${unit}` : ''}</span>
                        </div>
                        <button
                          onClick={() => handleEditMinStockClick(item.id, item.minStockLevel)}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors flex-shrink-0"
                          title="Edit minimum stock level"
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <StatusBadge item={item} />
                    </td>
                        </>
                      )
                    })()}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !error && filteredData.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Hiển thị <span className="font-medium">{filteredData.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> đến{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, filteredData.length)}
                </span>{' '}
                trong <span className="font-medium">{filteredData.length}</span> kết quả
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="gap-1"
                >
                  <ChevronLeft size={16} />
                  Trước
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "primary" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={currentPage === page ? "bg-[#2d6e3e] text-white" : ""}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="gap-1"
                >
                  Tiếp
                  <ChevronRight size={16} />
                </Button>
              </div>
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
    </div>
  )
}
