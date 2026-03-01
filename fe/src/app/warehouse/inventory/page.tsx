'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { inventoryData } from '@/data/inventory-data'

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const filteredInventory = useMemo(() => {
    return inventoryData.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.sku.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesFilter = filterStatus === 'all' || item.status === filterStatus
      return matchesSearch && matchesFilter
    })
  }, [searchTerm, filterStatus])

  // Pagination
  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedInventory = filteredInventory.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterStatus])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory List</h1>
        <p className="text-gray-600 mt-1">Manage and track all warehouse inventory</p>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-1">Total Items</p>
            <p className="text-2xl font-bold text-gray-900">{inventoryData.length}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-1">In Stock</p>
            <p className="text-2xl font-bold text-green-600">
              {inventoryData.filter(i => i.status === 'in-stock').length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-1">Low Stock</p>
            <p className="text-2xl font-bold text-orange-600">
              {inventoryData.filter(i => i.status === 'low-stock').length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-1">Out of Stock</p>
            <p className="text-2xl font-bold text-red-600">
              {inventoryData.filter(i => i.status === 'out-of-stock').length}
            </p>
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
                placeholder="Search by product name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <Button
              variant={filterStatus === 'all' ? 'primary' : 'outline'}
              onClick={() => setFilterStatus('all')}
              className={filterStatus === 'all' ? 'bg-[#2d6e3e]' : ''}
            >
              All
            </Button>
            <Button
              variant={filterStatus === 'in-stock' ? 'primary' : 'outline'}
              onClick={() => setFilterStatus('in-stock')}
              className={filterStatus === 'in-stock' ? 'bg-[#2d6e3e]' : ''}
            >
              In Stock
            </Button>
            <Button
              variant={filterStatus === 'low-stock' ? 'primary' : 'outline'}
              onClick={() => setFilterStatus('low-stock')}
              className={filterStatus === 'low-stock' ? 'bg-orange-600' : ''}
            >
              Low Stock
            </Button>
            <Button
              variant={filterStatus === 'out-of-stock' ? 'primary' : 'outline'}
              onClick={() => setFilterStatus('out-of-stock')}
              className={filterStatus === 'out-of-stock' ? 'bg-red-600' : ''}
            >
              Out of Stock
            </Button>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Product Name</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">SKU</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Category</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-700">Quantity</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-700">Status</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-700">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {paginatedInventory.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-6 font-medium text-gray-900">{item.name}</td>
                  <td className="py-4 px-6 text-gray-600">{item.sku}</td>
                  <td className="py-4 px-6 text-gray-600">{item.category}</td>
                  <td className="py-4 px-6 text-center">
                    <span className="font-semibold text-gray-900">
                      {item.quantity} <span className="text-gray-500 text-sm font-normal">{item.unit}</span>
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    {item.status === 'in-stock' && (
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        In Stock
                      </span>
                    )}
                    {item.status === 'low-stock' && (
                      <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                        Low Stock
                      </span>
                    )}
                    {item.status === 'out-of-stock' && (
                      <span className="inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                        Out of Stock
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-center text-gray-600 text-sm">{item.lastUpdated}</td>
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
                <span className="font-medium text-gray-900">{Math.min(endIndex, filteredInventory.length)}</span> of{' '}
                <span className="font-medium text-gray-900">{filteredInventory.length}</span> items
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
      </div>
    </div>
  )
}
