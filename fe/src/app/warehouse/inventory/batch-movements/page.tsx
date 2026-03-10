'use client'

import { useState, useMemo } from 'react'
import { Search, ArrowUpDown, TrendingUp, TrendingDown, FileText } from 'lucide-react'
import { Input } from '@/shared/ui/Input'
import { Button } from '@/shared/ui/Button'

// Movement types
type MovementType = 'IMPORT' | 'TRANSFER_TO_SHELF' | 'ADJUST' | 'DAMAGE' | 'EXPIRED' | 'RETURN'

interface BatchMovement {
  id: string
  batch_id: string
  batch_code: string
  product_name: string
  product_sku: string
  warehouse_name: string
  warehouse_location: string
  slot_code: string
  type: MovementType
  quantity: number
  manufacture_date: string
  expiration_date: string
  reference_type: string
  reference_id: string
  created_at: string
  created_by?: string
}

// Mock batch movements data
const batchMovements: BatchMovement[] = [
  {
    id: '5f8d0e1a-4c3b-4e2f-8a1d-6e9f5a4b3c2d',
    batch_id: 'BATCH-001',
    batch_code: 'BATCH-PRODUCT1-20250110',
    product_name: 'Cải Thảo',
    product_sku: 'SKU-001',
    warehouse_name: 'Kho Tổng',
    warehouse_location: 'Tầng 1',
    slot_code: 'A-01-001',
    type: 'IMPORT',
    quantity: 500,
    manufacture_date: '2025-01-10',
    expiration_date: '2025-02-10',
    reference_type: 'PURCHASE_ORDER',
    reference_id: 'PO-20250110-001',
    created_at: '2026-03-01 08:30:00',
    created_by: 'Nguyen Van A'
  },
  {
    id: '7a2b3c4d-5e6f-4a1b-9c8d-2e3f4a5b6c7d',
    batch_id: 'BATCH-001',
    batch_code: 'BATCH-PRODUCT1-20250110',
    product_name: 'Cải Thảo',
    product_sku: 'SKU-001',
    warehouse_name: 'Kho Tổng',
    warehouse_location: 'Tầng 1',
    slot_code: 'A-01-001',
    type: 'TRANSFER_TO_SHELF',
    quantity: -150,
    manufacture_date: '2025-01-10',
    expiration_date: '2025-02-10',
    reference_type: 'TRANSFER',
    reference_id: 'TRF-20260301-001',
    created_at: '2026-03-01 10:15:00',
    created_by: 'Tran Thi B'
  },
  {
    id: '8b3c4d5e-6f7a-4b2c-9d8e-3f4a5b6c7d8e',
    batch_id: 'BATCH-002',
    batch_code: 'BATCH-PRODUCT2-20250310',
    product_name: 'Cải Xanh',
    product_sku: 'SKU-002',
    warehouse_name: 'Kho Tổng',
    warehouse_location: 'Tầng 1',
    slot_code: 'A-01-002',
    type: 'IMPORT',
    quantity: 600,
    manufacture_date: '2025-03-10',
    expiration_date: '2025-04-10',
    reference_type: 'PURCHASE_ORDER',
    reference_id: 'PO-20250310-002',
    created_at: '2026-03-01 14:20:00',
    created_by: 'Le Van C'
  },
  {
    id: '9c4d5e6f-7a8b-4c3d-9e8f-4a5b6c7d8e9f',
    batch_id: 'BATCH-003',
    batch_code: 'BATCH-PRODUCT8-20250320',
    product_name: 'Sữa TH True Milk',
    product_sku: 'SKU-008',
    warehouse_name: 'Kho Tổng',
    warehouse_location: 'Tầng 2',
    slot_code: 'B-02-008',
    type: 'DAMAGE',
    quantity: -20,
    manufacture_date: '2025-03-20',
    expiration_date: '2025-09-20',
    reference_type: 'DAMAGE_REPORT',
    reference_id: 'DMG-20260301-001',
    created_at: '2026-03-01 16:45:00',
    created_by: 'Pham Thi D'
  },
  {
    id: 'ad5e6f7a-8b9c-4d3e-9f8a-5b6c7d8e9f0a',
    batch_id: 'BATCH-004',
    batch_code: 'BATCH-PRODUCT9-20250118',
    product_name: 'Bánh mì sandwich',
    product_sku: 'SKU-009',
    warehouse_name: 'Kho Tổng',
    warehouse_location: 'Tầng 1',
    slot_code: 'A-01-009',
    type: 'EXPIRED',
    quantity: -50,
    manufacture_date: '2025-01-18',
    expiration_date: '2025-01-25',
    reference_type: 'EXPIRY_CHECK',
    reference_id: 'EXP-20260228-001',
    created_at: '2026-02-28 09:00:00',
    created_by: 'Hoang Van E'
  },
  {
    id: 'be6f7a8b-9c0d-4e3f-9a8b-6c7d8e9f0a1b',
    batch_id: 'BATCH-002',
    batch_code: 'BATCH-PRODUCT2-20250310',
    product_name: 'Cải Xanh',
    product_sku: 'SKU-002',
    warehouse_name: 'Kho Tổng',
    warehouse_location: 'Tầng 1',
    slot_code: 'A-01-002',
    type: 'ADJUST',
    quantity: -5,
    manufacture_date: '2025-03-10',
    expiration_date: '2025-04-10',
    reference_type: 'INVENTORY_CHECK',
    reference_id: 'IC-20260301-005',
    created_at: '2026-03-01 11:30:00',
    created_by: 'Nguyen Van A'
  },
  {
    id: 'cf7a8b9c-0d1e-4f3a-9b8c-7d8e9f0a1b2c',
    batch_id: 'BATCH-005',
    batch_code: 'BATCH-PRODUCT5-20250220',
    product_name: 'Coca Cola 330ml',
    product_sku: 'SKU-005',
    warehouse_name: 'Kho Tổng',
    warehouse_location: 'Tầng 2',
    slot_code: 'B-02-005',
    type: 'RETURN',
    quantity: 30,
    manufacture_date: '2025-02-20',
    expiration_date: '2025-08-20',
    reference_type: 'CUSTOMER_RETURN',
    reference_id: 'RET-20260301-003',
    created_at: '2026-03-01 15:20:00',
    created_by: 'Tran Thi B'
  },
  {
    id: 'd08b9c0d-1e2f-4a3b-9c8d-8e9f0a1b2c3d',
    batch_id: 'BATCH-001',
    batch_code: 'BATCH-PRODUCT1-20250110',
    product_name: 'Cải Thảo',
    product_sku: 'SKU-001',
    warehouse_name: 'Kho Tổng',
    warehouse_location: 'Tầng 1',
    slot_code: 'A-01-001',
    type: 'TRANSFER_TO_SHELF',
    quantity: -100,
    manufacture_date: '2025-01-10',
    expiration_date: '2025-02-10',
    reference_type: 'TRANSFER',
    reference_id: 'TRF-20260302-002',
    created_at: '2026-03-02 09:10:00',
    created_by: 'Le Van C'
  },
  {
    id: 'e19c0d1e-2f3a-4b3c-9d8e-9f0a1b2c3d4e',
    batch_id: 'BATCH-006',
    batch_code: 'BATCH-PRODUCT7-20250301',
    product_name: 'Gạo Jasmine',
    product_sku: 'SKU-007',
    warehouse_name: 'Kho Tổng',
    warehouse_location: 'Tầng 2',
    slot_code: 'B-02-007',
    type: 'IMPORT',
    quantity: 1000,
    manufacture_date: '2025-03-01',
    expiration_date: '2026-03-01',
    reference_type: 'PURCHASE_ORDER',
    reference_id: 'PO-20250301-003',
    created_at: '2026-03-02 10:00:00',
    created_by: 'Pham Thi D'
  },
  {
    id: 'f2ad1e2f-3a4b-4c3d-9e8f-0a1b2c3d4e5f',
    batch_id: 'BATCH-003',
    batch_code: 'BATCH-PRODUCT8-20250320',
    product_name: 'Sữa TH True Milk',
    product_sku: 'SKU-008',
    warehouse_name: 'Kho Tổng',
    warehouse_location: 'Tầng 2',
    slot_code: 'B-02-008',
    type: 'TRANSFER_TO_SHELF',
    quantity: -80,
    manufacture_date: '2025-03-20',
    expiration_date: '2025-09-20',
    reference_type: 'TRANSFER',
    reference_id: 'TRF-20260302-003',
    created_at: '2026-03-02 11:30:00',
    created_by: 'Hoang Van E'
  },
  {
    id: 'a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
    batch_id: 'BATCH-007',
    batch_code: 'BATCH-PRODUCT3-20250205',
    product_name: 'Hành Tây',
    product_sku: 'SKU-003',
    warehouse_name: 'Kho Tổng',
    warehouse_location: 'Tầng 1',
    slot_code: 'A-01-003',
    type: 'IMPORT',
    quantity: 400,
    manufacture_date: '2025-02-05',
    expiration_date: '2025-03-05',
    reference_type: 'PURCHASE_ORDER',
    reference_id: 'PO-20250205-004',
    created_at: '2026-02-20 08:00:00',
    created_by: 'Nguyen Van A'
  },
  {
    id: 'b2c3d4e5-6f7a-4b8c-9d0e-1f2a3b4c5d6e',
    batch_id: 'BATCH-007',
    batch_code: 'BATCH-PRODUCT3-20250205',
    product_name: 'Hành Tây',
    product_sku: 'SKU-003',
    warehouse_name: 'Kho Tổng',
    warehouse_location: 'Tầng 1',
    slot_code: 'A-01-003',
    type: 'TRANSFER_TO_SHELF',
    quantity: -120,
    manufacture_date: '2025-02-05',
    expiration_date: '2025-03-05',
    reference_type: 'TRANSFER',
    reference_id: 'TRF-20260225-004',
    created_at: '2026-02-25 10:30:00',
    created_by: 'Tran Thi B'
  },
  {
    id: 'c3d4e5f6-7a8b-4c9d-0e1f-2a3b4c5d6e7f',
    batch_id: 'BATCH-008',
    batch_code: 'BATCH-PRODUCT6-20250215',
    product_name: 'Nước Suối Lavie',
    product_sku: 'SKU-006',
    warehouse_name: 'Kho Tổng',
    warehouse_location: 'Tầng 2',
    slot_code: 'B-02-006',
    type: 'IMPORT',
    quantity: 2000,
    manufacture_date: '2025-02-15',
    expiration_date: '2026-02-15',
    reference_type: 'PURCHASE_ORDER',
    reference_id: 'PO-20250215-005',
    created_at: '2026-02-22 09:00:00',
    created_by: 'Le Van C'
  },
  {
    id: 'd4e5f6a7-8b9c-4d0e-1f2a-3b4c5d6e7f8a',
    batch_id: 'BATCH-008',
    batch_code: 'BATCH-PRODUCT6-20250215',
    product_name: 'Nước Suối Lavie',
    product_sku: 'SKU-006',
    warehouse_name: 'Kho Tổng',
    warehouse_location: 'Tầng 2',
    slot_code: 'B-02-006',
    type: 'TRANSFER_TO_SHELF',
    quantity: -500,
    manufacture_date: '2025-02-15',
    expiration_date: '2026-02-15',
    reference_type: 'TRANSFER',
    reference_id: 'TRF-20260228-005',
    created_at: '2026-02-28 14:00:00',
    created_by: 'Pham Thi D'
  },
  {
    id: 'e5f6a7b8-9c0d-4e1f-2a3b-4c5d6e7f8a9b',
    batch_id: 'BATCH-009',
    batch_code: 'BATCH-PRODUCT10-20250125',
    product_name: 'Khoai Tây Đà Lạt',
    product_sku: 'SKU-010',
    warehouse_name: 'Kho Tổng',
    warehouse_location: 'Tầng 1',
    slot_code: 'A-01-010',
    type: 'IMPORT',
    quantity: 800,
    manufacture_date: '2025-01-25',
    expiration_date: '2025-03-25',
    reference_type: 'PURCHASE_ORDER',
    reference_id: 'PO-20250125-006',
    created_at: '2026-02-18 11:00:00',
    created_by: 'Hoang Van E'
  },
  {
    id: 'f6a7b8c9-0d1e-4f2a-3b4c-5d6e7f8a9b0c',
    batch_id: 'BATCH-009',
    batch_code: 'BATCH-PRODUCT10-20250125',
    product_name: 'Khoai Tây Đà Lạt',
    product_sku: 'SKU-010',
    warehouse_name: 'Kho Tổng',
    warehouse_location: 'Tầng 1',
    slot_code: 'A-01-010',
    type: 'DAMAGE',
    quantity: -15,
    manufacture_date: '2025-01-25',
    expiration_date: '2025-03-25',
    reference_type: 'DAMAGE_REPORT',
    reference_id: 'DMG-20260302-002',
    created_at: '2026-03-02 15:30:00',
    created_by: 'Nguyen Van A'
  },
  {
    id: 'a7b8c9d0-1e2f-4a3b-4c5d-6e7f8a9b0c1d',
    batch_id: 'BATCH-010',
    batch_code: 'BATCH-PRODUCT11-20250301',
    product_name: 'Bia Heineken',
    product_sku: 'SKU-011',
    warehouse_name: 'Kho Tổng',
    warehouse_location: 'Tầng 2',
    slot_code: 'B-02-011',
    type: 'IMPORT',
    quantity: 1200,
    manufacture_date: '2025-03-01',
    expiration_date: '2025-09-01',
    reference_type: 'PURCHASE_ORDER',
    reference_id: 'PO-20250301-007',
    created_at: '2026-03-02 08:00:00',
    created_by: 'Tran Thi B'
  },
  {
    id: 'b8c9d0e1-2f3a-4b4c-5d6e-7f8a9b0c1d2e',
    batch_id: 'BATCH-002',
    batch_code: 'BATCH-PRODUCT2-20250310',
    product_name: 'Cải Xanh',
    product_sku: 'SKU-002',
    warehouse_name: 'Kho Tổng',
    warehouse_location: 'Tầng 1',
    slot_code: 'A-01-002',
    type: 'TRANSFER_TO_SHELF',
    quantity: -200,
    manufacture_date: '2025-03-10',
    expiration_date: '2025-04-10',
    reference_type: 'TRANSFER',
    reference_id: 'TRF-20260302-004',
    created_at: '2026-03-02 13:00:00',
    created_by: 'Le Van C'
  },
  {
    id: 'c9d0e1f2-3a4b-4c5d-6e7f-8a9b0c1d2e3f',
    batch_id: 'BATCH-005',
    batch_code: 'BATCH-PRODUCT5-20250220',
    product_name: 'Coca Cola 330ml',
    product_sku: 'SKU-005',
    warehouse_name: 'Kho Tổng',
    warehouse_location: 'Tầng 2',
    slot_code: 'B-02-005',
    type: 'TRANSFER_TO_SHELF',
    quantity: -20,
    manufacture_date: '2025-02-20',
    expiration_date: '2025-08-20',
    reference_type: 'TRANSFER',
    reference_id: 'TRF-20260302-005',
    created_at: '2026-03-02 16:00:00',
    created_by: 'Pham Thi D'
  },
  {
    id: 'd0e1f2a3-4b5c-4d6e-7f8a-9b0c1d2e3f4a',
    batch_id: 'BATCH-006',
    batch_code: 'BATCH-PRODUCT7-20250301',
    product_name: 'Gạo Jasmine',
    product_sku: 'SKU-007',
    warehouse_name: 'Kho Tổng',
    warehouse_location: 'Tầng 2',
    slot_code: 'B-02-007',
    type: 'TRANSFER_TO_SHELF',
    quantity: -300,
    manufacture_date: '2025-03-01',
    expiration_date: '2026-03-01',
    reference_type: 'TRANSFER',
    reference_id: 'TRF-20260302-006',
    created_at: '2026-03-02 17:00:00',
    created_by: 'Hoang Van E'
  },
]

// Movement type configuration
const movementTypeConfig: Record<MovementType, { label: string; color: string; bgColor: string; icon: JSX.Element }> = {
  IMPORT: {
    label: 'Nhập kho',
    color: 'text-green-700',
    bgColor: 'bg-green-100 border-green-200',
    icon: <TrendingUp size={14} />
  },
  TRANSFER_TO_SHELF: {
    label: 'Chuyển lên kệ',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100 border-blue-200',
    icon: <ArrowUpDown size={14} />
  },
  ADJUST: {
    label: 'Điều chỉnh',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100 border-purple-200',
    icon: <FileText size={14} />
  },
  DAMAGE: {
    label: 'Hư hỏng',
    color: 'text-red-700',
    bgColor: 'bg-red-100 border-red-200',
    icon: <TrendingDown size={14} />
  },
  EXPIRED: {
    label: 'Hết hạn',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100 border-orange-200',
    icon: <TrendingDown size={14} />
  },
  RETURN: {
    label: 'Trả lại',
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-100 border-cyan-200',
    icon: <TrendingUp size={14} />
  },
}

export default function BatchMovementsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<MovementType | 'all'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<'created_at' | 'quantity'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const itemsPerPage = 10

  // Calculate summary stats
  const stats = useMemo(() => {
    const totalIn = batchMovements
      .filter(m => ['IMPORT', 'RETURN'].includes(m.type))
      .reduce((sum, m) => sum + Math.abs(m.quantity), 0)
    
    const totalOut = batchMovements
      .filter(m => ['TRANSFER_TO_SHELF', 'DAMAGE', 'EXPIRED', 'ADJUST'].includes(m.type))
      .reduce((sum, m) => sum + Math.abs(m.quantity), 0)
    
    const netMovement = totalIn - totalOut
    
    return {
      totalIn,
      totalOut,
      netMovement,
      totalTransactions: batchMovements.length
    }
  }, [])

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = batchMovements.filter(item => {
      const matchesSearch = 
        item.batch_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product_sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.warehouse_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.warehouse_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.slot_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.reference_id.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesType = typeFilter === 'all' || item.type === typeFilter
      
      return matchesSearch && matchesType
    })

    // Sort
    filtered.sort((a, b) => {
      const aValue = sortField === 'created_at' ? new Date(a.created_at).getTime() : a.quantity
      const bValue = sortField === 'created_at' ? new Date(b.created_at).getTime() : b.quantity
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [searchTerm, typeFilter, sortField, sortOrder])

  // Paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredAndSortedData.slice(startIndex, endIndex)
  }, [filteredAndSortedData, currentPage])

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage)

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1)
  }, [searchTerm, typeFilter])

  const handleSort = (field: 'created_at' | 'quantity') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tồn kho theo lô</h1>
        <p className="text-gray-600 mt-1">Theo dõi tất cả di chuyển hàng tồn kho cấp lô và giao dịch</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Tổng nhập kho</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.totalIn}</p>
              <p className="text-xs text-gray-500 mt-1">giao dịch</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Tổng xuất kho</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.totalOut}</p>
              <p className="text-xs text-gray-500 mt-1">giao dịch</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="text-red-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Tìm theo mã lô, sản phẩm, SKU, kho, kệ, hoặc tham chiếu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div className="sm:w-48">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as MovementType | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d6e3e]"
            >
              <option value="all">Tất cả loại</option>
              <option value="IMPORT">Nhập kho</option>
              <option value="TRANSFER_TO_SHELF">Chuyển lên kệ</option>
              <option value="ADJUST">Điều chỉnh</option>
              <option value="DAMAGE">Hư hỏng</option>
              <option value="EXPIRED">Hết hạn</option>
              <option value="RETURN">Trả lại</option>
            </select>
          </div>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Mã lô
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Sản phẩm
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Kho
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Mã kệ
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Loại
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('quantity')}
                >
                  <div className="flex items-center gap-1">
                    Số lượng
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Ngày SX
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Ngày HSD
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Tham chiếu
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center gap-1">
                    Tạo lúc
                    <ArrowUpDown size={14} />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                    Không tìm thấy di chuyển
                  </td>
                </tr>
              ) : (
                paginatedData.map((movement) => {
                  const config = movementTypeConfig[movement.type]
                  return (
                    <tr key={movement.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                        {movement.id.substring(0, 8)}...
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{movement.batch_code}</div>
                        <div className="text-xs text-gray-500">ID: {movement.batch_id}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{movement.product_name}</div>
                        <div className="text-xs text-gray-500">{movement.product_sku}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">{movement.warehouse_name}</div>
                        <div className="text-xs text-gray-500">{movement.warehouse_location}</div>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-900">
                        {movement.slot_code}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bgColor} ${config.color}`}>
                          {config.icon}
                          {config.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-semibold ${
                          movement.quantity > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {Math.abs(movement.quantity)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(movement.manufacture_date).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(movement.expiration_date).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-gray-600">{movement.reference_type}</div>
                        <div className="text-xs text-gray-900 font-mono">{movement.reference_id}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">
                          {new Date(movement.created_at).toLocaleDateString('vi-VN')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(movement.created_at).toLocaleTimeString('vi-VN')}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Hiển thị <span className="font-medium">{filteredAndSortedData.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> đến{' '}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, filteredAndSortedData.length)}
              </span>{' '}
              trong <span className="font-medium">{filteredAndSortedData.length}</span> kết quả
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Trước
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={currentPage === page ? "bg-[#2d6e3e] text-white" : ""}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Tiếp
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
