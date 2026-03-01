'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { XCircle, Search, X, Package, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { getOutOfStockItems } from '@/data/inventory-data'

// Get out of stock items from shared inventory data
const outOfStockItems = getOutOfStockItems()

export default function OutOfStockPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'sku' | 'date'>('name')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Filter và sort items
  const filteredItems = useMemo(() => {
    let filtered = outOfStockItems.filter(item => {
      const searchLower = searchQuery.toLowerCase()
      return (
        item.name.toLowerCase().includes(searchLower) ||
        item.sku.toLowerCase().includes(searchLower) ||
        item.category.toLowerCase().includes(searchLower) ||
        (item.supplier && item.supplier.toLowerCase().includes(searchLower))
      )
    })

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'sku':
          return a.sku.localeCompare(b.sku)
        case 'date':
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
        default:
          return 0
      }
    })

    return filtered
  }, [searchQuery, sortBy])

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedItems = filteredItems.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, sortBy])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
            <XCircle className="text-red-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Out of Stock Items</h1>
            <p className="text-gray-600 text-sm mt-1">
              Quản lý và theo dõi sản phẩm đã hết hàng
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-red-50 border border-red-200 rounded-lg px-6 py-3">
            <div className="text-red-600 text-sm font-medium">Sản phẩm hết hàng</div>
            <div className="text-red-700 text-2xl font-bold">{outOfStockItems.length}</div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Tổng quan</h3>
            <p className="text-sm text-gray-600">
              Hiện có <span className="font-bold text-red-600">{outOfStockItems.length} sản phẩm</span> đang hết hàng và cần nhập thêm
            </p>
          </div>
          <Button
            className="bg-[#2d6e3e] hover:bg-[#245a32]"
            onClick={() => router.push('/warehouse/stock-movement')}
          >
            Nhập hàng hàng loạt
          </Button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, SKU, danh mục hoặc nhà cung cấp..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d6e3e] focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 font-medium">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'sku' | 'date')}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d6e3e] focus:border-transparent bg-white"
            >
              <option value="name">Tên sản phẩm</option>
              <option value="sku">Mã SKU</option>
              <option value="date">Ngày hết hàng</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        {searchQuery && (
          <div className="mt-4 text-sm text-gray-600">
            Tìm thấy <span className="font-semibold text-gray-800">{filteredItems.length}</span> sản phẩm
          </div>
        )}
      </div>

      {/* Out of Stock Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {paginatedItems.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">Product Name</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">SKU</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">Category</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-700 text-sm">Unit</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">Last Updated</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">Supplier</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-700 text-sm">Status</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-700 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-medium text-gray-800">{item.name}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-gray-600 font-mono text-sm">{item.sku}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-gray-700">{item.category}</span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="text-gray-600">{item.unit}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-gray-600">{new Date(item.lastUpdated).toLocaleDateString('vi-VN')}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-gray-700">{item.supplier || 'N/A'}</span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                          Out of Stock
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <Button
                          variant="outline"
                          className="border-[#2d6e3e] text-[#2d6e3e] hover:bg-[#2d6e3e] hover:text-white"
                          onClick={() => router.push('/warehouse/stock-movement')}
                        >
                          Nhập hàng
                        </Button>
                      </td>
                    </tr>
                  ))}
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
                    <span className="font-medium text-gray-900">{Math.min(endIndex, filteredItems.length)}</span> of{' '}
                    <span className="font-medium text-gray-900">{filteredItems.length}</span> items
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
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <Package className="text-gray-300 mb-4" size={64} />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Không tìm thấy sản phẩm</h3>
            <p className="text-gray-500 text-center">
              Không có sản phẩm nào khớp với từ khóa tìm kiếm của bạn
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
