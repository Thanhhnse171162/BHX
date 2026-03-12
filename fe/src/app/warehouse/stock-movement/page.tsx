'use client'

import { useState, useMemo, useEffect } from 'react'
import { 
  ArrowDownUp, 
  TrendingUp, 
  TrendingDown, 
  Search,
  CheckCircle,
  Clock,
  XCircle,
  X,
  FileText,
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
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

const movementTypeConfig: Record<MovementTypeCode, { label: string; badgeCls: string }> = {
  PURCHASE:       { label: 'Purchase',          badgeCls: 'bg-blue-100 text-blue-700' },
  TRANSFER_IN:    { label: 'Transfer In',        badgeCls: 'bg-green-100 text-green-700' },
  TRANSFER_OUT:   { label: 'Transfer Out',       badgeCls: 'bg-orange-100 text-orange-700' },
  DAMAGE:         { label: 'Damage',             badgeCls: 'bg-red-100 text-red-700' },
  EXPIRED:        { label: 'Expired',            badgeCls: 'bg-purple-100 text-purple-700' },
  ADJUSTMENT:     { label: 'Adjustment',         badgeCls: 'bg-gray-100 text-gray-700' },
  RETURN_SUPPLIER:{ label: 'Return to Supplier', badgeCls: 'bg-yellow-100 text-yellow-700' },
  SALE_DEDUCTION: { label: 'Sale',               badgeCls: 'bg-cyan-100 text-cyan-700' },
  PRODUCTION:     { label: 'Production',         badgeCls: 'bg-teal-100 text-teal-700' },
  SAMPLE:         { label: 'Sample',             badgeCls: 'bg-pink-100 text-pink-700' },
}

const statusConfig: Record<MovementStatus, { label: string; cls: string }> = {
  CREATED:          { label: 'Draft',            cls: 'bg-gray-100 text-gray-600' },
  PENDING_APPROVAL: { label: 'Pending',          cls: 'bg-yellow-100 text-yellow-700' },
  APPROVED:         { label: 'Approved',         cls: 'bg-green-100 text-green-700' },
  REJECTED:         { label: 'Rejected',         cls: 'bg-red-100 text-red-700' },
  COMPLETED:        { label: 'Completed',        cls: 'bg-blue-100 text-blue-700' },
  CANCELLED:        { label: 'Cancelled',        cls: 'bg-gray-200 text-gray-500' },
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
          <h1 className="text-xl font-bold text-gray-900">Stock Movement</h1>
          <p className="text-sm text-gray-500 mt-0.5">Record and track inventory movements</p>
        </div>
        <div className="flex gap-2">
          <Button
            className="bg-[#2d6e3e] hover:bg-[#255931] flex items-center gap-1.5 text-sm h-9 px-4"
            onClick={() => { setMovementType('in'); setShowForm(true) }}
          >
            <TrendingUp size={15} /> Record Stock In
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700 flex items-center gap-1.5 text-sm h-9 px-4"
            onClick={() => { setMovementType('out'); setShowForm(true) }}
          >
            <TrendingDown size={15} /> Record Stock Out
          </Button>
        </div>
      </div>

      {/* ── Low Stock Alert ── */}
      <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <AlertTriangle size={17} className="text-amber-500 flex-shrink-0" />
        <p className="text-sm text-amber-800 font-medium">
          <span className="font-bold">3 products</span> are running low on stock and may need replenishment soon.
        </p>
        <a href="/warehouse/low-stock" className="ml-auto text-xs font-semibold text-amber-700 hover:underline whitespace-nowrap">
          View Low Stock →
        </a>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 border-l-4 border-l-green-500 px-5 py-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Stock In</p>
            <p className="text-2xl font-bold text-green-600 mt-1">+{totalInTransactions}</p>
            <p className="text-xs text-gray-400 mt-0.5">transactions</p>
          </div>
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
            <TrendingUp className="text-green-500" size={20} />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 border-l-4 border-l-red-500 px-5 py-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Stock Out</p>
            <p className="text-2xl font-bold text-red-600 mt-1">-{totalOutTransactions}</p>
            <p className="text-xs text-gray-400 mt-0.5">transactions</p>
          </div>
          <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
            <TrendingDown className="text-red-500" size={20} />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 border-l-4 border-l-blue-500 px-5 py-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Net Movement</p>
            <p className={`text-2xl font-bold mt-1 ${totalInTransactions - totalOutTransactions >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalInTransactions - totalOutTransactions >= 0 ? '+' : ''}{totalInTransactions - totalOutTransactions}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">transactions</p>
          </div>
          <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
            <ArrowDownUp className="text-gray-500" size={20} />
          </div>
        </div>
      </div>

      {/* ── Record Form ── */}
      {showForm && (
        <div className="bg-white rounded-xl border-2 border-gray-200 shadow-md p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">
              Record Stock {movementType === 'in' ? 'In' : 'Out'}
            </h3>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Product SKU</label>
              <Input placeholder="Enter SKU..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Quantity</label>
              <Input type="number" placeholder="Enter quantity..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Movement Type</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6e3e]">
                {movementType === 'in' ? (
                  <>
                    <option>Purchase (Supplier Delivery)</option>
                    <option>Transfer In</option>
                    <option>Return from Store</option>
                  </>
                ) : (
                  <>
                    <option>Transfer Out (to Store)</option>
                    <option>Damage</option>
                    <option>Expired</option>
                    <option>Adjustment</option>
                    <option>Return to Supplier</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Recorded By</label>
              <Input placeholder="Staff name..." />
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason / Notes</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6e3e]"
                rows={2}
                placeholder="Additional notes..."
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Button className={`flex-1 text-sm h-9 ${movementType === 'in' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
              Record {movementType === 'in' ? 'Stock In' : 'Stock Out'}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1 text-sm h-9">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Product name or SKU..."
                className="pl-9 text-sm h-9"
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
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">From Date</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} max={endDate || undefined} className="h-9 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">To Date</label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate || undefined} className="h-9 text-sm" />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Showing <span className="font-semibold text-gray-800">{filteredMovements.length}</span> transaction{filteredMovements.length !== 1 ? 's' : ''}
            {!searchTerm && !startDate && !endDate && <span className="text-gray-400"> (last 30 days)</span>}
          </p>
          {(searchTerm || startDate || endDate || typeFilter !== 'all') && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium">
              <X size={13} /> Clear filters
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {(['all', 'in', 'out'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                activeTab === tab
                  ? tab === 'out' ? 'bg-red-600 text-white' : tab === 'in' ? 'bg-green-600 text-white' : 'bg-[#2d6e3e] text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab === 'all' ? 'All Movements' : tab === 'in' ? '↑ Stock In' : '↓ Stock Out'}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 divide-x divide-gray-200">
                <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Movement ID</th>
                <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">SKU</th>
                <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Qty</th>
                <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Type</th>
                <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Source → Destination</th>
                <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Supplier</th>
                <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Date & Time</th>
                <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Reason</th>
                <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Recorded By</th>
                <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedMovements.length > 0 ? paginatedMovements.map((m, idx) => {
                const isInbound = inboundTypes.includes(m.type)
                const typeCfg = movementTypeConfig[m.type]
                const statusCfg = statusConfig[m.status]
                return (
                  <tr
                    key={m.id}
                    className={`hover:bg-blue-50/30 transition-colors divide-x divide-gray-100 border-b border-gray-100 ${idx % 2 === 1 ? 'bg-gray-50/40' : 'bg-white'}`}
                  >
                    {/* Movement ID */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono text-[11px] text-gray-500">{m.movementNumber}</span>
                    </td>

                    {/* Product */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${isInbound ? 'bg-green-100' : 'bg-red-100'}`}>
                          {isInbound
                            ? <TrendingUp size={12} className="text-green-600" />
                            : <TrendingDown size={12} className="text-red-600" />
                          }
                        </div>
                        <span className="font-medium text-gray-900 whitespace-nowrap">{m.product}</span>
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{m.sku}</span>
                    </td>

                    {/* Quantity */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`font-bold ${isInbound ? 'text-green-600' : 'text-red-600'}`}>
                        {isInbound ? '+' : '-'}{Math.abs(m.quantity)} {m.unit}
                      </span>
                    </td>

                    {/* Type Badge */}
                    <td className="py-3 px-4">
                      <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${typeCfg.badgeCls}`}>
                        {typeCfg.label}
                      </span>
                    </td>

                    {/* Source → Destination */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-xs text-gray-700 whitespace-nowrap">
                        <span className="bg-gray-100 px-1.5 py-0.5 rounded font-medium">{m.source}</span>
                        <ArrowRight size={11} className="text-gray-400 flex-shrink-0" />
                        <span className="bg-gray-100 px-1.5 py-0.5 rounded font-medium">{m.destination}</span>
                      </div>
                    </td>

                    {/* Supplier */}
                    <td className="py-3 px-4 text-xs text-gray-600 whitespace-nowrap">
                      {m.type === 'PURCHASE'
                        ? (m.supplier ?? <span className="text-gray-300">—</span>)
                        : <span className="text-gray-400 italic">Internal</span>}
                    </td>

                    {/* Date & Time */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <p className="text-xs font-medium text-gray-900">{m.date}</p>
                      <p className="text-[11px] text-gray-400">{m.time}</p>
                    </td>

                    {/* Reason */}
                    <td className="py-3 px-4 max-w-[180px]">
                      <p className="text-xs text-gray-600 truncate" title={m.reason ?? ''}>{m.reason ?? <span className="text-gray-300">—</span>}</p>
                    </td>

                    {/* Recorded By */}
                    <td className="py-3 px-4 whitespace-nowrap text-xs text-gray-700">
                      {m.createdBy}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${statusCfg.cls}`}>
                        {statusCfg.label}
                      </span>
                    </td>
                  </tr>
                )
              }) : (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-sm text-gray-400">No transactions found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3.5 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Showing <span className="font-semibold text-gray-800">{startIndex + 1}–{Math.min(endIndex, filteredMovements.length)}</span> of <span className="font-semibold text-gray-800">{filteredMovements.length}</span>
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page ? 'bg-[#2d6e3e] text-white' : 'text-gray-700 border border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  )
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} className="text-gray-400 text-xs">…</span>
                }
                return null
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
