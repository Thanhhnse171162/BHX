'use client'

import { useState, useMemo } from 'react'
import { 
  ArrowDownUp, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Filter,
  Plus,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Upload,
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
    poNumber: 'PO-20260225-001',
    supplier: 'Vinamilk JSC',
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
    quantity: -50, 
    unit: 'bottles', 
    date: '2026-02-28', 
    time: '14:20',
    transferTo: 'Store Branch 01',
    totalValue: -250000,
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
    transferFrom: 'Central Warehouse',
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
    quantity: -30, 
    unit: 'kg', 
    date: '2026-02-27', 
    time: '16:45',
    reason: 'Physical damage during handling',
    totalValue: -900000,
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
    quantity: -15, 
    unit: 'liters', 
    date: '2026-02-27', 
    time: '08:00',
    batchNumber: 'BATCH-20260115',
    expiryDate: '2026-02-26',
    totalValue: -1350000,
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
    quantity: -5, 
    unit: 'liters', 
    date: '2026-02-26', 
    time: '15:30',
    reason: 'Cycle count variance',
    checkNumber: 'IC-20260226-001',
    totalValue: -175000,
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
    poNumber: 'PO-20260220-005',
    supplier: 'Thai Roosmalt Co.',
    totalValue: 4000000,
    createdBy: 'Pham Thi D',
    approvedBy: null,
    rejectionReason: 'Incorrect PO reference',
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
  const [statusFilter, setStatusFilter] = useState<MovementStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<MovementTypeCode | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const itemsPerPage = 10

  const filteredMovements = useMemo(() => {
    let filtered = mockStockMovements

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
  }, [statusFilter, typeFilter, searchTerm, startDate, endDate])

  // Summary stats
  const summaryStats = useMemo(() => {
    const pendingApprovals = mockStockMovements.filter(m => m.status === 'PENDING_APPROVAL').length
    const approvedToday = mockStockMovements.filter(m => m.status === 'APPROVED' && m.date === '2026-03-01').length
    const totalValueIn = mockStockMovements
      .filter(m => m.totalValue && m.totalValue > 0)
      .reduce((sum, m) => sum + (m.totalValue || 0), 0)

    return { pendingApprovals, approvedToday, totalValueIn }
  }, [])

  const clearFilters = () => {
    setStatusFilter('all')
    setTypeFilter('all')
    setSearchTerm('')
    setStartDate('')
    setEndDate('')
    setCurrentPage(1)
  }

  // Pagination
  const totalPages = Math.ceil(filteredMovements.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedMovements = filteredMovements.slice(startIndex, endIndex)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Movements</h1>
          <p className="text-gray-600 mt-1">Enterprise stock movement tracking with approval workflow</p>
        </div>
        <Button 
          className="bg-[#2d6e3e] hover:bg-[#2d6e3e]/90 flex items-center gap-2"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={18} />
          New Movement
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Movements</p>
              <p className="text-2xl font-bold text-gray-900">{mockStockMovements.length}</p>
            </div>
            <ArrowDownUp className="text-gray-400" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-yellow-200 p-5 bg-yellow-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-700 text-sm mb-1">Pending Approval</p>
              <p className="text-2xl font-bold text-yellow-700">{summaryStats.pendingApprovals}</p>
            </div>
            <Clock className="text-yellow-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-green-200 p-5 bg-green-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 text-sm mb-1">Approved Today</p>
              <p className="text-2xl font-bold text-green-700">{summaryStats.approvedToday}</p>
            </div>
            <CheckCircle className="text-green-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-5 bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 text-sm mb-1">Total Value In</p>
              <p className="text-2xl font-bold text-blue-700">
                {(summaryStats.totalValueIn / 1000000).toFixed(1)}M VND
              </p>
            </div>
            <TrendingUp className="text-blue-500" size={32} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Movement #, Product, SKU, PO..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as MovementStatus | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d6e3e]"
            >
              <option value="all">All Status</option>
              <option value="CREATED">Draft</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Movement Type</label>
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as MovementTypeCode | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d6e3e]"
            >
              <option value="all">All Types</option>
              <option value="PURCHASE">Purchase</option>
              <option value="TRANSFER_IN">Transfer In</option>
              <option value="TRANSFER_OUT">Transfer Out</option>
              <option value="DAMAGE">Damage</option>
              <option value="EXPIRED">Expired</option>
              <option value="ADJUSTMENT">Adjustment</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing <span className="font-bold text-[#2d6e3e]">{filteredMovements.length}</span> movement{filteredMovements.length !== 1 ? 's' : ''}
          </div>
          {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || startDate || endDate) && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <Filter size={16} />
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Movement List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm">Movement #</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm">Type</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm">Product</th>
                <th className="text-center py-4 px-4 font-semibold text-gray-700 text-sm">Quantity</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm">Status</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm">Date</th>
                <th className="text-right py-4 px-4 font-semibold text-gray-700 text-sm">Value</th>
                <th className="text-center py-4 px-4 font-semibold text-gray-700 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedMovements.map((movement) => {
                const typeInfo = movementTypeLabels[movement.type]
                const statusInfo = statusConfig[movement.status]

                return (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-mono text-sm font-medium text-gray-900">{movement.movementNumber}</p>
                        {movement.poNumber && (
                          <p className="text-xs text-gray-500">PO: {movement.poNumber}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-${typeInfo.color}-100 text-${typeInfo.color}-700`}>
                        {typeInfo.icon}
                        {typeInfo.label}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{movement.product}</p>
                        <p className="text-xs text-gray-500">{movement.sku}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`font-bold ${movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {movement.quantity > 0 ? '+' : ''}{movement.quantity} {movement.unit}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm">
                        <p className="text-gray-900 font-medium">{movement.date}</p>
                        <p className="text-gray-500">{movement.time}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className={`font-mono text-sm font-semibold ${
                        movement.totalValue && movement.totalValue > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {movement.totalValue && movement.totalValue > 0 ? '+' : ''}
                        {movement.totalValue?.toLocaleString('vi-VN')} ₫
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button size="sm" variant="outline" className="p-2">
                          <Eye size={16} />
                        </Button>
                        {movement.hasAttachment && (
                          <span className="text-gray-400" title="Has attachments">
                            <Upload size={16} />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredMovements.length)} of {filteredMovements.length} movements
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {filteredMovements.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <FileText className="mx-auto text-gray-300 mb-4" size={64} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No movements found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your filters or create a new stock movement</p>
          <Button onClick={() => setShowCreateModal(true)}>
            Create Movement
          </Button>
        </div>
      )}

      {/* Create Modal Placeholder */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Create Stock Movement</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700">
                <XCircle size={24} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600">Full create form will be implemented here with:</p>
              <ul className="list-disc list-inside mt-4 space-y-2 text-gray-600">
                <li>Movement type selection</li>
                <li>Product selection with batch support</li>
                <li>Quantity and cost input</li>
                <li>Reference document upload</li>
                <li>Submit for approval workflow</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
