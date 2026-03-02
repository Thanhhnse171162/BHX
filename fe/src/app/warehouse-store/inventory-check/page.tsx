'use client'

import { useState } from 'react'
import { ClipboardCheck, Download, Calendar, CheckCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@/shared/ui/Button'

interface CheckSession {
  id: string
  checkDate: string
  checkBy: string
  status: 'in-progress' | 'completed'
  totalItems: number
  checkedItems: number
  discrepancies: number
}

interface InventoryCheckItem {
  id: string
  productName: string
  sku: string
  systemQty: number
  actualQty: number
  difference: number
  note?: string
}

export default function InventoryCheckPage() {
  const [activeCheck, setActiveCheck] = useState<string | null>(null)
  const [checkItems, setCheckItems] = useState<Map<string, number>>(new Map())

  // Mock data
  const checkSessions: CheckSession[] = [
    {
      id: 'CHK-2026-001',
      checkDate: '2026-03-02',
      checkBy: 'Lê Văn Quân Lý',
      status: 'in-progress',
      totalItems: 12,
      checkedItems: 7,
      discrepancies: 2,
    },
    {
      id: 'CHK-2026-002',
      checkDate: '2026-02-28',
      checkBy: 'Lê Văn Quân Lý',
      status: 'completed',
      totalItems: 15,
      checkedItems: 15,
      discrepancies: 3,
    },
  ]

  const inventoryItems: InventoryCheckItem[] = [
    { id: '1', productName: 'Coca Cola 330ml', sku: 'BEV-001', systemQty: 200, actualQty: 0, difference: 0 },
    { id: '2', productName: 'Pepsi 330ml', sku: 'BEV-002', systemQty: 160, actualQty: 0, difference: 0 },
    { id: '3', productName: 'Sprite 330ml', sku: 'BEV-003', systemQty: 95, actualQty: 0, difference: 0 },
    { id: '4', productName: 'Snickers 50g', sku: 'SNC-001', systemQty: 280, actualQty: 0, difference: 0 },
    { id: '5', productName: 'KitKat 45g', sku: 'KTK-001', systemQty: 250, actualQty: 0, difference: 0 },
  ]

  const handleStartCheck = () => {
    setActiveCheck('new')
  }

  const handleActualQtyChange = (itemId: string, actualQty: number) => {
    const newMap = new Map(checkItems)
    newMap.set(itemId, actualQty)
    setCheckItems(newMap)
  }

  const handleCompleteCheck = () => {
    if (checkItems.size === 0) {
      alert('Vui lòng nhập số lượng thực tế!')
      return
    }
    
    // Calculate discrepancies
    let discrepancyCount = 0
    checkItems.forEach((actualQty, itemId) => {
      const item = inventoryItems.find(i => i.id === itemId)
      if (item && actualQty !== item.systemQty) {
        discrepancyCount++
      }
    })
    
    if (confirm(`Hoàn thành kiểm kê?\n- Đã kiểm: ${checkItems.size} sản phẩm\n- Chênh lệch: ${discrepancyCount} sản phẩm`)) {
      alert('Đã hoàn thành kiểm kê và cập nhật hệ thống!')
      setActiveCheck(null)
      setCheckItems(new Map())
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Check</h1>
          <p className="text-gray-600 mt-1">Kiểm kê định kỳ cửa hàng</p>
        </div>
        {!activeCheck && (
          <Button variant="primary" onClick={handleStartCheck}>
            <ClipboardCheck className="w-5 h-5 mr-2" />
            Bắt đầu kiểm kê
          </Button>
        )}
      </div>

      {/* Active Check Session */}
      {activeCheck && (
        <div className="bg-white rounded-xl shadow border border-blue-200">
          <div className="bg-blue-50 px-6 py-4 border-b border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold text-blue-900">Phiên kiểm kê đang thực hiện</h2>
              </div>
              <span className="text-sm text-blue-700">
                {checkItems.size} / {inventoryItems.length} đã kiểm
              </span>
            </div>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Sản phẩm</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">SKU</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Số lượng hệ thống</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Số lượng thực tế</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Chênh lệch</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryItems.map((item) => {
                    const actualQty = checkItems.get(item.id)
                    const difference = actualQty !== undefined ? actualQty - item.systemQty : 0
                    const isChecked = actualQty !== undefined
                    const hasDifference = isChecked && difference !== 0
                    
                    return (
                      <tr key={item.id} className={`border-b border-gray-100 ${hasDifference ? 'bg-orange-50' : ''}`}>
                        <td className="py-4 px-4">
                          <p className="font-medium text-gray-900">{item.productName}</p>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-600 font-mono">{item.sku}</span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="font-semibold text-gray-900">{item.systemQty}</span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <input
                            type="number"
                            min="0"
                            value={actualQty === undefined ? '' : actualQty}
                            onChange={(e) => handleActualQtyChange(item.id, parseInt(e.target.value) || 0)}
                            placeholder="Nhập SL"
                            className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </td>
                        <td className="py-4 px-4 text-center">
                          {isChecked && (
                            <span className={`font-bold ${difference > 0 ? 'text-green-600' : difference < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                              {difference > 0 ? '+' : ''}{difference}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          {isChecked ? (
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                              hasDifference ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                            }`}>
                              <CheckCircle className="w-3 h-3" />
                              {hasDifference ? 'Có chênh lệch' : 'Khớp'}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">Chưa kiểm</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="primary" onClick={handleCompleteCheck}>
                <CheckCircle className="w-5 h-5 mr-2" />
                Hoàn thành kiểm kê
              </Button>
              <Button variant="outline" onClick={() => {
                setActiveCheck(null)
                setCheckItems(new Map())
              }}>
                Hủy
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Check History */}
      <div className="bg-white rounded-xl shadow border border-gray-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Lịch sử kiểm kê</h2>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Xuất báo cáo
            </Button>
          </div>
          
          <div className="space-y-4">
            {checkSessions.map((session) => (
              <div
                key={session.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{session.id}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        session.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {session.status === 'completed' ? 'Hoàn thành' : 'Đang tiến hành'}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <p className="text-gray-500">Ngày kiểm</p>
                        <p className="font-semibold text-gray-900">{session.checkDate}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Người kiểm</p>
                        <p className="font-semibold text-gray-900">{session.checkBy}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Đã kiểm</p>
                        <p className="font-semibold text-gray-900">{session.checkedItems} / {session.totalItems}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Chênh lệch</p>
                        <p className={`font-semibold ${session.discrepancies > 0 ? 'text-orange-600' : 'text-gray-900'}`}>
                          {session.discrepancies} sản phẩm
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Xem chi tiết
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex gap-3">
          <ClipboardCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Hướng dẫn kiểm kê</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Nhấn "Bắt đầu kiểm kê" để tạo phiên kiểm kê mới</li>
              <li>• Kiểm đếm số lượng thực tế và nhập vào hệ thống</li>
              <li>• Hệ thống sẽ tự động tính chênh lệch so với số liệu hệ thống</li>
              <li>• Ghi chú cho các sản phẩm có chênh lệch</li>
              <li>• Hoàn thành kiểm kê để cập nhật số liệu vào hệ thống</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
