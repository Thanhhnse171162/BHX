'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, Package, TrendingUp, AlertTriangle, XCircle, MapPin, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { InventoryAPIService, InventoryItem } from '@/services/inventory-api.service'
import { ProductAPIService, ProductFromAPI } from '@/services/product-api.service'

type FilterTab = 'all' | 'warehouse' | 'store'

interface InventoryWithProductInfo extends InventoryItem {
  productName?: string
  productSKU?: string
  categoryName?: string
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryWithProductInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTab, setFilterTab] = useState<FilterTab>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [inventoryData, productsData] = await Promise.all([
        InventoryAPIService.getAllInventory(),
        ProductAPIService.getAllProducts().catch(() => [] as ProductFromAPI[])
      ])

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
  }

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
        (filterTab === 'warehouse' && item.locationType === 'WAREHOUSE') ||
        (filterTab === 'store' && item.locationType === 'STORE')
      
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
  useMemo(() => {
    setCurrentPage(1)
  }, [searchTerm, filterTab])

  const StatusBadge = ({ item }: { item: InventoryWithProductInfo }) => {
    if (item.availableQuantity === 0) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Out of Stock
        </span>
      )
    } else if (item.isLowStock) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          Low Stock
        </span>
      )
    } else {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          In Stock
        </span>
      )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-gray-600 mt-1">View all inventory items across locations</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Items</p>
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
              <p className="text-sm text-gray-600 font-medium">Total Stock</p>
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
              <p className="text-sm text-gray-600 font-medium">Low Stock</p>
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
              <p className="text-sm text-gray-600 font-medium">Out of Stock</p>
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
                placeholder="Search by product, SKU, category, or location..."
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
              All
            </Button>
            <Button
              variant={filterTab === 'warehouse' ? 'primary' : 'outline'}
              onClick={() => setFilterTab('warehouse')}
              className={filterTab === 'warehouse' ? 'bg-purple-600 hover:bg-purple-700' : ''}
            >
              Warehouse
            </Button>
            <Button
              variant={filterTab === 'store' ? 'primary' : 'outline'}
              onClick={() => setFilterTab('store')}
              className={filterTab === 'store' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
            >
              Store
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 mt-4">Loading inventory data...</p>
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
              Retry
            </Button>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="mx-auto text-gray-400" size={48} />
            <p className="text-gray-500 mt-4">No inventory items found</p>
            <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="text-center py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="text-center py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Available
                  </th>
                  <th className="text-center py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Reserved
                  </th>
                  <th className="text-center py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Min/Max
                  </th>
                  <th className="text-center py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Last Updated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
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
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className={item.locationType === 'WAREHOUSE' ? 'text-purple-600' : 'text-indigo-600'} />
                        <div>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                            item.locationType === 'WAREHOUSE' 
                              ? 'bg-purple-100 text-purple-700' 
                              : 'bg-indigo-100 text-indigo-700'
                          }`}>
                            {item.locationType}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">{item.locationId.substring(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="text-lg font-bold text-gray-900">
                        {item.quantity.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="text-sm font-semibold text-green-600">
                        {item.availableQuantity.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="text-sm text-gray-700">
                        {item.reservedQuantity.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">{item.minStockLevel}</span>
                        <span className="text-gray-400 mx-1">/</span>
                        <span className="font-medium">{item.maxStockLevel}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <StatusBadge item={item} />
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {new Date(item.updatedAt).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
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
                Showing <span className="font-medium">{filteredData.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, filteredData.length)}
                </span>{' '}
                of <span className="font-medium">{filteredData.length}</span> results
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
                  Previous
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
                  Next
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
