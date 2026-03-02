'use client'

import { useState, useMemo } from 'react'
import { Search, Eye, AlertCircle, CheckCircle, AlertTriangle, ArrowRight, Package, ChevronLeft, ChevronRight } from 'lucide-react'
import { Input } from '@/shared/ui/Input'
import { Button } from '@/shared/ui/Button'
import { inventoryData } from '@/data/inventory-data'

// Shelf monitoring data structure
interface ShelfMonitoringItem {
  id: string
  name: string
  sku: string
  category: string
  shelfLocation: string
  onShelfQty: number
  minDisplayQty: number
  backroomQty: number
  unit: string
  lastRefilled?: string
  status: 'good' | 'low' | 'empty'
}

// Mock shelf data (in production, this would come from API)
const mockShelfData: ShelfMonitoringItem[] = inventoryData.map((item, index) => {
  const onShelf = Math.floor(item.quantity * 0.3) // 30% on shelf
  const backroom = Math.floor(item.quantity * 0.7) // 70% in backroom
  const minDisplay = Math.ceil(item.quantity * 0.2) // Minimum 20% should be on shelf
  
  // Generate shelf location
  const row = Math.floor(index / 10) + 1
  const col = String(index % 10 + 1).padStart(2, '0')
  const shelfLocation = `A-${String(row).padStart(2, '0')}-${col}`
  
  // Generate last refilled timestamp (random within last 3 days)
  const daysAgo = Math.floor(Math.random() * 3)
  const hoursAgo = Math.floor(Math.random() * 24)
  const minutesAgo = Math.floor(Math.random() * 60)
  const lastRefilled = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000 - hoursAgo * 60 * 60 * 1000 - minutesAgo * 60 * 1000)
    .toISOString()
    .replace('T', ' ')
    .substring(0, 19)
  
  // Determine status
  let status: 'good' | 'low' | 'empty' = 'good'
  if (onShelf === 0) {
    status = 'empty'
  } else if (onShelf < minDisplay) {
    status = 'low'
  }
  
  return {
    id: `${item.id}-${index}`.padEnd(36, '0'),
    name: item.name,
    sku: item.sku,
    category: item.category,
    shelfLocation,
    onShelfQty: onShelf,
    minDisplayQty: minDisplay,
    backroomQty: backroom,
    unit: item.unit,
    lastRefilled,
    status
  }
})

export default function ShelfMonitoringPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'good' | 'low' | 'empty'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Calculate summary statistics
  const stats = useMemo(() => {
    const total = mockShelfData.length
    const wellStocked = mockShelfData.filter(i => i.status === 'good').length
    const refillNeeded = mockShelfData.filter(i => i.status === 'low').length
    const emptyShelves = mockShelfData.filter(i => i.status === 'empty').length
    
    return { total, wellStocked, refillNeeded, emptyShelves }
  }, [])

  // Filter data
  const filteredData = useMemo(() => {
    return mockShelfData.filter(item => {
      const matchesSearch = 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.shelfLocation.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = filterStatus === 'all' || item.status === filterStatus
      
      return matchesSearch && matchesStatus
    })
  }, [searchTerm, filterStatus])

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
  }, [searchTerm, filterStatus])

  // Handle refill action
  const handleRefill = (itemId: string) => {
    console.log('Refill shelf for item:', itemId)
    alert(`Refill shelf for item ${itemId} - API integration needed`)
  }

  // Handle order stock
  const handleOrderStock = (itemId: string) => {
    console.log('Order stock for item:', itemId)
    alert(`Order new stock for item ${itemId} - API integration needed`)
  }

  // Status Badge Component
  const StatusBadge = ({ status }: { status: string }) => {
    const configs = {
      good: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-200',
        icon: <CheckCircle size={14} />,
        label: 'Well Stocked'
      },
      low: {
        bg: 'bg-orange-100',
        text: 'text-orange-800',
        border: 'border-orange-200',
        icon: <AlertTriangle size={14} />,
        label: 'Low Stock'
      },
      empty: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-200',
        icon: <AlertCircle size={14} />,
        label: 'Empty - Urgent!'
      }
    }

    const config = configs[status as keyof typeof configs]

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
        {config.icon}
        <span>{config.label}</span>
      </span>
    )
  }

  // Action Component
  const ActionCell = ({ item }: { item: ShelfMonitoringItem }) => {
    if (item.status === 'empty') {
      if (item.backroomQty > 0) {
        return (
          <Button
            size="sm"
            onClick={() => handleRefill(item.id)}
            className="bg-red-500 hover:bg-red-600 text-white text-xs"
          >
            <AlertCircle size={14} className="mr-1" />
            Refill Now
          </Button>
        )
      }
      return (
        <div className="flex flex-col gap-1">
          <p className="text-xs text-red-600 font-semibold">⚠️ No backroom stock</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleOrderStock(item.id)}
            className="text-red-600 border-red-600 hover:bg-red-50 text-xs"
          >
            <Package size={14} className="mr-1" />
            Order Stock
          </Button>
        </div>
      )
    }

    if (item.status === 'low') {
      return (
        <Button
          size="sm"
          onClick={() => handleRefill(item.id)}
          className="bg-orange-500 hover:bg-orange-600 text-white text-xs"
        >
          <ArrowRight size={14} className="mr-1" />
          Transfer
        </Button>
      )
    }

    if (item.backroomQty > 0) {
      return (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleRefill(item.id)}
          className="text-blue-600 border-blue-600 hover:bg-blue-50 text-xs"
        >
          <ArrowRight size={14} className="mr-1" />
          Transfer
        </Button>
      )
    }

    return <span className="text-xs text-gray-400 italic">No action needed</span>
  }

  // Format date/time
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return { date: 'N/A', time: '' }
    const date = new Date(dateStr)
    return {
      date: date.toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shelf Monitoring</h1>
          <p className="text-gray-600 mt-1">Monitor and manage product display levels</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Card 1: Total Shelves */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Shelves</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Eye className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          {/* Card 2: Well Stocked */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Well Stocked</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.wellStocked}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          {/* Card 3: Refill Needed */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Refill Needed</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{stats.refillNeeded}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="text-orange-600" size={24} />
              </div>
            </div>
          </div>

          {/* Card 4: Empty Shelves */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Empty Shelves</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{stats.emptyShelves}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="text-red-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  type="text"
                  placeholder="Search by product name, SKU, category, or shelf location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
            </div>

            {/* Filter Dropdown */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d6e3e] focus:border-transparent min-w-[200px]"
            >
              <option value="all">All Status</option>
              <option value="good">✅ Well Stocked ({stats.wellStocked})</option>
              <option value="low">⚠️ Low Stock ({stats.refillNeeded})</option>
              <option value="empty">🔴 Empty ({stats.emptyShelves})</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Shelf Location
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    On Shelf
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Min Display
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Backroom Qty
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Last Refilled
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <Package size={48} className="mb-3 opacity-50" />
                        <p className="text-sm font-medium">No shelves found</p>
                        <p className="text-xs mt-1">Try adjusting your search or filter</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item) => {
                    const datetime = formatDateTime(item.lastRefilled)
                    
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        {/* ID */}
                        <td className="px-6 py-4">
                          <div className="text-xs text-gray-500 font-mono truncate max-w-[100px]" title={item.id}>
                            {item.id.substring(0, 8)}...
                          </div>
                        </td>

                        {/* Product */}
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{item.name}</div>
                          <div className="text-xs text-gray-500 font-mono">{item.sku}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{item.category}</div>
                        </td>

                        {/* Shelf Location */}
                        <td className="px-6 py-4 text-center">
                          <span className="inline-block bg-blue-100 text-blue-700 px-2.5 py-1 rounded text-xs font-mono font-semibold">
                            {item.shelfLocation}
                          </span>
                        </td>

                        {/* On Shelf */}
                        <td className="px-6 py-4 text-center">
                          <div className={`font-semibold ${
                            item.status === 'empty' ? 'text-red-600' :
                            item.status === 'low' ? 'text-orange-600' :
                            'text-green-600'
                          }`}>
                            {item.onShelfQty} {item.unit}
                          </div>
                        </td>

                        {/* Min Display */}
                        <td className="px-6 py-4 text-center">
                          <div className="text-sm text-gray-600">
                            {item.minDisplayQty} {item.unit}
                          </div>
                        </td>

                        {/* Backroom Qty */}
                        <td className="px-6 py-4 text-center">
                          <div className={`font-semibold ${
                            item.backroomQty === 0 ? 'text-red-600' :
                            item.backroomQty < item.minDisplayQty ? 'text-orange-600' :
                            'text-gray-900'
                          }`}>
                            {item.backroomQty} {item.unit}
                          </div>
                          {item.backroomQty === 0 && (
                            <div className="text-xs text-red-600 mt-0.5">⚠️ No stock</div>
                          )}
                        </td>

                        {/* Last Refilled */}
                        <td className="px-6 py-4 text-center">
                          <div className="text-sm text-gray-900">
                            {datetime.date}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {datetime.time}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 text-center">
                          <StatusBadge status={item.status} />
                        </td>

                        {/* Action */}
                        <td className="px-6 py-4 text-center">
                          <ActionCell item={item} />
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          {filteredData.length > 0 && (
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> of{' '}
                <span className="font-medium">{filteredData.length}</span> shelves
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredData.length > 0 && totalPages > 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
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
    </div>
  )
}
