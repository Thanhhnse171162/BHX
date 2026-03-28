'use client'

import { useState, useMemo, useEffect } from 'react'
import { AlertTriangle, Package, Search, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { getLowStockItems } from '@/data/inventory-data'

// Get low stock items from shared inventory data and add computed fields
const lowStockItems = getLowStockItems().map(item => {
  const stockPercentage = item.minQuantity ? (item.quantity / item.minQuantity) * 100 : 100
  // Calculate days until reorder based on stock percentage (lower percentage = more urgent)
  const daysUntilReorder = stockPercentage < 20 ? 1 : stockPercentage < 40 ? 2 : stockPercentage < 60 ? 3 : 4
  
  return {
    id: item.id,
    name: item.name,
    sku: item.sku,
    quantity: item.quantity,
    minQuantity: item.minQuantity || 30,
    category: item.category,
    daysUntilReorder
  }
})

type SortOption = 'urgent' | 'quantity' | 'percentage' | 'name' | 'category' | 'sku'

export default function LowStockPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('urgent')
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [settingsTab, setSettingsTab] = useState<'products' | 'general'>('products')
  const [settingsSearchQuery, setSettingsSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    // Filter by search query
    const filtered = lowStockItems.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Sort items
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'urgent':
          // Sort by urgency (days until reorder, then by stock percentage)
          if (a.daysUntilReorder !== b.daysUntilReorder) {
            return a.daysUntilReorder - b.daysUntilReorder
          }
          return (a.quantity / a.minQuantity) - (b.quantity / b.minQuantity)
        
        case 'quantity':
          // Sort by current quantity (ascending - lowest first)
          return a.quantity - b.quantity
        
        case 'percentage':
          // Sort by stock percentage (ascending - lowest first)
          return (a.quantity / a.minQuantity) - (b.quantity / b.minQuantity)
        
        case 'name':
          // Sort alphabetically by name
          return a.name.localeCompare(b.name)
        
        case 'category':
          // Sort by category, then by name
          if (a.category !== b.category) {
            return a.category.localeCompare(b.category)
          }
          return a.name.localeCompare(b.name)
        
        case 'sku':
          // Sort by SKU
          return a.sku.localeCompare(b.sku)
        
        default:
          return 0
      }
    })

    return sorted
  }, [searchQuery, sortBy])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedItems.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedItems = filteredAndSortedItems.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, sortBy])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
            <AlertTriangle className="text-orange-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Low Stock Alerts</h1>
            <p className="text-gray-600 text-sm mt-1">Monitor items that need to be restocked</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="border-[#2d6e3e] text-[#2d6e3e]"
          onClick={() => setShowSettingsModal(true)}
        >
          Settings
        </Button>
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowSettingsModal(false)}>
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-[#2d6e3e] text-white px-6 py-4">
              <h3 className="text-xl font-bold">Low Stock Alert Settings</h3>
              <p className="text-sm text-green-100 mt-1">Cấu hình cảnh báo tồn kho thấp</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setSettingsTab('products')}
                className={`px-6 py-3 font-medium transition-colors ${
                  settingsTab === 'products' 
                    ? 'text-[#2d6e3e] border-b-2 border-[#2d6e3e]' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                🏷️ Ngưỡng sản phẩm
              </button>
              <button
                onClick={() => setSettingsTab('general')}
                className={`px-6 py-3 font-medium transition-colors ${
                  settingsTab === 'general' 
                    ? 'text-[#2d6e3e] border-b-2 border-[#2d6e3e]' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                ⚙️ Cấu hình chung
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {/* Products Tab */}
              {settingsTab === 'products' && (
                <div className="space-y-4">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Tìm theo tên sản phẩm hoặc mã SKU..."
                      value={settingsSearchQuery}
                      onChange={(e) => setSettingsSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d6e3e] focus:border-transparent"
                    />
                    {settingsSearchQuery && (
                      <button
                        onClick={() => setSettingsSearchQuery('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">SKU</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Sản phẩm</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Tồn hiện tại</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Ngưỡng tối thiểu</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">%</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {lowStockItems
                          .filter(item => 
                            item.name.toLowerCase().includes(settingsSearchQuery.toLowerCase()) ||
                            item.sku.toLowerCase().includes(settingsSearchQuery.toLowerCase())
                          )
                          .map((item) => {
                          const percentage = (item.quantity / item.minQuantity) * 100
                          return (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-mono text-gray-600">{item.sku}</td>
                              <td className="px-4 py-3 text-sm font-medium">{item.name}</td>
                              <td className="px-4 py-3 text-sm">{item.quantity} units</td>
                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  defaultValue={item.minQuantity}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#2d6e3e] focus:border-transparent"
                                  min="0"
                                />
                                <span className="text-xs text-gray-500 ml-1">units</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`text-sm font-semibold ${
                                  percentage <= 30 ? 'text-red-600' : 'text-orange-600'
                                }`}>
                                  {percentage.toFixed(0)}%
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                        {lowStockItems.filter(item => 
                          item.name.toLowerCase().includes(settingsSearchQuery.toLowerCase()) ||
                          item.sku.toLowerCase().includes(settingsSearchQuery.toLowerCase())
                        ).length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                              <Package className="mx-auto mb-2 text-gray-400" size={40} />
                              <p>Không tìm thấy sản phẩm nào</p>
                              <p className="text-xs mt-1">Thử tìm kiếm với từ khóa khác</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Results count */}
                  <div className="text-sm text-gray-600 text-center">
                    Hiển thị {lowStockItems.filter(item => 
                      item.name.toLowerCase().includes(settingsSearchQuery.toLowerCase()) ||
                      item.sku.toLowerCase().includes(settingsSearchQuery.toLowerCase())
                    ).length} / {lowStockItems.length} sản phẩm
                  </div>
                </div>
              )}

              {/* General Tab */}
              {settingsTab === 'general' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ngưỡng ngày để đánh dấu URGENT
                    </label>
                    <input
                      type="number"
                      defaultValue={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d6e3e] focus:border-transparent"
                      min="1"
                      max="7"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Sản phẩm sẽ được đánh dấu URGENT khi cần reorder trong vòng ≤ số ngày này (mặc định: 2 ngày)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ngưỡng % để hiển thị cảnh báo
                    </label>
                    <input
                      type="number"
                      defaultValue={100}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d6e3e] focus:border-transparent"
                      min="0"
                      max="200"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Hiển thị cảnh báo khi % tồn kho ≤ ngưỡng này (mặc định: 100% = dưới mức tối thiểu)
                    </p>
                  </div>

                  <div className="border-t pt-4">
                    <label className="flex items-center gap-2 mb-3">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="text-sm text-gray-700">Gửi email thông báo khi có sản phẩm URGENT</span>
                    </label>
                    <label className="flex items-center gap-2 mb-3">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="text-sm text-gray-700">Hiển thị biểu đồ xu hướng tồn kho</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm text-gray-700">Tự động tạo đơn đặt hàng cho sản phẩm URGENT</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 px-6 py-4 flex gap-3 justify-end bg-gray-50">
              <Button 
                variant="outline" 
                onClick={() => setShowSettingsModal(false)}
              >
                Đóng
              </Button>
              <Button 
                className="bg-[#2d6e3e] hover:bg-[#255931]"
                onClick={() => {
                  // Save settings logic here
                  alert('Đã lưu cấu hình!')
                  setShowSettingsModal(false)
                }}
              >
                Lưu thay đổi
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border-l-4 border-orange-600 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Total Alerts</p>
              <p className="text-3xl font-bold text-orange-600">{lowStockItems.length}</p>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
              <AlertTriangle className="text-orange-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border-l-4 border-red-600 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Urgent Items</p>
              <p className="text-3xl font-bold text-red-600">
                {lowStockItems.filter(i => i.daysUntilReorder <= 2).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
              <AlertTriangle className="text-red-600 animate-pulse" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      <div className="bg-orange-50 border-l-4 border-orange-500 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="text-orange-600" size={24} />
          <div>
            <p className="font-semibold text-orange-800">
              {lowStockItems.length} items need attention
            </p>
            <p className="text-sm text-orange-700 mt-1">
              Some items are running low on stock. Please review and take action.
            </p>
          </div>
        </div>
      </div>

      {/* Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, SKU, hoặc danh mục..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d6e3e] focus:border-transparent outline-none"
          />
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="text-gray-500" size={20} />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d6e3e] focus:border-transparent outline-none bg-white cursor-pointer"
          >
            <option value="urgent">Mức độ khẩn cấp</option>
            <option value="quantity">Số lượng tồn kho</option>
            <option value="percentage">Phần trăm tồn kho</option>
            <option value="name">Tên sản phẩm (A-Z)</option>
            <option value="category">Danh mục</option>
            <option value="sku">SKU</option>
          </select>
        </div>
      </div>

      {/* Low Stock Items List/Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Sản phẩm
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Danh mục
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Tồn kho hiện tại
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Tồn kho tối thiểu
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Mức độ
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Reorder
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <Package className="mx-auto mb-3 text-gray-300" size={48} />
                    <p className="font-medium">Không tìm thấy sản phẩm</p>
                    <p className="text-sm mt-1">Thử thay đổi từ khóa tìm kiếm</p>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => {
                  const stockPercentage = (item.quantity / item.minQuantity) * 100
                  const isUrgent = item.daysUntilReorder <= 2

                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      {/* Status Badge */}
                      <td className="px-6 py-4">
                        {isUrgent ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                            <AlertTriangle size={14} />
                            URGENT
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                            <AlertTriangle size={14} />
                            LOW
                          </span>
                        )}
                      </td>

                      {/* Product Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Package className="text-gray-400" size={20} />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{item.name}</p>
                            <p className="text-sm text-gray-500">{item.sku}</p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{item.category}</span>
                      </td>

                      {/* Current Stock */}
                      <td className="px-6 py-4">
                        <span className="font-semibold text-orange-600">{item.quantity} units</span>
                      </td>

                      {/* Min Stock */}
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{item.minQuantity} units</span>
                      </td>

                      {/* Stock Level Progress */}
                      <td className="px-6 py-4">
                        <div className="w-24">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs font-semibold ${
                              stockPercentage <= 30 ? 'text-red-600' : 'text-orange-600'
                            }`}>
                              {stockPercentage.toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                stockPercentage <= 30 ? 'bg-red-500' : 'bg-orange-500'
                              }`}
                              style={{ width: `${Math.max(stockPercentage, 5)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Days Until Reorder */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle 
                            className={isUrgent ? 'text-red-600' : 'text-orange-600'} 
                            size={16} 
                          />
                          <span className={`text-sm font-medium ${
                            isUrgent ? 'text-red-800' : 'text-orange-800'
                          }`}>
                            {item.daysUntilReorder} {item.daysUntilReorder === 1 ? 'day' : 'days'}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex gap-2 justify-end">
                          <Button 
                            size="sm" 
                            className={`${
                              isUrgent 
                                ? 'bg-red-600 hover:bg-red-700' 
                                : 'bg-orange-600 hover:bg-orange-700'
                            }`}
                          >
                            Reorder Now
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-gray-300"
                          >
                            Details
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              {/* Pagination Info */}
              <div className="text-sm text-gray-600">
                Showing <span className="font-medium text-gray-900">{startIndex + 1}</span> to{' '}
                <span className="font-medium text-gray-900">{Math.min(endIndex, filteredAndSortedItems.length)}</span> of{' '}
                <span className="font-medium text-gray-900">{filteredAndSortedItems.length}</span> items
              </div>

              {/* Pagination Buttons */}
              <div className="flex items-center gap-2">
                {/* Previous Button */}
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg border transition-colors ${
                    currentPage === 1
                      ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <ChevronLeft size={20} />
                </button>

                {/* Page Numbers */}
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            currentPage === page
                              ? 'bg-[#2d6e3e] text-white'
                              : 'text-gray-700 hover:bg-gray-100 border border-gray-300'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="px-2 text-gray-400">...</span>
                    }
                    return null
                  })}
                </div>

                {/* Next Button */}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg border transition-colors ${
                    currentPage === totalPages
                      ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results Count */}
        {filteredAndSortedItems.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Tìm thấy <span className="font-semibold">{filteredAndSortedItems.length}</span> sản phẩm cần restock
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
