'use client'

import { XCircle, TrendingUp, Package } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { useRouter } from 'next/navigation'

interface OutOfStockItem {
  id: string
  productName: string
  sku: string
  category: string
  lastStockDate: string
  daysOutOfStock: number
  suggestedReorder: number
}

export default function OutOfStockPage() {
  const router = useRouter()

  const outOfStockItems: OutOfStockItem[] = [
    {
      id: '1',
      productName: '7Up 330ml',
      sku: 'BEV-005',
      category: 'Beverages',
      lastStockDate: '2026-02-25',
      daysOutOfStock: 5,
      suggestedReorder: 200,
    },
    {
      id: '2',
      productName: 'Mountain Dew 330ml',
      sku: 'BEV-006',
      category: 'Beverages',
      lastStockDate: '2026-02-28',
      daysOutOfStock: 2,
      suggestedReorder: 150,
    },
    {
      id: '3',
      productName: 'Bounty 57g',
      sku: 'BNT-001',
      category: 'Chocolate',
      lastStockDate: '2026-02-20',
      daysOutOfStock: 10,
      suggestedReorder: 180,
    },
  ]

  const handleRequestRestock = (item: OutOfStockItem) => {
    router.push(`/warehouse-store/restock-request?sku=${item.sku}&qty=${item.suggestedReorder}`)
  }

  const getUrgencyLevel = (days: number) => {
    if (days > 7) return { label: 'Nguy cấp', class: 'bg-red-600 text-white', color: 'red' }
    if (days > 3) return { label: 'Khẩn', class: 'bg-orange-500 text-white', color: 'orange' }
    return { label: 'Mới', class: 'bg-yellow-500 text-white', color: 'yellow' }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Out of Stock</h1>
          <p className="text-gray-600 mt-1">Sản phẩm hết hàng tại cửa hàng</p>
        </div>
        <div className="bg-red-50 px-6 py-3 rounded-lg">
          <p className="text-sm text-gray-600">Tổng sản phẩm hết hàng</p>
          <p className="text-3xl font-bold text-red-600">{outOfStockItems.length}</p>
        </div>
      </div>

      {/* Critical Alert */}
      {outOfStockItems.some(item => item.daysOutOfStock > 7) && (
        <div className="bg-red-50 border-2 border-red-500 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-red-900 mb-2">⚠️ Cảnh báo: Sản phẩm hết hàng kéo dài!</h3>
              <p className="text-red-800">
                Có {outOfStockItems.filter(item => item.daysOutOfStock > 7).length} sản phẩm đã hết hàng trên 7 ngày. 
                Cần yêu cầu nhập hàng ngay lập tức!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Out of Stock List */}
      <div className="bg-white rounded-xl shadow border border-gray-200">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Danh sách sản phẩm hết hàng</h2>
          <div className="space-y-4">
            {outOfStockItems.map((item) => {
              const urgency = getUrgencyLevel(item.daysOutOfStock)
              
              return (
                <div
                  key={item.id}
                  className="border-2 border-red-200 rounded-lg p-5 bg-red-50 hover:shadow-lg transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                          <XCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{item.productName}</h3>
                          <p className="text-sm text-gray-600">SKU: {item.sku} | {item.category}</p>
                        </div>
                        <span className={`px-4 py-1 rounded-full text-sm font-bold ${urgency.class}`}>
                          {urgency.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-6 mt-4 bg-white rounded-lg p-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Hết hàng lần cuối</p>
                          <p className="text-lg font-bold text-gray-900">{item.lastStockDate}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Số ngày hết hàng</p>
                          <p className={`text-lg font-bold text-${urgency.color}-600`}>
                            {item.daysOutOfStock} ngày
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Đề xuất nhập</p>
                          <p className="text-lg font-bold text-green-600">{item.suggestedReorder} sp</p>
                        </div>
                      </div>

                      {/* Progress bar showing days out of stock */}
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-gray-600 mb-2">
                          <span>Thời gian hết hàng</span>
                          <span className="font-semibold">{item.daysOutOfStock} / 14 ngày</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full ${
                              item.daysOutOfStock > 7 ? 'bg-red-600' : 
                              item.daysOutOfStock > 3 ? 'bg-orange-500' : 'bg-yellow-500'
                            }`}
                            style={{ width: `${Math.min((item.daysOutOfStock / 14) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="ml-6 flex flex-col gap-2">
                      <Button
                        variant="primary"
                        size="lg"
                        className="bg-red-600 hover:bg-red-700"
                        onClick={() => handleRequestRestock(item)}
                      >
                        <TrendingUp className="w-5 h-5 mr-2" />
                        Yêu cầu nhập hàng
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/warehouse-store/inventory?search=${item.sku}`)}
                      >
                        Xem chi tiết
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* No Out of Stock */}
      {outOfStockItems.length === 0 && (
        <div className="bg-white rounded-xl shadow border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Tuyệt vời! Không có sản phẩm nào hết hàng</h3>
          <p className="text-gray-600">Tất cả sản phẩm đều có sẵn trong kho</p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => router.push('/warehouse-store/low-stock')}
          className="bg-white border-2 border-orange-200 rounded-xl p-6 hover:shadow-lg transition text-left"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="font-bold text-gray-900">Low Stock Alerts</h3>
          </div>
          <p className="text-sm text-gray-600">Xem sản phẩm sắp hết để tránh hết hàng</p>
        </button>

        <button
          onClick={() => router.push('/warehouse-store/restock-request')}
          className="bg-white border-2 border-blue-200 rounded-xl p-6 hover:shadow-lg transition text-left"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900">Restock Request</h3>
          </div>
          <p className="text-sm text-gray-600">Tạo yêu cầu nhập hàng từ kho tổng</p>
        </button>

        <button
          onClick={() => router.push('/warehouse-store/receive-goods')}
          className="bg-white border-2 border-green-200 rounded-xl p-6 hover:shadow-lg transition text-left"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-bold text-gray-900">Receive Goods</h3>
          </div>
          <p className="text-sm text-gray-600">Nhận hàng từ kho tổng</p>
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex gap-3">
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 mb-2">Xử lý sản phẩm hết hàng</h3>
            <ul className="text-sm text-red-800 space-y-1">
              <li>• <strong>Ngay lập tức:</strong> Tạo yêu cầu nhập hàng cho các sản phẩm hết hàng</li>
              <li>• <strong>Ưu tiên:</strong> Sản phẩm hết hàng trên 7 ngày cần được xử lý gấp</li>
              <li>• <strong>Theo dõi:</strong> Kiểm tra trạng thái yêu cầu nhập hàng thường xuyên</li>
              <li>• <strong>Phòng ngừa:</strong> Theo dõi Low Stock Alerts để tránh hết hàng</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
