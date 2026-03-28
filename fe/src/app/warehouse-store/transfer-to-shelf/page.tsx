'use client'

import { useState } from 'react'
import { ArrowRightLeft, Search, Store } from 'lucide-react'
import { Button } from '@/shared/ui/Button'

interface InventoryItem {
  id: string
  productName: string
  sku: string
  unit?: string
  inStorage: number
  onShelf: number
  minStock: number
}

export default function TransferToShelfPage() {
  const [selectedItems, setSelectedItems] = useState<Map<string, number>>(new Map())
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Mock data - Sản phẩm trong kho
  const inventory: InventoryItem[] = [
    { id: '1', productName: 'Coca Cola 330ml', sku: 'BEV-001', inStorage: 150, onShelf: 50, minStock: 30 },
    { id: '2', productName: 'Pepsi 330ml', sku: 'BEV-002', inStorage: 120, onShelf: 40, minStock: 25 },
    { id: '3', productName: 'Sprite 330ml', sku: 'BEV-003', inStorage: 100, onShelf: 30, minStock: 20 },
    { id: '4', productName: 'Snickers 50g', sku: 'SNC-001', inStorage: 200, onShelf: 80, minStock: 50 },
    { id: '5', productName: 'KitKat 45g', sku: 'KTK-001', inStorage: 180, onShelf: 70, minStock: 40 },
    { id: '6', productName: 'Lays Chips 50g', sku: 'CHP-001', inStorage: 250, onShelf: 100, minStock: 60 },
    { id: '7', productName: 'Doritos 50g', sku: 'CHP-002', inStorage: 180, onShelf: 85, minStock: 50 },
    { id: '8', productName: 'Pringles 100g', sku: 'CHP-003', inStorage: 120, onShelf: 45, minStock: 40 },
    { id: '9', productName: 'Cheetos 50g', sku: 'CHP-004', inStorage: 90, onShelf: 35, minStock: 30 },
    { id: '10', productName: 'Fanta 330ml', sku: 'BEV-004', inStorage: 110, onShelf: 25, minStock: 20 },
    { id: '11', productName: '7Up 330ml', sku: 'BEV-005', inStorage: 95, onShelf: 20, minStock: 15 },
    { id: '12', productName: 'Mars 51g', sku: 'MRS-001', inStorage: 150, onShelf: 60, minStock: 35 },
    { id: '13', productName: 'Twix 50g', sku: 'TWX-001', inStorage: 140, onShelf: 55, minStock: 30 },
    { id: '14', productName: 'Bounty 57g', sku: 'BNT-001', inStorage: 130, onShelf: 50, minStock: 28 },
    { id: '15', productName: 'Milky Way 52g', sku: 'MLK-001', inStorage: 125, onShelf: 48, minStock: 25 },
    { id: '16', productName: 'Oreo 133g', sku: 'ORE-001', inStorage: 200, onShelf: 90, minStock: 60 },
    { id: '17', productName: 'Ritz Crackers 100g', sku: 'RTZ-001', inStorage: 160, onShelf: 70, minStock: 45 },
    { id: '18', productName: 'Nutella 350g', sku: 'NTL-001', inStorage: 80, onShelf: 30, minStock: 20 },
  ]

  const filteredInventory = inventory.filter(item =>
    item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Pagination calculations
  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedInventory = filteredInventory.slice(startIndex, endIndex)

  // Reset to page 1 when search changes
  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const handleQuantityChange = (itemId: string, quantity: number) => {
    const newMap = new Map(selectedItems)
    if (quantity > 0) {
      newMap.set(itemId, quantity)
    } else {
      newMap.delete(itemId)
    }
    setSelectedItems(newMap)
  }

  const handleTransfer = () => {
    if (selectedItems.size === 0) {
      alert('Vui lòng chọn sản phẩm và số lượng cần xuất!')
      return
    }
    
    let message = 'Xác nhận xuất hàng ra quầy:\n\n'
    selectedItems.forEach((qty, itemId) => {
      const item = inventory.find(i => i.id === itemId)
      if (item) {
        message += `- ${item.productName}: ${qty} sản phẩm\n`
      }
    })
    
    if (confirm(message)) {
      alert('Đã xuất hàng ra quầy và cập nhật tồn kho!')
      setSelectedItems(new Map())
    }
  }

  const getTotalSelected = () => {
    return Array.from(selectedItems.values()).reduce((sum, qty) => sum + qty, 0)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transfer to Shelf</h1>
          <p className="text-gray-600 mt-1">Xuất hàng từ kho ra quầy bán</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-purple-50 px-4 py-2 rounded-lg">
            <p className="text-sm text-gray-600">Đã chọn</p>
            <p className="text-2xl font-bold text-purple-600">{getTotalSelected()}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm theo tên hoặc SKU..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="ml-4 text-sm text-gray-600">
            Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredInventory.length)} / {filteredInventory.length} sản phẩm
          </div>
        </div>
      </div>

      {/* Inventory List */}
      <div className="bg-white rounded-xl shadow border border-gray-200">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Chọn sản phẩm xuất ra quầy</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Sản phẩm</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">SKU</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Trong kho</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Trên quầy</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Số lượng xuất</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedInventory.map((item) => {
                  const needRestock = item.onShelf < item.minStock
                  const selectedQty = selectedItems.get(item.id) || 0
                  
                  return (
                    <tr key={item.id} className={`border-b border-gray-100 hover:bg-gray-50 ${needRestock ? 'bg-orange-50' : ''}`}>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{item.productName}</p>
                          {needRestock && (
                            <span className="text-xs text-orange-600 font-medium">⚠️ Quầy sắp hết</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-600">{item.sku}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="font-semibold text-gray-900">{item.inStorage}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`font-semibold ${needRestock ? 'text-orange-600' : 'text-gray-900'}`}>
                          {item.onShelf}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <input
                          type="number"
                          min="0"
                          max={item.inStorage}
                          value={selectedQty}
                          onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="0"
                        />
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const suggestedQty = Math.min(item.minStock * 2, item.inStorage)
                            handleQuantityChange(item.id, suggestedQty)
                          }}
                          className={needRestock 
                            ? "text-orange-600 border-orange-600 hover:bg-orange-50" 
                            : "text-purple-600 border-purple-600 hover:bg-purple-50"
                          }
                        >
                          Đề xuất
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Trang {currentPage} / {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Trước
                </Button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Sau
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedItems.size > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
          <h3 className="font-bold text-gray-900 mb-3">Tổng kết xuất hàng</h3>
          <div className="space-y-2 mb-4">
            {Array.from(selectedItems.entries()).map(([itemId, qty]) => {
              const item = inventory.find(i => i.id === itemId)
              if (!item) return null
              return (
                <div key={itemId} className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">{item.productName}</span>
                  <span className="font-semibold text-gray-900">{qty} sản phẩm</span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-between border-t border-purple-300 pt-3">
            <span className="font-bold text-gray-900">Tổng số lượng:</span>
            <span className="text-2xl font-bold text-purple-600">{getTotalSelected()}</span>
          </div>
          <Button
            variant="primary"
            size="lg"
            className="w-full mt-4 bg-purple-600 hover:bg-purple-700"
            onClick={handleTransfer}
          >
            <ArrowRightLeft className="w-5 h-5 mr-2" />
            Xác nhận xuất ra quầy
          </Button>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex gap-3">
          <Store className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Hướng dẫn xuất hàng ra quầy</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Chọn sản phẩm cần xuất từ kho ra quầy bán</li>
              <li>• Nhập số lượng cần xuất (không vượt quá số lượng trong kho)</li>
              <li>• Sản phẩm có cảnh báo &quot;Quầy sắp hết&quot; cần ưu tiên bổ sung</li>
              <li>• Nhấn &quot;Đề xuất&quot; để hệ thống tự động tính số lượng nên xuất</li>
              <li>• Xác nhận xuất hàng - hệ thống sẽ cập nhật tồn kho tự động</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
