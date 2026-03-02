'use client'

import { useState, useMemo } from 'react'
import { Search, Eye, AlertCircle, CheckCircle, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { Input } from '@/shared/ui/Input'
import { Button } from '@/shared/ui/Button'
import { inventoryData, InventoryItem } from '@/data/inventory-data'

// Shelf monitoring data structure
interface ShelfStock extends InventoryItem {
  onShelfQty: number
  backroomQty: number
  minDisplayQty: number
  refillNeeded: boolean
}

// Mock shelf data (in production, this would come from API)
const shelfData: ShelfStock[] = inventoryData.map(item => {
  const onShelf = Math.floor(item.quantity * 0.3) // 30% on shelf
  const backroom = Math.floor(item.quantity * 0.7) // 70% in backroom
  const minDisplay = Math.ceil(item.quantity * 0.2) // Minimum 20% should be on shelf
  
  return {
    ...item,
    onShelfQty: onShelf,
    backroomQty: backroom,
    minDisplayQty: minDisplay,
    refillNeeded: onShelf < minDisplay
  }
})

export default function ShelfMonitoringPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showRefillOnly, setShowRefillOnly] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Filter data
  const filteredData = useMemo(() => {
    return shelfData.filter(item => {
      const matchesSearch = 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesRefillFilter = !showRefillOnly || item.refillNeeded
      
      return matchesSearch && matchesRefillFilter
    })
  }, [searchTerm, showRefillOnly])

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
  }, [searchTerm, showRefillOnly])

  // Calculate KPIs
  const totalShelves = shelfData.length
  const refillNeededCount = shelfData.filter(item => item.refillNeeded).length
  const wellStockedCount = shelfData.filter(item => !item.refillNeeded && item.onShelfQty > 0).length
  const emptyShelvesCount = shelfData.filter(item => item.onShelfQty === 0).length

  // Handle refill action
  const handleRefill = (itemId: number) => {
    console.log('Refill shelf for item:', itemId)
    // In production, this would call an API to transfer from backroom to shelf
    alert(`Refill shelf for item ${itemId} - API integration needed`)
  }

  // Refill status component
  const RefillStatus = ({ item }: { item: ShelfStock }) => {
    if (item.onShelfQty === 0) {
      return (
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle size={18} />
          <span className="font-semibold text-sm">Empty - Urgent!</span>
        </div>
      )
    }
    if (item.refillNeeded) {
      return (
        <div className="flex items-center gap-2 text-orange-600">
          <AlertCircle size={18} />
          <span className="font-semibold text-sm">Refill Needed</span>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle size={18} />
        <span className="font-semibold text-sm">Good</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Shelf Monitoring</h1>
        <p className="text-gray-600 mt-1">Monitor and manage product display levels</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Shelves</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalShelves}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Eye className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Well Stocked</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{wellStockedCount}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Refill Needed</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{refillNeededCount}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="text-orange-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Empty Shelves</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{emptyShelvesCount}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="text-red-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Search by product name, SKU, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <div className="flex gap-2">
            <Button
              variant={!showRefillOnly ? 'primary' : 'outline'}
              onClick={() => setShowRefillOnly(false)}
              className={!showRefillOnly ? 'bg-[#2d6e3e] hover:bg-[#25592f]' : ''}
              size="md"
            >
              All Shelves
            </Button>
            <Button
              variant={showRefillOnly ? 'primary' : 'outline'}
              onClick={() => setShowRefillOnly(true)}
              className={showRefillOnly ? 'bg-orange-600 hover:bg-orange-700' : ''}
              size="md"
            >
              Refill Needed Only
            </Button>
          </div>
        </div>
      </div>

      {/* Shelf Monitoring Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  On Shelf
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Min Display
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Backroom Qty
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Eye className="mx-auto mb-3 text-gray-400" size={48} />
                    <p className="text-lg font-medium">No shelves found</p>
                    <p className="text-sm mt-1">Try adjusting your search or filters</p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr 
                    key={item.id} 
                    className={`hover:bg-gray-50 transition-colors ${
                      item.onShelfQty === 0 ? 'bg-red-50' : item.refillNeeded ? 'bg-orange-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{item.category}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm font-semibold ${
                        item.onShelfQty === 0 ? 'text-red-600' : 
                        item.refillNeeded ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        {item.onShelfQty} {item.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {item.minDisplayQty} {item.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {item.backroomQty} {item.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <RefillStatus item={item} />
                    </td>
                    <td className="px-6 py-4">
                      {item.refillNeeded && item.backroomQty > 0 ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleRefill(item.id)}
                          className={`${
                            item.onShelfQty === 0 
                              ? 'bg-red-600 hover:bg-red-700' 
                              : 'bg-[#2d6e3e] hover:bg-[#25592f]'
                          }`}
                        >
                          <RefreshCw size={16} className="mr-1" />
                          Refill Now
                        </Button>
                      ) : item.backroomQty === 0 ? (
                        <span className="text-xs text-gray-500 italic">No backroom stock</span>
                      ) : (
                        <span className="text-xs text-gray-500 italic">No action needed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {filteredData.length > 0 && totalPages > 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} shelves
            </div>
            <div className="flex items-center gap-2">
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
              <div className="flex items-center gap-1">
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
                        className={`min-w-[2.5rem] px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-[#2d6e3e] text-white'
                            : 'text-gray-700 hover:bg-gray-100'
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
    </div>
  )
}
