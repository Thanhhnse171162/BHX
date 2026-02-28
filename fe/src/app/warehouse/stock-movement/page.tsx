'use client'

import { useState, useMemo, useEffect } from 'react'
import { ArrowDownUp, TrendingUp, TrendingDown, Search, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'

// Mock data - 15 years of historical transactions (2011-2026)
const stockMovements = [
  // 2026 (Recent)
  { id: 1, type: 'in', product: 'Fresh Milk 1L', sku: 'MLK789', quantity: 200, unit: 'liters', date: '2026-02-26', time: '10:30', reason: 'Supplier Delivery', staff: 'Nguyen Van A', notes: 'Morning delivery from supplier ABC' },
  { id: 2, type: 'out', product: 'Bottled Water 500ml', sku: 'WTR555', quantity: 50, unit: 'bottles', date: '2026-02-25', time: '14:20', reason: 'Store Transfer', staff: 'Tran Thi B', notes: 'Transfer to Store Branch 01' },
  { id: 3, type: 'in', product: 'Cooking Oil 1L', sku: 'OIL678', quantity: 100, unit: 'liters', date: '2026-02-20', time: '09:15', reason: 'Supplier Delivery', staff: 'Le Van C', notes: 'Regular weekly delivery' },
  { id: 4, type: 'in', product: 'Rice 5kg', sku: 'RIC901', quantity: 150, unit: 'bags', date: '2026-01-15', time: '11:00', reason: 'Purchase Order', staff: 'Nguyen Van A', notes: 'New stock arrival' },
  { id: 5, type: 'out', product: 'Apple Fuji', sku: 'APL123', quantity: 30, unit: 'kg', date: '2026-01-10', time: '16:45', reason: 'Damaged Items', staff: 'Pham Thi D', notes: 'Items damaged during storage' },
  
  // 2025
  { id: 6, type: 'in', product: 'Sugar 1kg', sku: 'SGR234', quantity: 80, unit: 'kg', date: '2025-12-10', time: '08:00', reason: 'Supplier Delivery', staff: 'Le Van C', notes: 'Year-end stock' },
  { id: 7, type: 'out', product: 'Instant Noodles', sku: 'NDL456', quantity: 120, unit: 'boxes', date: '2025-10-05', time: '13:30', reason: 'Customer Order', staff: 'Tran Thi B', notes: 'Large bulk order' },
  { id: 8, type: 'in', product: 'Eggs', sku: 'EGG345', quantity: 200, unit: 'cartons', date: '2025-08-22', time: '07:30', reason: 'Supplier Delivery', staff: 'Nguyen Van A', notes: 'Fresh morning delivery' },
  { id: 9, type: 'out', product: 'Cooking Oil 1L', sku: 'OIL678', quantity: 45, unit: 'liters', date: '2025-06-15', time: '15:00', reason: 'Store Transfer', staff: 'Pham Thi D', notes: 'Branch 02 transfer' },
  { id: 10, type: 'in', product: 'Bottled Water 500ml', sku: 'WTR555', quantity: 500, unit: 'bottles', date: '2025-04-08', time: '10:00', reason: 'Purchase Order', staff: 'Le Van C', notes: 'Summer preparation' },
  
  // 2024
  { id: 11, type: 'out', product: 'Fresh Milk 1L', sku: 'MLK789', quantity: 30, unit: 'liters', date: '2024-11-20', time: '09:45', reason: 'Expired Items', staff: 'Tran Thi B', notes: 'Past expiration' },
  { id: 12, type: 'in', product: 'Rice 5kg', sku: 'RIC901', quantity: 300, unit: 'bags', date: '2024-09-10', time: '14:15', reason: 'Supplier Delivery', staff: 'Nguyen Van A', notes: 'Large shipment' },
  { id: 13, type: 'in', product: 'Apple Fuji', sku: 'APL123', quantity: 100, unit: 'kg', date: '2024-07-05', time: '08:30', reason: 'Supplier Delivery', staff: 'Le Van C', notes: 'Harvest season' },
  { id: 14, type: 'out', product: 'Sugar 1kg', sku: 'SGR234', quantity: 60, unit: 'kg', date: '2024-05-18', time: '11:20', reason: 'Store Transfer', staff: 'Pham Thi D', notes: 'Branch 03 restocking' },
  
  // 2023
  { id: 15, type: 'in', product: 'Instant Noodles', sku: 'NDL456', quantity: 200, unit: 'boxes', date: '2023-12-12', time: '09:00', reason: 'Purchase Order', staff: 'Nguyen Van A', notes: 'Popular item restock' },
  { id: 16, type: 'out', product: 'Eggs', sku: 'EGG345', quantity: 50, unit: 'cartons', date: '2023-10-20', time: '16:00', reason: 'Customer Order', staff: 'Tran Thi B', notes: 'Wholesale order' },
  { id: 17, type: 'in', product: 'Cooking Oil 1L', sku: 'OIL678', quantity: 150, unit: 'liters', date: '2023-08-08', time: '10:45', reason: 'Supplier Delivery', staff: 'Le Van C', notes: 'Regular supply' },
  { id: 18, type: 'out', product: 'Rice 5kg', sku: 'RIC901', quantity: 80, unit: 'bags', date: '2023-06-15', time: '14:30', reason: 'Damaged Items', staff: 'Pham Thi D', notes: 'Water damage' },
  
  // 2022
  { id: 19, type: 'in', product: 'Bottled Water 500ml', sku: 'WTR555', quantity: 300, unit: 'bottles', date: '2022-11-25', time: '08:15', reason: 'Purchase Order', staff: 'Nguyen Van A', notes: 'Year-end stock up' },
  { id: 20, type: 'out', product: 'Fresh Milk 1L', sku: 'MLK789', quantity: 25, unit: 'liters', date: '2022-09-10', time: '12:00', reason: 'Expired Items', staff: 'Tran Thi B', notes: 'Expiration clearance' },
  { id: 21, type: 'in', product: 'Sugar 1kg', sku: 'SGR234', quantity: 120, unit: 'kg', date: '2022-07-18', time: '09:30', reason: 'Supplier Delivery', staff: 'Le Van C', notes: 'Mid-year supply' },
  
  // 2021
  { id: 22, type: 'in', product: 'Apple Fuji', sku: 'APL123', quantity: 75, unit: 'kg', date: '2021-10-20', time: '07:45', reason: 'Supplier Delivery', staff: 'Nguyen Van A', notes: 'Fall harvest' },
  { id: 23, type: 'out', product: 'Instant Noodles', sku: 'NDL456', quantity: 100, unit: 'boxes', date: '2021-08-12', time: '15:20', reason: 'Store Transfer', staff: 'Pham Thi D', notes: 'New branch opening' },
  { id: 24, type: 'in', product: 'Rice 5kg', sku: 'RIC901', quantity: 200, unit: 'bags', date: '2021-05-05', time: '11:30', reason: 'Purchase Order', staff: 'Le Van C', notes: 'Bulk discount purchase' },
  
  // 2020
  { id: 25, type: 'in', product: 'Eggs', sku: 'EGG345', quantity: 150, unit: 'cartons', date: '2020-12-22', time: '06:50', reason: 'Supplier Delivery', staff: 'Nguyen Van A', notes: 'Holiday season stock' },
  { id: 26, type: 'out', product: 'Cooking Oil 1L', sku: 'OIL678', quantity: 35, unit: 'liters', date: '2020-09-08', time: '13:45', reason: 'Customer Order', staff: 'Tran Thi B', notes: 'Corporate order' },
  
  // 2019
  { id: 27, type: 'in', product: 'Bottled Water 500ml', sku: 'WTR555', quantity: 250, unit: 'bottles', date: '2019-11-15', time: '10:20', reason: 'Supplier Delivery', staff: 'Le Van C', notes: 'Regular delivery' },
  { id: 28, type: 'in', product: 'Fresh Milk 1L', sku: 'MLK789', quantity: 180, unit: 'liters', date: '2019-08-30', time: '07:15', reason: 'Supplier Delivery', staff: 'Nguyen Van A', notes: 'Fresh dairy delivery' },
  
  // 2018
  { id: 29, type: 'out', product: 'Sugar 1kg', sku: 'SGR234', quantity: 40, unit: 'kg', date: '2018-10-14', time: '14:00', reason: 'Store Transfer', staff: 'Pham Thi D', notes: 'Store restocking' },
  { id: 30, type: 'in', product: 'Rice 5kg', sku: 'RIC901', quantity: 180, unit: 'bags', date: '2018-07-03', time: '09:40', reason: 'Purchase Order', staff: 'Le Van C', notes: 'Summer restock' },
  
  // 2017-2016
  { id: 31, type: 'in', product: 'Apple Fuji', sku: 'APL123', quantity: 90, unit: 'kg', date: '2017-12-12', time: '08:20', reason: 'Supplier Delivery', staff: 'Nguyen Van A', notes: 'Year-end delivery' },
  { id: 32, type: 'out', product: 'Instant Noodles', sku: 'NDL456', quantity: 85, unit: 'boxes', date: '2017-09-25', time: '15:30', reason: 'Customer Order', staff: 'Tran Thi B', notes: 'Large order' },
  { id: 33, type: 'in', product: 'Eggs', sku: 'EGG345', quantity: 140, unit: 'cartons', date: '2016-11-08', time: '07:00', reason: 'Supplier Delivery', staff: 'Le Van C', notes: 'Morning delivery' },
  { id: 34, type: 'in', product: 'Cooking Oil 1L', sku: 'OIL678', quantity: 130, unit: 'liters', date: '2016-08-18', time: '10:15', reason: 'Purchase Order', staff: 'Nguyen Van A', notes: 'Quarterly stock' },
  
  // 2015-2014
  { id: 35, type: 'out', product: 'Bottled Water 500ml', sku: 'WTR555', quantity: 60, unit: 'bottles', date: '2015-10-30', time: '12:45', reason: 'Store Transfer', staff: 'Pham Thi D', notes: 'Branch transfer' },
  { id: 36, type: 'in', product: 'Fresh Milk 1L', sku: 'MLK789', quantity: 170, unit: 'liters', date: '2015-07-20', time: '07:30', reason: 'Supplier Delivery', staff: 'Le Van C', notes: 'Summer supply' },
  { id: 37, type: 'in', product: 'Sugar 1kg', sku: 'SGR234', quantity: 110, unit: 'kg', date: '2014-12-05', time: '09:00', reason: 'Purchase Order', staff: 'Nguyen Van A', notes: 'End of year stock' },
  { id: 38, type: 'out', product: 'Rice 5kg', sku: 'RIC901', quantity: 70, unit: 'bags', date: '2014-09-15', time: '14:20', reason: 'Customer Order', staff: 'Tran Thi B', notes: 'Customer bulk order' },
  
  // 2013-2012
  { id: 39, type: 'in', product: 'Apple Fuji', sku: 'APL123', quantity: 85, unit: 'kg', date: '2013-11-22', time: '08:40', reason: 'Supplier Delivery', staff: 'Le Van C', notes: 'Late season harvest' },
  { id: 40, type: 'in', product: 'Instant Noodles', sku: 'NDL456', quantity: 190, unit: 'boxes', date: '2013-08-10', time: '10:30', reason: 'Supplier Delivery', staff: 'Nguyen Van A', notes: 'Regular supply' },
  { id: 41, type: 'out', product: 'Eggs', sku: 'EGG345', quantity: 45, unit: 'cartons', date: '2012-10-18', time: '13:15', reason: 'Store Transfer', staff: 'Pham Thi D', notes: 'Store restocking' },
  { id: 42, type: 'in', product: 'Cooking Oil 1L', sku: 'OIL678', quantity: 140, unit: 'liters', date: '2012-07-25', time: '09:20', reason: 'Purchase Order', staff: 'Le Van C', notes: 'Mid-year purchase' },
  
  // 2011 (Early history)
  { id: 43, type: 'in', product: 'Bottled Water 500ml', sku: 'WTR555', quantity: 220, unit: 'bottles', date: '2011-12-15', time: '08:30', reason: 'Supplier Delivery', staff: 'Nguyen Van A', notes: 'Initial warehouse setup' },
  { id: 44, type: 'in', product: 'Fresh Milk 1L', sku: 'MLK789', quantity: 160, unit: 'liters', date: '2011-11-03', time: '07:45', reason: 'Supplier Delivery', staff: 'Le Van C', notes: 'Opening inventory' },
  { id: 45, type: 'in', product: 'Rice 5kg', sku: 'RIC901', quantity: 180, unit: 'bags', date: '2011-11-03', time: '09:00', reason: 'Purchase Order', staff: 'Nguyen Van A', notes: 'Initial warehouse stocking' }
]

export default function StockMovementPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'in' | 'out'>('all')
  const [showForm, setShowForm] = useState(false)
  const [movementType, setMovementType] = useState<'in' | 'out'>('in')
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const filteredMovements = useMemo(() => {
    let filtered = stockMovements

    // Filter by tab (all/in/out)
    if (activeTab !== 'all') {
      filtered = filtered.filter(m => m.type === activeTab)
    }

    // Filter by search term (product name or SKU)
    if (searchTerm) {
      filtered = filtered.filter(m => 
        m.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.sku.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by date range
    if (startDate || endDate) {
      // User has specified date range - use their filters
      if (startDate) {
        filtered = filtered.filter(m => m.date >= startDate)
      }
      if (endDate) {
        filtered = filtered.filter(m => m.date <= endDate)
      }
    } else if (!searchTerm) {
      // No filters applied - show only recent transactions (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const defaultStartDate = thirtyDaysAgo.toISOString().split('T')[0]
      filtered = filtered.filter(m => m.date >= defaultStartDate)
    }

    return filtered
  }, [activeTab, searchTerm, startDate, endDate])

  const totalInTransactions = filteredMovements.filter(m => m.type === 'in').length
  const totalOutTransactions = filteredMovements.filter(m => m.type === 'out').length

  // Pagination
  const totalPages = Math.ceil(filteredMovements.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedMovements = filteredMovements.slice(startIndex, endIndex)

  const clearFilters = () => {
    setSearchTerm('')
    setStartDate('')
    setEndDate('')
    setCurrentPage(1)
  }

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, searchTerm, startDate, endDate])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock In / Stock Out</h1>
          <p className="text-gray-600 mt-1">Record and track inventory movements</p>
        </div>
        <div className="flex gap-3">
          <Button 
            className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
            onClick={() => {
              setMovementType('in')
              setShowForm(true)
            }}
          >
            <TrendingUp size={18} />
            Record Stock In
          </Button>
          <Button 
            className="bg-red-600 hover:bg-red-700 flex items-center gap-2"
            onClick={() => {
              setMovementType('out')
              setShowForm(true)
            }}
          >
            <TrendingDown size={18} />
            Record Stock Out
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Stock In</p>
              <p className="text-3xl font-bold text-green-600">+{totalInTransactions}</p>
              <p className="text-xs text-gray-500 mt-1">transactions</p>
            </div>
            <TrendingUp className="text-green-500" size={36} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Stock Out</p>
              <p className="text-3xl font-bold text-red-600">-{totalOutTransactions}</p>
              <p className="text-xs text-gray-500 mt-1">transactions</p>
            </div>
            <TrendingDown className="text-red-500" size={36} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Net Movement</p>
              <p className={`text-3xl font-bold ${totalInTransactions - totalOutTransactions >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalInTransactions - totalOutTransactions >= 0 ? '+' : ''}{totalInTransactions - totalOutTransactions}
              </p>
              <p className="text-xs text-gray-500 mt-1">transactions</p>
            </div>
            <ArrowDownUp className="text-gray-500" size={36} />
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-300 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              Record Stock {movementType === 'in' ? 'In' : 'Out'}
            </h3>
            <button 
              onClick={() => setShowForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product SKU</label>
              <Input placeholder="Enter SKU..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
              <Input type="number" placeholder="Enter quantity..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d6e3e]">
                {movementType === 'in' ? (
                  <>
                    <option>Supplier Delivery</option>
                    <option>Purchase Order</option>
                    <option>Return from Store</option>
                    <option>Other</option>
                  </>
                ) : (
                  <>
                    <option>Store Transfer</option>
                    <option>Customer Order</option>
                    <option>Damaged Items</option>
                    <option>Expired Items</option>
                    <option>Other</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Staff Name</label>
              <Input placeholder="Your name..." defaultValue="Nguyen Van A" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d6e3e]"
                rows={3}
                placeholder="Additional notes..."
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button 
              className={`flex-1 ${movementType === 'in' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              Record {movementType === 'in' ? 'Stock In' : 'Stock Out'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowForm(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Search and Date Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search Box */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Product / SKU</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter product name or SKU..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={endDate || undefined}
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || undefined}
            />
          </div>
        </div>

        {/* Filter Summary & Clear */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {(searchTerm || startDate || endDate) ? (
              <>
                Showing <span className="font-bold text-[#2d6e3e]">{filteredMovements.length}</span> transaction{filteredMovements.length !== 1 ? 's' : ''}
                {searchTerm && <span> matching "{searchTerm}"</span>}
                {startDate && <span> from {startDate}</span>}
                {endDate && <span> to {endDate}</span>}
              </>
            ) : (
              <>
                Showing <span className="font-bold text-[#2d6e3e]">{filteredMovements.length}</span> recent transaction{filteredMovements.length !== 1 ? 's' : ''} <span className="text-gray-500">(last 30 days)</span>
                <span className="ml-2 text-gray-500">• Use date filter to view older transactions</span>
              </>
            )}
          </div>
          {(searchTerm || startDate || endDate) && (
            <Button
              variant="outline"
              onClick={clearFilters}
              className="flex items-center gap-2 text-sm"
            >
              <X size={16} />
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              activeTab === 'all' 
                ? 'bg-[#2d6e3e] text-white' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            All Movements
          </button>
          <button
            onClick={() => setActiveTab('in')}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              activeTab === 'in' 
                ? 'bg-green-600 text-white' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Stock In
          </button>
          <button
            onClick={() => setActiveTab('out')}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              activeTab === 'out' 
                ? 'bg-red-600 text-white' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Stock Out
          </button>
        </div>

        {/* Movement History */}
        <div className="divide-y divide-gray-200">
          {paginatedMovements.length > 0 ? (
            paginatedMovements.map((movement) => (
              <div key={movement.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-3 rounded-lg ${
                      movement.type === 'in' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {movement.type === 'in' ? (
                        <TrendingUp className={movement.type === 'in' ? 'text-green-600' : 'text-red-600'} size={24} />
                      ) : (
                        <TrendingDown className="text-red-600" size={24} />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-bold text-gray-900 text-lg">{movement.product}</h4>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                          {movement.sku}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 mb-1">Quantity</p>
                          <p className={`font-bold text-lg ${movement.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                            {movement.type === 'in' ? '+' : '-'}{movement.quantity} {movement.unit}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">Date & Time</p>
                          <p className="font-medium text-gray-900">{movement.date}</p>
                          <p className="text-gray-600 text-xs">{movement.time}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">Reason</p>
                          <p className="font-medium text-gray-900">{movement.reason}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">Recorded By</p>
                          <p className="font-medium text-gray-900">{movement.staff}</p>
                        </div>
                      </div>

                      {movement.notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium text-gray-700">Notes:</span> {movement.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <p className="text-gray-500">No transactions found</p>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              {/* Pagination Info */}
              <div className="text-sm text-gray-600">
                Showing <span className="font-medium text-gray-900">{startIndex + 1}</span> to{' '}
                <span className="font-medium text-gray-900">{Math.min(endIndex, filteredMovements.length)}</span> of{' '}
                <span className="font-medium text-gray-900">{filteredMovements.length}</span> transactions
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
                    // Show first page, last page, current page, and pages around current
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
