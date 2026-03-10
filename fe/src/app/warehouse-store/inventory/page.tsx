'use client'

import { useState, useMemo, useEffect } from 'react'
import { Search, Filter, Package, CheckCircle, AlertTriangle, XCircle, Download, Loader2 } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { InventoryAPIService } from '@/services/inventory-api.service'
import { ProductAPIService, ProductFromAPI } from '@/services/product-api.service'

interface InventoryItemDisplay {
  productId: string
  productName: string
  sku: string
  category: string
  locationType: string
  locationId: string
  quantity: number
  reservedQuantity: number
  availableQuantity: number
  minStockLevel: number
  maxStockLevel: number
  isLowStock: boolean
  lastStockCheck: string | null
  updatedAt: string
  status: 'in-stock' | 'low-stock' | 'out-of-stock' | 'need-restock'
}

export default function InventoryListPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [inventory, setInventory] = useState<InventoryItemDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const itemsPerPage = 10

  // Fetch data from API
  useEffect(() => {
    const fetchInventoryData = async () => {
      try {
        setLoading(true)
        setError(null)

        console.log('Fetching inventory data...')
        
        // Fetch inventory data
        const inventoryData = await InventoryAPIService.getAllInventory()
        console.log('Inventory data received:', inventoryData?.length || 0, 'items')
        
        // Fetch all products
        const productsData = await ProductAPIService.getAllProducts()
        console.log('Products data received:', productsData?.length || 0, 'items')
        
        // Create a map of productId -> product
        const productMap = new Map<string, ProductFromAPI>()
        productsData.forEach(product => {
          productMap.set(product.id, product)
        })

        // Combine inventory and product data
        const combinedData: InventoryItemDisplay[] = inventoryData.map(item => {
          const product = productMap.get(item.productId)
          
          // Determine status based on quantity and stock levels
          let status: 'in-stock' | 'low-stock' | 'out-of-stock' | 'need-restock' = 'in-stock'
          
          if (item.quantity === 0) {
            status = 'out-of-stock'
          } else if (item.isLowStock || item.quantity <= item.minStockLevel) {
            if (item.quantity < item.minStockLevel * 0.5) {
              status = 'need-restock'
            } else {
              status = 'low-stock'
            }
          }

          return {
            productId: item.productId,
            productName: product?.name || 'Unknown Product',
            sku: product?.sku || 'N/A',
            category: product?.categoryName || 'Uncategorized',
            locationType: item.locationType,
            locationId: item.locationId,
            quantity: item.quantity,
            reservedQuantity: item.reservedQuantity,
            availableQuantity: item.availableQuantity,
            minStockLevel: item.minStockLevel,
            maxStockLevel: item.maxStockLevel,
            isLowStock: item.isLowStock,
            lastStockCheck: item.lastStockCheck,
            updatedAt: item.updatedAt,
            status,
          }
        })

        console.log('Combined data:', combinedData.length, 'items')
        setInventory(combinedData)
      } catch (err: any) {
        console.error('Error fetching inventory:', err)
        console.error('Error details:', err.response?.data || err.message)
        
        // More detailed error message
        let errorMessage = 'Không thể tải dữ liệu tồn kho.'
        if (err.response?.status === 401) {
          errorMessage = 'Bạn chưa đăng nhập. Vui lòng đăng nhập lại.'
        } else if (err.response?.status === 403) {
          errorMessage = 'Bạn không có quyền truy cập dữ liệu này.'
        } else if (err.message?.includes('Network Error')) {
          errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra Backend đã chạy chưa.'
        }
        
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchInventoryData()
  }, [])

  const categories = useMemo(() => {
    return Array.from(new Set(inventory.map(item => item.category)))
  }, [inventory])

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchSearch = 
        item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchStatus = filterStatus === 'all' || item.status === filterStatus
      const matchCategory = filterCategory === 'all' || item.category === filterCategory
      
      return matchSearch && matchStatus && matchCategory
    })
  }, [searchQuery, filterStatus, filterCategory, inventory])

  // Pagination
  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedInventory = filteredInventory.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    setCurrentPage(1)
  }

  const stats = useMemo(() => {
    return {
      total: inventory.length,
      inStock: inventory.filter(i => i.status === 'in-stock').length,
      lowStock: inventory.filter(i => i.status === 'low-stock').length,
      outOfStock: inventory.filter(i => i.status === 'out-of-stock').length,
      needRestock: inventory.filter(i => i.status === 'need-restock').length,
    }
  }, [])

  const getStatusBadge = (status: string) => {
    const config = {
      'in-stock': { label: 'In Stock', class: 'bg-green-100 text-green-800', icon: CheckCircle },
      'low-stock': { label: 'Low Stock', class: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
      'out-of-stock': { label: 'Out of Stock', class: 'bg-red-100 text-red-800', icon: XCircle },
      'need-restock': { label: 'Need Restock', class: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
    }
    const cfg = config[status as keyof typeof config]
    const Icon = cfg.icon
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${cfg.class}`}>
        <Icon className="w-3 h-3" />
        {cfg.label}
      </span>
    )
  }

  const handleExport = () => {
    alert('Xuất file Excel danh sách tồn kho')
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory List</h1>
          <p className="text-gray-600 mt-1">Danh sách tồn kho cửa hàng</p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={loading}>
          <Download className="w-4 h-4 mr-2" />
          Xuất Excel
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-3 text-gray-600">Đang tải dữ liệu...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Content - Only show when not loading */}
      {!loading && !error && (
        <>
          {/* Statistics */}
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <p className="text-sm text-gray-600">Tổng số sản phẩm</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="bg-green-50 rounded-lg shadow p-4 border border-green-200">
              <p className="text-sm text-green-700">In Stock</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.inStock}</p>
            </div>
            <div className="bg-orange-50 rounded-lg shadow p-4 border border-orange-200">
              <p className="text-sm text-orange-700">Low Stock</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{stats.lowStock}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg shadow p-4 border border-yellow-200">
              <p className="text-sm text-yellow-700">Need Restock</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.needRestock}</p>
            </div>
            <div className="bg-red-50 rounded-lg shadow p-4 border border-red-200">
              <p className="text-sm text-red-700">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.outOfStock}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow border border-gray-200 p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    handleFilterChange()
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value)
                    handleFilterChange()
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="in-stock">In Stock</option>
                  <option value="low-stock">Low Stock</option>
                  <option value="need-restock">Need Restock</option>
                  <option value="out-of-stock">Out of Stock</option>
                </select>
              </div>

              {/* Category Filter */}
              <div className="relative">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={filterCategory}
                  onChange={(e) => {
                    setFilterCategory(e.target.value)
                    handleFilterChange()
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tất cả danh mục</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-white rounded-xl shadow border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Danh sách sản phẩm</h2>
                <div className="text-sm text-gray-600">
                  Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredInventory.length)} / {filteredInventory.length} sản phẩm
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Sản phẩm</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">SKU</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Danh mục</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-700">Số lượng</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-700">Đã đặt</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-700">Khả dụng</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-700">Min/Max</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-700">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedInventory.map((item, index) => (
                    <tr key={`${item.productId}-${item.locationId}-${index}`} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <p className="font-medium text-gray-900">{item.productName}</p>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-gray-600 font-mono">{item.sku}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-gray-600">{item.category}</span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="font-semibold text-gray-900">{item.quantity}</span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="text-sm text-gray-600">{item.reservedQuantity}</span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`font-semibold ${
                          item.availableQuantity < item.minStockLevel 
                            ? 'text-orange-600' 
                            : 'text-green-600'
                        }`}>
                          {item.availableQuantity}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="text-sm text-gray-600">
                          {item.minStockLevel} / {item.maxStockLevel}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        {getStatusBadge(item.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {paginatedInventory.length === 0 && (
              <div className="py-12 text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>Không tìm thấy sản phẩm nào</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Trang {currentPage} / {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Trước
                    </Button>
                    <div className="flex gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === page
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
