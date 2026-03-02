'use client'

import { useState, useMemo } from 'react'
import { Search, Filter, Package, CheckCircle, AlertTriangle, XCircle, Download } from 'lucide-react'
import { Button } from '@/shared/ui/Button'

interface InventoryItem {
  id: string
  productName: string
  sku: string
  inStorage: number
  onShelf: number
  total: number
  minStock: number
  status: 'in-stock' | 'low-stock' | 'out-of-stock' | 'need-restock'
  category: string
}

export default function InventoryListPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Mock inventory data
  const inventory: InventoryItem[] = [
    { id: '1', productName: 'Coca Cola 330ml', sku: 'BEV-001', inStorage: 150, onShelf: 50, total: 200, minStock: 30, status: 'in-stock', category: 'Beverages' },
    { id: '2', productName: 'Pepsi 330ml', sku: 'BEV-002', inStorage: 120, onShelf: 40, total: 160, minStock: 25, status: 'in-stock', category: 'Beverages' },
    { id: '3', productName: 'Sprite 330ml', sku: 'BEV-003', inStorage: 80, onShelf: 15, total: 95, minStock: 20, status: 'low-stock', category: 'Beverages' },
    { id: '4', productName: 'Fanta 330ml', sku: 'BEV-004', inStorage: 0, onShelf: 5, total: 5, minStock: 20, status: 'need-restock', category: 'Beverages' },
    { id: '5', productName: '7Up 330ml', sku: 'BEV-005', inStorage: 0, onShelf: 0, total: 0, minStock: 15, status: 'out-of-stock', category: 'Beverages' },
    { id: '6', productName: 'Snickers 50g', sku: 'SNC-001', inStorage: 200, onShelf: 80, total: 280, minStock: 50, status: 'in-stock', category: 'Chocolate' },
    { id: '7', productName: 'KitKat 45g', sku: 'KTK-001', inStorage: 180, onShelf: 70, total: 250, minStock: 40, status: 'in-stock', category: 'Chocolate' },
    { id: '8', productName: 'Mars 51g', sku: 'MRS-001', inStorage: 50, onShelf: 20, total: 70, minStock: 35, status: 'low-stock', category: 'Chocolate' },
    { id: '9', productName: 'Lays Chips 50g', sku: 'CHP-001', inStorage: 250, onShelf: 100, total: 350, minStock: 60, status: 'in-stock', category: 'Snacks' },
    { id: '10', productName: 'Doritos 50g', sku: 'CHP-002', inStorage: 180, onShelf: 85, total: 265, minStock: 50, status: 'in-stock', category: 'Snacks' },
    { id: '11', productName: 'Pringles 100g', sku: 'CHP-003', inStorage: 60, onShelf: 25, total: 85, minStock: 40, status: 'low-stock', category: 'Snacks' },
    { id: '12', productName: 'Cheetos 50g', sku: 'CHP-004', inStorage: 0, onShelf: 8, total: 8, minStock: 30, status: 'need-restock', category: 'Snacks' },
    { id: '13', productName: 'Twix 50g', sku: 'TWX-001', inStorage: 140, onShelf: 55, total: 195, minStock: 30, status: 'in-stock', category: 'Chocolate' },
    { id: '14', productName: 'Bounty 57g', sku: 'BNT-001', inStorage: 130, onShelf: 50, total: 180, minStock: 28, status: 'in-stock', category: 'Chocolate' },
    { id: '15', productName: 'Milky Way 52g', sku: 'MLK-001', inStorage: 125, onShelf: 48, total: 173, minStock: 25, status: 'in-stock', category: 'Chocolate' },
    { id: '16', productName: 'Oreo 133g', sku: 'ORE-001', inStorage: 200, onShelf: 90, total: 290, minStock: 60, status: 'in-stock', category: 'Cookies' },
    { id: '17', productName: 'Ritz Crackers 100g', sku: 'RTZ-001', inStorage: 160, onShelf: 70, total: 230, minStock: 45, status: 'in-stock', category: 'Cookies' },
    { id: '18', productName: 'Nutella 350g', sku: 'NTL-001', inStorage: 80, onShelf: 30, total: 110, minStock: 20, status: 'in-stock', category: 'Spreads' },
    { id: '19', productName: 'Red Bull 250ml', sku: 'ENR-001', inStorage: 45, onShelf: 18, total: 63, minStock: 25, status: 'low-stock', category: 'Energy Drinks' },
    { id: '20', productName: 'Monster 500ml', sku: 'ENR-002', inStorage: 35, onShelf: 15, total: 50, minStock: 20, status: 'low-stock', category: 'Energy Drinks' },
  ]

  const categories = Array.from(new Set(inventory.map(item => item.category)))

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchSearch = 
        item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchStatus = filterStatus === 'all' || item.status === filterStatus
      const matchCategory = filterCategory === 'all' || item.category === filterCategory
      
      return matchSearch && matchStatus && matchCategory
    })
  }, [searchQuery, filterStatus, filterCategory])

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
        <Button variant="outline" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          Xuất Excel
        </Button>
      </div>

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
                <th className="text-center py-4 px-6 font-semibold text-gray-700">Trong kho</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-700">Trên quầy</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-700">Tổng</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-700">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {paginatedInventory.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
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
                    <span className="font-semibold text-gray-900">{item.inStorage}</span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`font-semibold ${item.onShelf < item.minStock ? 'text-orange-600' : 'text-gray-900'}`}>
                      {item.onShelf}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="font-bold text-gray-900">{item.total}</span>
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
    </div>
  )
}
