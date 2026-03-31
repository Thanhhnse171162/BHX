'use client'

import { useState, useMemo } from 'react'
import { CheckCircle, Calendar, Plus, ChevronLeft, ChevronRight, AlertTriangle, Search, Check, X } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import Modal from '@/shared/ui/Modal'
import { inventoryData } from '@/data/inventory-data'

// Mock data
const inventoryChecks = [
  { id: 1, date: '2024-02-26', time: '14:30', status: 'Completed', checkedBy: 'Nguyen Van A', itemsChecked: 245, discrepancies: 0, duration: '2h 15m' },
  { id: 2, date: '2024-02-24', time: '09:00', status: 'Completed', checkedBy: 'Tran Thi B', itemsChecked: 240, discrepancies: 2, duration: '2h 30m' },
  { id: 3, date: '2024-02-20', time: '15:45', status: 'Completed', checkedBy: 'Le Van C', itemsChecked: 238, discrepancies: 1, duration: '2h 20m' },
  { id: 4, date: '2024-02-15', time: '10:00', status: 'Completed', checkedBy: 'Nguyen Van A', itemsChecked: 235, discrepancies: 3, duration: '2h 45m' },
  { id: 5, date: '2024-02-10', time: '14:00', status: 'Completed', checkedBy: 'Pham Thi D', itemsChecked: 230, discrepancies: 0, duration: '2h 10m' },
  { id: 6, date: '2024-02-05', time: '13:20', status: 'Completed', checkedBy: 'Nguyen Van A', itemsChecked: 228, discrepancies: 1, duration: '2h 25m' },
  { id: 7, date: '2024-01-30', time: '10:15', status: 'Completed', checkedBy: 'Tran Thi B', itemsChecked: 225, discrepancies: 2, duration: '2h 35m' },
  { id: 8, date: '2024-01-25', time: '14:45', status: 'Completed', checkedBy: 'Le Van C', itemsChecked: 222, discrepancies: 0, duration: '2h 18m' },
  { id: 9, date: '2024-01-20', time: '09:30', status: 'Completed', checkedBy: 'Pham Thi D', itemsChecked: 220, discrepancies: 4, duration: '2h 50m' },
  { id: 10, date: '2024-01-15', time: '15:00', status: 'Completed', checkedBy: 'Nguyen Van A', itemsChecked: 218, discrepancies: 1, duration: '2h 22m' },
  { id: 11, date: '2024-01-10', time: '11:20', status: 'Completed', checkedBy: 'Tran Thi B', itemsChecked: 215, discrepancies: 0, duration: '2h 12m' },
  { id: 12, date: '2024-01-05', time: '14:10', status: 'Completed', checkedBy: 'Le Van C', itemsChecked: 212, discrepancies: 3, duration: '2h 40m' },
  { id: 13, date: '2023-12-28', time: '10:45', status: 'Completed', checkedBy: 'Pham Thi D', itemsChecked: 210, discrepancies: 2, duration: '2h 28m' },
  { id: 14, date: '2023-12-22', time: '13:30', status: 'Completed', checkedBy: 'Nguyen Van A', itemsChecked: 208, discrepancies: 1, duration: '2h 20m' },
  { id: 15, date: '2023-12-18', time: '09:15', status: 'Completed', checkedBy: 'Tran Thi B', itemsChecked: 205, discrepancies: 0, duration: '2h 15m' },
  { id: 16, date: '2023-12-12', time: '15:20', status: 'Completed', checkedBy: 'Le Van C', itemsChecked: 203, discrepancies: 2, duration: '2h 32m' },
  { id: 17, date: '2023-12-08', time: '11:00', status: 'Completed', checkedBy: 'Pham Thi D', itemsChecked: 200, discrepancies: 1, duration: '2h 18m' },
  { id: 18, date: '2023-12-02', time: '14:25', status: 'Completed', checkedBy: 'Nguyen Van A', itemsChecked: 198, discrepancies: 3, duration: '2h 42m' },
  { id: 19, date: '2023-11-28', time: '10:30', status: 'Completed', checkedBy: 'Tran Thi B', itemsChecked: 195, discrepancies: 0, duration: '2h 08m' },
  { id: 20, date: '2023-11-22', time: '13:15', status: 'Completed', checkedBy: 'Le Van C', itemsChecked: 192, discrepancies: 2, duration: '2h 30m' },
  { id: 21, date: '2023-11-18', time: '09:45', status: 'Completed', checkedBy: 'Pham Thi D', itemsChecked: 190, discrepancies: 1, duration: '2h 25m' },
  { id: 22, date: '2023-11-12', time: '15:10', status: 'Completed', checkedBy: 'Nguyen Van A', itemsChecked: 188, discrepancies: 0, duration: '2h 12m' },
  { id: 23, date: '2023-11-05', time: '11:30', status: 'Completed', checkedBy: 'Tran Thi B', itemsChecked: 185, discrepancies: 4, duration: '2h 55m' },
  { id: 24, date: '2023-10-30', time: '14:00', status: 'Completed', checkedBy: 'Le Van C', itemsChecked: 182, discrepancies: 2, duration: '2h 35m' },
  { id: 25, date: '2023-10-25', time: '10:20', status: 'Completed', checkedBy: 'Pham Thi D', itemsChecked: 180, discrepancies: 1, duration: '2h 22m' }
]

export default function InventoryChecksPage() {
  const [selectedCheck, setSelectedCheck] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [showNewCheckModal, setShowNewCheckModal] = useState(false)
  const [checkSearchQuery, setCheckSearchQuery] = useState('')
  const [checkedItems, setCheckedItems] = useState<Record<number, { actualQty: number | '', checked: boolean }>>({})
  const itemsPerPage = 10

  // Filter inventory items for the check modal
  const itemsToCheck = useMemo(() => {
    return inventoryData.filter(item => 
      item.name.toLowerCase().includes(checkSearchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(checkSearchQuery.toLowerCase())
    )
  }, [checkSearchQuery])

  // Pagination
  const totalPages = Math.ceil(inventoryChecks.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedChecks = inventoryChecks.slice(startIndex, endIndex)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kiểm kê tồn kho</h1>
          <p className="text-gray-600 mt-1">Theo dõi và quản lý lịch sử kiểm kê tồn kho</p>
        </div>
        <Button 
          className="bg-[#2d6e3e] hover:bg-[#255931] flex items-center gap-2"
          onClick={() => setShowNewCheckModal(true)}
        >
          <Plus size={18} />
          Bắt đầu kiểm tra mới
        </Button>
      </div>

      {/* Checks History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Lịch sử kiểm tra</h2>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              10 mục mỗi trang
            </span>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {paginatedChecks.length > 0 ? (
            paginatedChecks.map((check) => (
            <div 
              key={check.id} 
              className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => setSelectedCheck(selectedCheck === check.id ? null : check.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="text-gray-400" size={18} />
                      <span className="font-semibold text-gray-900">{check.date}</span>
                      <span className="text-gray-500 text-sm">{check.time}</span>
                    </div>
                    <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
                      <CheckCircle size={14} />
                      Hoàn thành
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 mb-1">Người kiểm tra</p>
                      <p className="font-medium text-gray-900">{check.checkedBy}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Vật phẩm đã kiểm</p>
                      <p className="font-medium text-gray-900">{check.itemsChecked}</p>
                    </div>
                  </div>

                  {selectedCheck === check.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Tóm tắt kiểm tra</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex justify-between">
                            <span className="text-gray-600">Tổng vật phẩm:</span>
                            <span className="font-medium">{check.itemsChecked}</span>
                          </li>
                          <li className="flex justify-between">
                            <span className="text-gray-600">Khớp:</span>
                            <span className="font-medium text-green-600">{check.itemsChecked - check.discrepancies}</span>
                          </li>
                          <li className="flex justify-between">
                            <span className="text-gray-600">Không khớp:</span>
                            <span className="font-medium text-red-600">{check.discrepancies}</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <Calendar className="text-gray-300 mb-4" size={64} />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Không tìm thấy kiểm tra</h3>
              <p className="text-gray-500 text-center">
                Không tìm thấy kiểm tra tồn kho trong khoảng thời gian đã chọn.
              </p>
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
                <span className="font-medium text-gray-900">{Math.min(endIndex, inventoryChecks.length)}</span> trong{' '}
                <span className="font-medium text-gray-900">{inventoryChecks.length}</span> kiểm tra
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

      {/* New Check Modal */}
      <Modal
        isOpen={showNewCheckModal}
        onClose={() => {
          setShowNewCheckModal(false)
          setCheckSearchQuery('')
          setCheckedItems({})
        }}
        title="Kiểm tra tồn kho"
        size="xl"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <AlertTriangle className="w-4 h-4 inline mr-2" />
              Kiểm tra và nhập số lượng thực tế của các sản phẩm. Hệ thống sẽ so sánh với số lượng trong kho.
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm sản phẩm theo tên hoặc SKU..."
              value={checkSearchQuery}
              onChange={(e) => setCheckSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Items List */}
          <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Sản phẩm</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">SKU</th>
                  <th className="text-center text-xs font-medium text-gray-500 uppercase px-4 py-3">SL Hệ thống</th>
                  <th className="text-center text-xs font-medium text-gray-500 uppercase px-4 py-3">SL Thực tế</th>
                  <th className="text-center text-xs font-medium text-gray-500 uppercase px-4 py-3">Chênh lệch</th>
                  <th className="text-center text-xs font-medium text-gray-500 uppercase px-4 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {itemsToCheck.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      Không tìm thấy sản phẩm
                    </td>
                  </tr>
                ) : (
                  itemsToCheck.map((item) => {
                    const checkedItem = checkedItems[item.id]
                    const actualQty = checkedItem?.actualQty ?? item.quantity
                    const actualQtyNumber = typeof actualQty === 'number' ? actualQty : 0
                    const discrepancy = actualQtyNumber - item.quantity
                    const isChecked = checkedItem?.checked ?? false

                    return (
                      <tr key={item.id} className={isChecked ? 'bg-green-50' : ''}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{item.name}</div>
                          <div className="text-xs text-gray-500">{item.category}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.sku}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-medium text-gray-900">{item.quantity}</span>
                          <span className="text-xs text-gray-500 ml-1">{item.unit}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            value={actualQty === '' ? '' : actualQty}
                            onChange={(e) => {
                              const inputValue = e.target.value
                              const value = inputValue === '' ? '' : Math.max(0, parseInt(inputValue) || 0)
                              setCheckedItems({
                                ...checkedItems,
                                [item.id]: { actualQty: value, checked: false }
                              })
                            }}
                            className="w-24 text-center"
                            min="0"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          {discrepancy === 0 ? (
                            <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                              <CheckCircle className="w-4 h-4" />
                              Khớp
                            </span>
                          ) : (
                            <span className={`font-medium ${discrepancy > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                              {discrepancy > 0 ? '+' : ''}{discrepancy} {item.unit}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => {
                              setCheckedItems({
                                ...checkedItems,
                                [item.id]: { 
                                  actualQty: checkedItems[item.id]?.actualQty ?? item.quantity, 
                                  checked: !isChecked 
                                }
                              })
                            }}
                            className={`p-2 rounded-lg transition-colors ${
                              isChecked 
                                ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}
                          >
                            {isChecked ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {Object.values(checkedItems).filter(item => item.checked).length}
                </div>
                <div className="text-xs text-gray-600">Đã kiểm tra</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{itemsToCheck.length}</div>
                <div className="text-xs text-gray-600">Tổng sản phẩm</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {Object.entries(checkedItems).filter(([id, data]) => {
                    const item = inventoryData.find(i => i.id === parseInt(id))
                    const actualQtyNumber = typeof data.actualQty === 'number' ? data.actualQty : 0
                    return item && actualQtyNumber !== item.quantity
                  }).length}
                </div>
                <div className="text-xs text-gray-600">Chênh lệch</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => {
                const checkedCount = Object.values(checkedItems).filter(item => item.checked).length
                const discrepancyCount = Object.entries(checkedItems).filter(([id, data]) => {
                  const item = inventoryData.find(i => i.id === parseInt(id))
                  const actualQtyNumber = typeof data.actualQty === 'number' ? data.actualQty : 0
                  return item && actualQtyNumber !== item.quantity && data.checked
                }).length

                // TODO: Submit to API
                console.log('Check completed:', { checkedItems, checkedCount, discrepancyCount })
                alert(`Hoàn thành kiểm tra!\n- Đã kiểm: ${checkedCount} sản phẩm\n- Chênh lệch: ${discrepancyCount} sản phẩm`)
                setShowNewCheckModal(false)
                setCheckSearchQuery('')
                setCheckedItems({})
              }}
              className="flex-1 bg-[#2d6e3e] hover:bg-[#255931]"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Hoàn thành kiểm tra
            </Button>
            <Button
              onClick={() => {
                setShowNewCheckModal(false)
                setCheckSearchQuery('')
                setCheckedItems({})
              }}
              variant="outline"
              className="flex-1"
            >
              Hủy
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
