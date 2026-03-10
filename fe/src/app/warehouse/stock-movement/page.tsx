'use client'

import { useState, useMemo, useEffect } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Filter,
  Plus,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  X,
  FileText,
  Upload,
  Download,
  ChevronLeft
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
    quantity: 50, 
    unit: 'bottles', 
    date: '2026-02-28', 
    time: '14:20',
    transferTo: 'Store Branch 01',
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
    quantity: 30, 
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
    quantity: 15, 
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
  PURCHASE: { label: 'Mua hàng', color: 'blue', icon: <TrendingUp size={16} /> },
  TRANSFER_IN: { label: 'Chuyển đến', color: 'green', icon: <TrendingUp size={16} /> },
  TRANSFER_OUT: { label: 'Chuyển đi', color: 'orange', icon: <TrendingDown size={16} /> },
  DAMAGE: { label: 'Hư hỏng', color: 'red', icon: <XCircle size={16} /> },
  EXPIRED: { label: 'Hết hạn', color: 'purple', icon: <Clock size={16} /> },
  ADJUSTMENT: { label: 'Điều chỉnh', color: 'gray', icon: <FileText size={16} /> },
  RETURN_SUPPLIER: { label: 'Trả NCC', color: 'yellow', icon: <TrendingDown size={16} /> },
  SALE_DEDUCTION: { label: 'Bán hàng', color: 'cyan', icon: <TrendingDown size={16} /> },
  PRODUCTION: { label: 'Sản xuất', color: 'teal', icon: <TrendingUp size={16} /> },
  SAMPLE: { label: 'Mẫu', color: 'pink', icon: <TrendingDown size={16} /> },
}

const statusConfig: Record<MovementStatus, { label: string; color: string; bgColor: string }> = {
  CREATED: { label: 'Bản nháp', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  PENDING_APPROVAL: { label: 'Chờ duyệt', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  APPROVED: { label: 'Đã duyệt', color: 'text-green-700', bgColor: 'bg-green-100' },
  REJECTED: { label: 'Từ chối', color: 'text-red-700', bgColor: 'bg-red-100' },
  COMPLETED: { label: 'Hoàn thành', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  CANCELLED: { label: 'Đã hủy', color: 'text-gray-700', bgColor: 'bg-gray-200' },
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nhập / Xuất kho</h1>
          <p className="text-gray-600 mt-1">Ghi nhận và theo dõi chuyển động tồn kho</p>
        </div>
        <div className="flex gap-3">
          <Button 
            className="bg-[#2d6e3e] hover:bg-[#255931] flex items-center gap-2"
            onClick={() => {
              setMovementType('in')
              setShowForm(true)
            }}
          >
            <TrendingUp size={18} />
            Ghi nhận nhập kho
          </Button>
          <Button 
            className="bg-red-600 hover:bg-red-700 flex items-center gap-2"
            onClick={() => {
              setMovementType('out')
              setShowForm(true)
            }}
          >
            <TrendingDown size={18} />
            Ghi nhận xuất kho
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border-l-4 border-green-600 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Tổng nhập kho</p>
              <p className="text-3xl font-bold text-green-600">{totalInTransactions}</p>
              <p className="text-xs text-gray-500 mt-1">giao dịch</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border-l-4 border-red-600 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Tổng xuất kho</p>
              <p className="text-3xl font-bold text-red-600">{totalOutTransactions}</p>
              <p className="text-xs text-gray-500 mt-1">giao dịch</p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
              <TrendingDown className="text-red-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-300 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              Ghi nhận {movementType === 'in' ? 'nhập' : 'xuất'} kho
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
              <label className="block text-sm font-medium text-gray-700 mb-2">SKU sản phẩm</label>
              <Input placeholder="Nhập SKU..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Số lượng</label>
              <Input type="number" placeholder="Nhập số lượng..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Lý do</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d6e3e]">
                {movementType === 'in' ? (
                  <>
                    <option>Giao hàng từ NCC</option>
                    <option>Đơn mua hàng</option>
                    <option>Trả hàng từ cửa hàng</option>
                    <option>Khác</option>
                  </>
                ) : (
                  <>
                    <option>Chuyển đến cửa hàng</option>
                    <option>Đơn hàng khách</option>
                    <option>Hàng hư hỏng</option>
                    <option>Hàng hết hạn</option>
                    <option>Khác</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tên nhân viên</label>
              <Input placeholder="Tên của bạn..." defaultValue="Nguyen Van A" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú</label>
              <textarea 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d6e3e]"
                rows={3}
                placeholder="Ghi chú bổ sung..."
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button 
              className={`flex-1 ${movementType === 'in' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              Ghi nhận {movementType === 'in' ? 'nhập' : 'xuất'} kho
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowForm(false)}
              className="flex-1"
            >
              Hủy
            </Button>
          </div>
        </div>
      )}

      {/* Search and Date Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search Box */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tìm sản phẩm / SKU</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nhập tên sản phẩm hoặc SKU..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Từ ngày</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={endDate || undefined}
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Đến ngày</label>
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
                Hiển thị <span className="font-bold text-[#2d6e3e]">{filteredMovements.length}</span> giao dịch
                {searchTerm && <span> khớp với "{searchTerm}"</span>}
                {startDate && <span> từ {startDate}</span>}
                {endDate && <span> đến {endDate}</span>}
              </>
            ) : (
              <>
                Hiển thị <span className="font-bold text-[#2d6e3e]">{filteredMovements.length}</span> giao dịch gần đây <span className="text-gray-500">(30 ngày qua)</span>
                <span className="ml-2 text-gray-500">• Sử dụng bộ lọc ngày để xem các giao dịch cũ hơn</span>
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
              Xóa bộ lọc
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
            Tất cả chuyển động
          </button>
          <button
            onClick={() => setActiveTab('in')}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              activeTab === 'in' 
                ? 'bg-green-600 text-white' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Nhập kho
          </button>
          <button
            onClick={() => setActiveTab('out')}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              activeTab === 'out' 
                ? 'bg-red-600 text-white' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Xuất kho
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
                          <p className="text-gray-500 mb-1">Số lượng</p>
                          <p className={`font-bold text-lg ${isInbound ? 'text-green-600' : 'text-red-600'}`}>
                            {movement.quantity} {movement.unit}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">Ngày & Giờ</p>
                          <p className="font-medium text-gray-900">{movement.date}</p>
                          <p className="text-gray-600 text-xs">{movement.time}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">Lý do</p>
                          <p className="font-medium text-gray-900">{movement.reason}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">Người ghi nhận</p>
                          <p className="font-medium text-gray-900">{movement.staff}</p>
                        </div>
                      </div>

                      {movement.notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium text-gray-700">Ghi chú:</span> {movement.notes}
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
              <p className="text-gray-500">Không tìm thấy giao dịch</p>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              {/* Pagination Info */}
              <div className="text-sm text-gray-600">
                Hiển thị <span className="font-medium text-gray-900">{startIndex + 1}</span> đến{' '}
                <span className="font-medium text-gray-900">{Math.min(endIndex, filteredMovements.length)}</span> trong{' '}
                <span className="font-medium text-gray-900">{filteredMovements.length}</span> giao dịch
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
