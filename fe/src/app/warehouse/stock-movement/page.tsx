'use client'

import { useState, useMemo, useEffect } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  Search,
  CheckCircle,
  Clock,
  XCircle,
  X,
  FileText,
  Upload,
  Download,
  ArrowDownUp
} from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import type { MovementStatus, MovementTypeCode } from '@/shared/types/warehouse.types'

// Enterprise-level stock movements with approval workflow
const mockStockMovements = [
  { 
    id: 1, 
    movementNumber: 'SM-20260301-00001',
    type: 'PURCHASE' as MovementTypeCode, 
    status: 'APPROVED' as MovementStatus,
    product: 'Fresh Milk 1L', 
    sku: 'MLK789', 
    quantity: 200, 
    unit: 'liters', 
    date: '2026-03-01', 
    time: '10:30',
    source: 'Vinamilk JSC',
    destination: 'Main Warehouse',
    supplier: 'Vinamilk JSC',
    poNumber: 'PO-20260225-001',
    reason: 'Purchase Order delivery',
    totalValue: 18000000,
    createdBy: 'Nguyen Van A',
    approvedBy: 'Manager Tran B',
    hasAttachment: true
  },
  { 
    id: 2, 
    movementNumber: 'SM-20260228-00015',
    type: 'TRANSFER_OUT' as MovementTypeCode, 
    status: 'COMPLETED' as MovementStatus,
    product: 'Bottled Water 500ml', 
    sku: 'WTR555', 
    quantity: 50, 
    unit: 'bottles', 
    date: '2026-02-28', 
    time: '14:20',
    source: 'Main Warehouse',
    destination: 'Store Branch 01',
    supplier: null,
    reason: 'Store replenishment',
    totalValue: 250000,
    createdBy: 'Tran Thi B',
    approvedBy: 'Manager Le C',
    hasAttachment: false
  },
  { 
    id: 3, 
    movementNumber: 'SM-20260228-00014',
    type: 'TRANSFER_IN' as MovementTypeCode, 
    status: 'PENDING_APPROVAL' as MovementStatus,
    product: 'Rice 5kg', 
    sku: 'RIC901', 
    quantity: 100, 
    unit: 'bags', 
    date: '2026-02-28', 
    time: '09:15',
    source: 'Central Warehouse',
    destination: 'Main Warehouse',
    supplier: null,
    reason: 'Inter-warehouse transfer',
    totalValue: 3500000,
    createdBy: 'Le Van C',
    approvedBy: null,
    hasAttachment: true
  },
  { 
    id: 4, 
    movementNumber: 'SM-20260227-00008',
    type: 'DAMAGE' as MovementTypeCode, 
    status: 'APPROVED' as MovementStatus,
    product: 'Apple Fuji', 
    sku: 'APL123', 
    quantity: 30, 
    unit: 'kg', 
    date: '2026-02-27', 
    time: '16:45',
    source: 'Main Warehouse',
    destination: 'Waste / Write-off',
    supplier: null,
    reason: 'Physical damage during handling',
    totalValue: 900000,
    createdBy: 'Pham Thi D',
    approvedBy: 'Manager Tran B',
    hasAttachment: true
  },
  { 
    id: 5, 
    movementNumber: 'SM-20260227-00007',
    type: 'EXPIRED' as MovementTypeCode, 
    status: 'PENDING_APPROVAL' as MovementStatus,
    product: 'Fresh Milk 1L', 
    sku: 'MLK789', 
    quantity: 15, 
    unit: 'liters', 
    date: '2026-02-27', 
    time: '08:00',
    source: 'Main Warehouse',
    destination: 'Waste / Write-off',
    supplier: null,
    reason: 'Expired batch BATCH-20260115',
    totalValue: 1350000,
    createdBy: 'Nguyen Van A',
    approvedBy: null,
    hasAttachment: false
  },
  { 
    id: 6, 
    movementNumber: 'SM-20260226-00003',
    type: 'ADJUSTMENT' as MovementTypeCode, 
    status: 'CREATED' as MovementStatus,
    product: 'Cooking Oil 1L', 
    sku: 'OIL678', 
    quantity: 5, 
    unit: 'liters', 
    date: '2026-02-26', 
    time: '15:30',
    source: 'Main Warehouse',
    destination: 'Adjustment',
    supplier: null,
    reason: 'Cycle count variance',
    totalValue: 175000,
    createdBy: 'Le Van C',
    approvedBy: null,
    hasAttachment: false
  },
  { 
    id: 7, 
    movementNumber: 'SM-20260226-00002',
    type: 'PURCHASE' as MovementTypeCode, 
    status: 'REJECTED' as MovementStatus,
    product: 'Sugar 1kg', 
    sku: 'SGR234', 
    quantity: 200, 
    unit: 'kg', 
    date: '2026-02-26', 
    time: '10:00',
    source: 'Thai Roosmalt Co.',
    destination: 'Main Warehouse',
    supplier: 'Thai Roosmalt Co.',
    poNumber: 'PO-20260220-005',
    reason: 'Rejected – quantity mismatch with PO',
    totalValue: 4000000,
    createdBy: 'Pham Thi D',
    approvedBy: null,
    hasAttachment: false
  },
]

const movementTypeLabels: Record<MovementTypeCode, { label: string; color: string; icon: JSX.Element }> = {
  PURCHASE: { label: 'Purchase', color: 'blue', icon: <TrendingUp size={16} /> },
  TRANSFER_IN: { label: 'Transfer In', color: 'green', icon: <TrendingUp size={16} /> },
  TRANSFER_OUT: { label: 'Transfer Out', color: 'orange', icon: <TrendingDown size={16} /> },
  DAMAGE: { label: 'Damage', color: 'red', icon: <XCircle size={16} /> },
  EXPIRED: { label: 'Expired', color: 'purple', icon: <Clock size={16} /> },
  ADJUSTMENT: { label: 'Adjustment', color: 'gray', icon: <FileText size={16} /> },
  RETURN_SUPPLIER: { label: 'Return to Supplier', color: 'yellow', icon: <TrendingDown size={16} /> },
  SALE_DEDUCTION: { label: 'Sale', color: 'cyan', icon: <TrendingDown size={16} /> },
  PRODUCTION: { label: 'Production', color: 'teal', icon: <TrendingUp size={16} /> },
  SAMPLE: { label: 'Sample', color: 'pink', icon: <TrendingDown size={16} /> },
}

const statusConfig: Record<MovementStatus, { label: string; color: string; bgColor: string }> = {
  CREATED: { label: 'Draft', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  PENDING_APPROVAL: { label: 'Pending Approval', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  APPROVED: { label: 'Approved', color: 'text-green-700', bgColor: 'bg-green-100' },
  REJECTED: { label: 'Rejected', color: 'text-red-700', bgColor: 'bg-red-100' },
  COMPLETED: { label: 'Completed', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  CANCELLED: { label: 'Cancelled', color: 'text-gray-700', bgColor: 'bg-gray-200' },
}

export default function StockMovementPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'in' | 'out'>('all')
  const [statusFilter, setStatusFilter] = useState<MovementStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<MovementTypeCode | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [movementType, setMovementType] = useState<'in' | 'out'>('in')
  const itemsPerPage = 10

  // Define movement categories
  const inboundTypes: MovementTypeCode[] = ['PURCHASE', 'TRANSFER_IN', 'PRODUCTION']
  const outboundTypes: MovementTypeCode[] = ['SALE_DEDUCTION', 'TRANSFER_OUT', 'DAMAGE', 'EXPIRED', 'RETURN_SUPPLIER', 'SAMPLE', 'ADJUSTMENT']
  
  const isInboundMovement = (type: MovementTypeCode) => inboundTypes.includes(type)
  
  const filteredMovements = useMemo(() => {
    let filtered = mockStockMovements

    // Filter by active tab (In/Out/All)
    if (activeTab === 'in') {
      filtered = filtered.filter(m => inboundTypes.includes(m.type))
    } else if (activeTab === 'out') {
      filtered = filtered.filter(m => outboundTypes.includes(m.type))
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(m => m.status === statusFilter)
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(m => m.type === typeFilter)
    }

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(m => 
        m.product.toLowerCase().includes(term) ||
        m.sku.toLowerCase().includes(term) ||
        m.movementNumber.toLowerCase().includes(term) ||
        m.poNumber?.toLowerCase().includes(term)
      )
    }

    // Date range
    if (startDate) {
      filtered = filtered.filter(m => m.date >= startDate)
    }
    if (endDate) {
      filtered = filtered.filter(m => m.date <= endDate)
    }

    return filtered
  }, [activeTab, statusFilter, typeFilter, searchTerm, startDate, endDate])

  // Summary stats
  const summaryStats = useMemo(() => {
    const inboundTypes: MovementTypeCode[] = ['PURCHASE', 'TRANSFER_IN', 'PRODUCTION']
    const outboundTypes: MovementTypeCode[] = ['SALE', 'TRANSFER_OUT', 'DAMAGE', 'EXPIRED', 'RETURN_TO_SUPPLIER', 'SAMPLE']
    
    const pendingApprovals = mockStockMovements.filter(m => m.status === 'PENDING_APPROVAL').length
    const approvedToday = mockStockMovements.filter(m => m.status === 'APPROVED' && m.date === '2026-03-01').length
    const totalValueIn = mockStockMovements
      .filter(m => m.totalValue && m.totalValue > 0)
      .reduce((sum, m) => sum + (m.totalValue || 0), 0)
    
    const totalInTransactions = mockStockMovements.filter(m => inboundTypes.includes(m.type)).length
    const totalOutTransactions = mockStockMovements.filter(m => outboundTypes.includes(m.type)).length

    return { pendingApprovals, approvedToday, totalValueIn, totalInTransactions, totalOutTransactions }
  }, [])

  const clearFilters = () => {
    setActiveTab('all')
    setStatusFilter('all')
    setTypeFilter('all')
    setSearchTerm('')
    setStartDate('')
    setEndDate('')
    setCurrentPage(1)
  }

  // Destructure summary stats
  const { pendingApprovals, approvedToday, totalValueIn, totalInTransactions, totalOutTransactions } = summaryStats

  // Pagination
  const totalPages = Math.ceil(filteredMovements.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedMovements = filteredMovements.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, searchTerm, startDate, endDate])

  return (
    <div className="space-y-5">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock In / Stock Out</h1>
          <p className="text-gray-600 mt-1">Record and track inventory movements</p>
        </div>
        <div className="flex gap-2">
          <Button
            className="bg-[#2d6e3e] hover:bg-[#255931] flex items-center gap-1.5 text-sm h-9 px-4"
            onClick={() => { setMovementType('in'); setShowForm(true) }}
          >
            <TrendingUp size={18} />
            Record Stock In
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700 flex items-center gap-1.5 text-sm h-9 px-4"
            onClick={() => { setMovementType('out'); setShowForm(true) }}
          >
            <TrendingDown size={18} />
            Record Stock Out
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border-l-4 border-green-600 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Total Stock In</p>
              <p className="text-3xl font-bold text-green-600">+{totalInTransactions}</p>
              <p className="text-xs text-gray-500 mt-1">transactions</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border-l-4 border-red-600 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Total Stock Out</p>
              <p className="text-3xl font-bold text-red-600">-{totalOutTransactions}</p>
              <p className="text-xs text-gray-500 mt-1">transactions</p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
              <TrendingDown className="text-red-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border-l-4 border-blue-500 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Net Movement</p>
              <p className={`text-3xl font-bold ${totalInTransactions - totalOutTransactions >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalInTransactions - totalOutTransactions >= 0 ? '+' : ''}{totalInTransactions - totalOutTransactions}
              </p>
              <p className="text-xs text-gray-500 mt-1">transactions</p>
            </div>
            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center">
              <ArrowDownUp className="text-gray-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Record Form ── */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-300 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              Record Stock {movementType === 'in' ? 'In' : 'Out'}
            </h3>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
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
            {movementType === 'in' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Supplier</label>
                <Input placeholder="Supplier name..." />
              </div>
            )}
            {movementType === 'out' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Destination</label>
                <Input placeholder="Store / Waste..." />
              </div>
            )}
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter product name or SKU..."
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Movement Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as MovementTypeCode | 'all')}
              className="w-full h-9 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6e3e] bg-white"
            >
              <option value="all">All Types</option>
              <option value="PURCHASE">Purchase</option>
              <option value="TRANSFER_IN">Transfer In</option>
              <option value="TRANSFER_OUT">Transfer Out</option>
              <option value="DAMAGE">Damage</option>
              <option value="EXPIRED">Expired</option>
              <option value="ADJUSTMENT">Adjustment</option>
              <option value="RETURN_SUPPLIER">Return to Supplier</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={endDate || undefined}
            />
          </div>
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

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Tabs */}
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
            paginatedMovements.map((movement) => {
              const isInbound = isInboundMovement(movement.type)
              return (
              <div key={movement.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-3 rounded-lg ${
                      isInbound ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {isInbound ? (
                        <TrendingUp className="text-green-600" size={24} />
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
                          <p className={`font-bold text-lg ${isInbound ? 'text-green-600' : 'text-red-600'}`}>
                            {isInbound ? '+' : '-'}{movement.quantity} {movement.unit}
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
            )})
          ) : (
            <div className="p-12 text-center">
              <p className="text-gray-500">No transactions found</p>
            </div>
          )}
        </div>

        {/* Pagination */}
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
