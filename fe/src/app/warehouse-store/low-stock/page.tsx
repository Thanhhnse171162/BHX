'use client'

import { useState } from 'react'
import { AlertTriangle, TrendingUp } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { useRouter } from 'next/navigation'

interface LowStockItem {
  id: string
  productName: string
  sku: string
  inStorage: number
  onShelf: number
  total: number
  category: string
  minStock: number
  status: 'critical' | 'warning' | 'low'
}

export default function LowStockAlertsPage() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  
  const lowStockItems: LowStockItem[] = [
    { id: '1', productName: 'Sprite 330ml', sku: 'BEV-003', inStorage: 80, onShelf: 15, total: 95, category: 'Beverages', minStock: 100, status: 'warning' },
    { id: '2', productName: 'Fanta 330ml', sku: 'BEV-004', inStorage: 0, onShelf: 5, total: 5, category: 'Beverages', minStock: 80, status: 'critical' },
    { id: '3', productName: 'Mars 51g', sku: 'MRS-001', inStorage: 50, onShelf: 20, total: 70, category: 'Chocolate', minStock: 100, status: 'warning' },
    { id: '4', productName: 'Pringles 100g', sku: 'CHP-003', inStorage: 85, onShelf: 0, total: 85, category: 'Snacks', minStock: 120, status: 'warning' },
    { id: '5', productName: 'Twix 50g', sku: 'TWX-001', inStorage: 55, onShelf: 0, total: 55, category: 'Chocolate', minStock: 90, status: 'warning' },
  ]

  const criticalItems = lowStockItems.filter(item => item.status === 'critical')
  const warningItems = lowStockItems.filter(item => item.status === 'warning' || item.status === 'low')

  // Pagination
  const totalPages = Math.ceil(lowStockItems.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedItems = lowStockItems.slice(startIndex, endIndex)

  const getStockPercentage = (current: number, min: number) => {
    return Math.round((current / min) * 100)
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'critical':
        return {
          label: 'NGUY CẤP',
          bgColor: 'bg-red-100',
          textColor: 'text-red-700',
          badgeColor: 'bg-red-600'
        }
      case 'warning':
        return {
          label: 'CẢNH BÁO',
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-700',
          badgeColor: 'bg-orange-500'
        }
      default:
        return {
          label: 'Low Stock',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-700',
          badgeColor: 'bg-yellow-500'
        }
    }
  }

  const handleRequestRestock = (item: LowStockItem) => {
    router.push(`/warehouse-store/restock-request?sku=${item.sku}`)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Low Stock Alerts</h1>
          <p className="text-gray-600 mt-1">Cảnh báo sản phẩm sắp hết tại cửa hàng</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-red-50 px-4 py-2 rounded-lg">
            <p className="text-sm text-gray-600">Nguy cấp</p>
            <p className="text-2xl font-bold text-red-600">{criticalItems.length}</p>
          </div>
          <div className="bg-orange-50 px-4 py-2 rounded-lg">
            <p className="text-sm text-gray-600">Cảnh báo</p>
            <p className="text-2xl font-bold text-orange-600">{warningItems.length}</p>
          </div>
        </div>
      </div>

      {/* Alert Sections */}
      {criticalItems.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-bold text-red-900">Cảnh báo nguy cấp - Cần nhập hàng gấp</h2>
          </div>
        </div>
      )}

      {warningItems.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-bold text-orange-900">Cảnh báo sắp hết hàng</h2>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Sản phẩm</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">SKU</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Danh mục</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-700">Trong kho</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-700">Trên quầy</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-700">Tổng</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-700">Trạng thái</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-700">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((item) => {
                const statusConfig = getStatusConfig(item.status)
                const percentage = getStockPercentage(item.total, item.minStock)
                
                return (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-semibold text-gray-900">{item.productName}</p>
                        {item.status === 'critical' && (
                          <span className="text-xs px-2 py-0.5 bg-red-600 text-white rounded-full font-bold mt-1 inline-block">
                            {statusConfig.label}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-600">{item.sku}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-600">{item.category}</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`font-semibold ${item.status === 'critical' ? 'text-red-600' : 'text-gray-900'}`}>
                        {item.inStorage}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`font-semibold ${item.status === 'critical' ? 'text-red-600' : item.status === 'warning' ? 'text-orange-600' : 'text-gray-900'}`}>
                        {item.onShelf}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="font-semibold text-gray-900">{item.total}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                          {item.status === 'warning' ? statusConfig.label : 'Low Stock'}
                        </span>
                        {/* Progress bar */}
                        <div className="w-full max-w-[120px]">
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                item.status === 'critical' ? 'bg-red-600' : 
                                item.status === 'warning' ? 'bg-orange-500' : 
                                'bg-yellow-500'
                              }`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                          <span className={`text-xs font-semibold ${statusConfig.textColor}`}>
                            {percentage}%
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <Button
                        variant={item.status === 'critical' ? 'primary' : 'outline'}
                        size="sm"
                        className={
                          item.status === 'critical' 
                            ? 'bg-red-600 hover:bg-red-700 text-white border-0' 
                            : 'text-orange-600 border-orange-600 hover:bg-orange-50'
                        }
                        onClick={() => handleRequestRestock(item)}
                      >
                        <TrendingUp className="w-4 h-4 mr-1" />
                        Yêu cầu nhập hàng
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Hiển thị {startIndex + 1}-{Math.min(endIndex, lowStockItems.length)} / {lowStockItems.length} sản phẩm
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
                          ? 'bg-green-600 text-white'
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

      {/* No alerts */}
      {lowStockItems.length === 0 && (
        <div className="bg-white rounded-xl shadow border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Tất cả sản phẩm đều đầy đủ</h3>
          <p className="text-gray-600">Hiện tại không có sản phẩm nào cần cảnh báo</p>
        </div>
      )}
    </div>
  )
}
