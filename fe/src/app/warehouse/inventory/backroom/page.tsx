'use client'

import { useState, useMemo } from 'react'
import { Search, Package, ArrowRight, Edit, Warehouse, ChevronLeft, ChevronRight } from 'lucide-react'
import { Input } from '@/shared/ui/Input'
import { Button } from '@/shared/ui/Button'

// Batch-level inventory interface matching database structure
interface BatchInventoryItem {
  id: string
  batch_code: string
  product_name: string
  product_sku: string
  warehouse_name: string
  warehouse_location: string
  slot_code: string
  quantity: number
  manufacture_date: string
  expiration_date: string
  created_at: string
}

// Mock batch-level data from database (in production, this would come from API)
const batchInventory: BatchInventoryItem[] = [
  { id: '0014D6EF-226C-4284-BA59-132DA01793EC', batch_code: 'BATCH-PRODUCT1-20250110', product_name: 'Cải Thảo', product_sku: 'RAU-002', warehouse_name: 'Central Warehouse', warehouse_location: 'District 1, HCMC', slot_code: 'A-01-02', quantity: 350, manufacture_date: '2025-01-15', expiration_date: '2027-01-15', created_at: '2025-07-02 03:22:39.9266667' },
  { id: '8AB8F86E-D5D8-40FD-BDB0-1F56C0E19000', batch_code: 'BATCH-PRODUCT2-20250310', product_name: 'Cải Xanh', product_sku: 'RAU-001', warehouse_name: 'Central Warehouse', warehouse_location: 'District 1, HCMC', slot_code: 'A-03-01', quantity: 500, manufacture_date: '2025-03-10', expiration_date: '2026-10-10', created_at: '2026-01-02 03:22:39.9300000' },
  { id: 'E060DEB4-CF16-4CB5-A137-CAAF261F3D3A', batch_code: 'BATCH-PRODUCT3-20250315', product_name: 'Rau Muống', product_sku: 'RAU-001', warehouse_name: 'North Warehouse', warehouse_location: 'Cau Giay, Hanoi', slot_code: 'B-02-02', quantity: 200, manufacture_date: '2025-03-15', expiration_date: '2027-03-15', created_at: '2026-02-02 03:22:39.9300000' },
  { id: '3C6F1A5C-1E63-4E61-9B76-6DB81C1BFCW00', batch_code: 'BATCH-PRODUCT8-20250320', product_name: 'Sữa TH True Milk', product_sku: 'SUA-002', warehouse_name: 'Coastal Warehouse', warehouse_location: 'Hai Phong City', slot_code: 'C-01-01', quantity: 450, manufacture_date: '2025-03-20', expiration_date: '2026-09-20', created_at: '2026-03-02 03:22:39.9300000' },
  { id: 'EBD4C5E-7697-4CA5-BD97-E98CFC9063A8', batch_code: 'BATCH-PRODUCT2-20250215', product_name: 'Cam Sành', product_sku: 'TC-001', warehouse_name: 'North Warehouse', warehouse_location: 'Cau Giay, Hanoi', slot_code: 'B-01-01', quantity: 280, manufacture_date: '2025-02-15', expiration_date: '2027-02-15', created_at: '2025-10-02 03:22:39.9266667' },
  { id: '2BB52011-EA29-4C8C-BDC1-F086E5A1010E', batch_code: 'BATCH-PRODUCT7-20250301', product_name: 'Gạo Jasmine', product_sku: 'GAO-002', warehouse_name: 'Central Warehouse', warehouse_location: 'District 1, HCMC', slot_code: 'A-02-01', quantity: 800, manufacture_date: '2025-03-01', expiration_date: '2026-03-01', created_at: '2025-12-02 03:22:39.9300000' },
  { id: '16D39B8A-E196-44B7-8CF5-81FD838024TD', batch_code: 'BATCH-PRODUCT1-20250110-S2', product_name: 'Cải Thảo', product_sku: 'RAU-002', warehouse_name: 'North Warehouse', warehouse_location: 'Cau Giay, Hanoi', slot_code: 'B-03-01', quantity: 220, manufacture_date: '2025-01-10', expiration_date: '2027-01-10', created_at: '2026-01-15 03:22:39.9266667' },
  { id: 'B223E599-FD5E-464F-91FB-CEC87B521B39', batch_code: 'BATCH-PRODUCT5-20250220', product_name: 'Coca Cola 330ml', product_sku: 'BEV-001', warehouse_name: 'Central Warehouse', warehouse_location: 'District 1, HCMC', slot_code: 'A-05-02', quantity: 600, manufacture_date: '2025-02-20', expiration_date: '2026-08-20', created_at: '2025-11-20 03:22:39.9300000' },
  { id: '1B98D37-FB4A-4E5C-9A7B-2A9C79CD5A90', batch_code: 'BATCH-PRODUCT6-20250225', product_name: 'Pepsi 330ml', product_sku: 'BEV-002', warehouse_name: 'Coastal Warehouse', warehouse_location: 'Hai Phong City', slot_code: 'C-02-01', quantity: 550, manufacture_date: '2025-02-25', expiration_date: '2026-08-25', created_at: '2025-11-25 03:22:39.9300000' },
  { id: '6DAB994E-9FEB-456D-8153-DCE111A025C5', batch_code: 'BATCH-PRODUCT4-20250305', product_name: 'Trứng gà', product_sku: 'EGG-001', warehouse_name: 'Central Warehouse', warehouse_location: 'District 1, HCMC', slot_code: 'A-04-01', quantity: 360, manufacture_date: '2025-03-05', expiration_date: '2026-04-05', created_at: '2025-09-15 03:22:39.9300000' },
  { id: '0AA913D3-E41A-4B54-81AE-F2B74D7D13F7', batch_code: 'BATCH-PRODUCT9-20250118', product_name: 'Bánh mì sandwich', product_sku: 'BRD-003', warehouse_name: 'North Warehouse', warehouse_location: 'Cau Giay, Hanoi', slot_code: 'B-04-02', quantity: 180, manufacture_date: '2025-01-18', expiration_date: '2026-02-18', created_at: '2025-08-05 03:22:39.9300000' },
]

export default function BackroomStockPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Filter data
  const filteredData = useMemo(() => {
    return batchInventory.filter(item => {
      const matchesSearch = 
        item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product_sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.batch_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.warehouse_name.toLowerCase().includes(searchTerm.toLowerCase())
      
      return matchesSearch
    })
  }, [searchTerm])

  // Paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredData.slice(startIndex, endIndex)
  }, [filteredData, currentPage])

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)

  // Reset to page 1 when search changes
  useMemo(() => {
    setCurrentPage(1)
  }, [searchTerm])

  // Handle transfer to shelf
  const handleTransferToShelf = (batchCode: string) => {
    console.log('Transfer to shelf:', batchCode)
    alert(`Transfer batch ${batchCode} to shelf - API integration needed`)
  }

  // Handle stock adjustment
  const handleAdjustStock = (batchCode: string) => {
    console.log('Adjust stock:', batchCode)
    alert(`Adjust stock for batch ${batchCode} - Modal integration needed`)
  }
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  // Check if expiry is near (within 30 days)
  const isExpiryNear = (expiryDate: string) => {
    const expDate = new Date(expiryDate)
    const today = new Date()
    const days = Math.floor((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return days <= 30 && days >= 0
  }
  
  // Check if expired
  const isExpired = (expiryDate: string) => {
    const expDate = new Date(expiryDate)
    const today = new Date()
    return expDate < today
  }

  // Status badge for stock level
  const StockStatusBadge = ({ expiryDate }: { expiryDate: string }) => {
    if (isExpired(expiryDate)) {
      return <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-red-100 text-red-800 border-red-200">Expired</span>
    }
    if (isExpiryNear(expiryDate)) {
      return <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-orange-100 text-orange-800 border-orange-200">Low</span>
    }
    return <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-green-100 text-green-800 border-green-200">Good</span>
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Batch-Level Inventory</h1>
        <p className="text-gray-600 mt-1">Manage warehouse inventory and transfers by batch</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Batch SKUs</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{batchInventory.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Batch Stock</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {batchInventory.reduce((sum, item) => sum + item.quantity, 0).toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Warehouse className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Items Near Expiry</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">
                {batchInventory.filter(item => isExpiryNear(item.expiration_date)).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="text-orange-600" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Actions */}
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
        </div>
      </div>

      {/* Backroom Stock Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Batch Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Warehouse
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Slot
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Backroom Qty
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Expiry Date
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                    <Warehouse className="mx-auto mb-3 text-gray-400" size={48} />
                    <p className="text-lg font-medium">No products found</p>
                    <p className="text-sm mt-1">Try adjusting your search</p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr 
                    key={item.id} 
                    className={`hover:bg-gray-50 transition-colors ${
                      isExpired(item.expiration_date) ? 'bg-red-50' : isExpiryNear(item.expiration_date) ? 'bg-orange-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-500 font-mono truncate max-w-[120px]" title={item.id}>
                        {item.id.substring(0, 8)}...
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-sm font-semibold text-gray-900">{item.batch_code}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Created: {formatDate(item.created_at)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{item.product_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 font-mono">{item.product_sku}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{item.warehouse_name}</div>
                      <div className="text-xs text-gray-500">{item.warehouse_location}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-mono font-semibold">
                        {item.slot_code}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm font-semibold text-gray-900">
                        {item.quantity}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className={`text-sm ${
                        isExpired(item.expiration_date) ? 'text-red-600 font-semibold' : 
                        isExpiryNear(item.expiration_date) ? 'text-orange-600 font-semibold' : 
                        'text-gray-600'
                      }`}>
                        {formatDate(item.expiration_date)}
                        {isExpired(item.expiration_date) && (
                          <div className="text-xs mt-1">(Expired!)</div>
                        )}
                        {!isExpired(item.expiration_date) && isExpiryNear(item.expiration_date) && (
                          <div className="text-xs mt-1">(Soon!)</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StockStatusBadge expiryDate={item.expiration_date} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTransferToShelf(item.batch_code)}
                          className="text-[#2d6e3e] border-[#2d6e3e] hover:bg-[#2d6e3e] hover:text-white"
                          disabled={isExpired(item.expiration_date)}
                        >
                          <ArrowRight size={16} className="mr-1" />
                          Transfer
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAdjustStock(item.batch_code)}
                          className="text-gray-700 hover:bg-gray-100"
                        >
                          <Edit size={16} className="mr-1" />
                          Adjust
                        </Button>
                      </div>
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
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} items
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
