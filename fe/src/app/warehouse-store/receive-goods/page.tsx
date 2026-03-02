'use client'

import { useState } from 'react'
import { TruckIcon, CheckCircle, AlertTriangle, Package, Calendar } from 'lucide-react'
import { Button } from '@/shared/ui/Button'

interface TransferOrder {
  id: string
  transferDate: string
  fromWarehouse: string
  status: 'pending' | 'in-transit' | 'delivered' | 'confirmed'
  totalItems: number
  items: {
    productName: string
    sku: string
    expectedQty: number
    receivedQty: number
    damaged: number
    status: 'pending' | 'confirmed' | 'partial' | 'damaged'
  }[]
}

export default function ReceiveGoodsPage() {
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)
  const [receivingMode, setReceivingMode] = useState(false)

  // Mock data cho phiếu chuyển hàng từ kho tổng
  const transferOrders: TransferOrder[] = [
    {
      id: 'TRF-2026-001',
      transferDate: '2026-03-02',
      fromWarehouse: 'Kho tổng - Central Warehouse',
      status: 'in-transit',
      totalItems: 5,
      items: [
        { productName: 'Coca Cola 330ml', sku: 'BEV-001', expectedQty: 100, receivedQty: 0, damaged: 0, status: 'pending' },
        { productName: 'Pepsi 330ml', sku: 'BEV-002', expectedQty: 80, receivedQty: 0, damaged: 0, status: 'pending' },
        { productName: 'Sprite 330ml', sku: 'BEV-003', expectedQty: 60, receivedQty: 0, damaged: 0, status: 'pending' },
        { productName: 'Fanta 330ml', sku: 'BEV-004', expectedQty: 50, receivedQty: 0, damaged: 0, status: 'pending' },
        { productName: '7Up 330ml', sku: 'BEV-005', expectedQty: 40, receivedQty: 0, damaged: 0, status: 'pending' },
      ],
    },
    {
      id: 'TRF-2026-002',
      transferDate: '2026-03-01',
      fromWarehouse: 'Kho tổng - Central Warehouse',
      status: 'delivered',
      totalItems: 3,
      items: [
        { productName: 'Snickers 50g', sku: 'SNC-001', expectedQty: 150, receivedQty: 0, damaged: 0, status: 'pending' },
        { productName: 'KitKat 45g', sku: 'KTK-001', expectedQty: 120, receivedQty: 0, damaged: 0, status: 'pending' },
        { productName: 'Mars 51g', sku: 'MRS-001', expectedQty: 100, receivedQty: 0, damaged: 0, status: 'pending' },
      ],
    },
    {
      id: 'TRF-2026-003',
      transferDate: '2026-02-28',
      fromWarehouse: 'Kho tổng - Central Warehouse',
      status: 'confirmed',
      totalItems: 4,
      items: [
        { productName: 'Lays Chips 50g', sku: 'CHP-001', expectedQty: 200, receivedQty: 195, damaged: 5, status: 'confirmed' },
        { productName: 'Doritos 50g', sku: 'CHP-002', expectedQty: 180, receivedQty: 180, damaged: 0, status: 'confirmed' },
        { productName: 'Pringles 100g', sku: 'CHP-003', expectedQty: 100, receivedQty: 98, damaged: 2, status: 'partial' },
        { productName: 'Cheetos 50g', sku: 'CHP-004', expectedQty: 150, receivedQty: 150, damaged: 0, status: 'confirmed' },
      ],
    },
  ]

  const getStatusBadge = (status: string) => {
    const styles = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'in-transit': 'bg-blue-100 text-blue-800',
      'delivered': 'bg-green-100 text-green-800',
      'confirmed': 'bg-gray-100 text-gray-800',
    }
    const labels = {
      'pending': 'Chờ gửi',
      'in-transit': 'Đang vận chuyển',
      'delivered': 'Đã giao',
      'confirmed': 'Đã xác nhận',
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  const handleReceiveOrder = (orderId: string) => {
    setSelectedOrder(orderId)
    setReceivingMode(true)
  }

  const handleConfirmReceive = () => {
    alert('Đã xác nhận nhận hàng và cập nhật tồn kho!')
    setReceivingMode(false)
    setSelectedOrder(null)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Receive Goods</h1>
          <p className="text-gray-600 mt-1">Nhận hàng từ kho tổng</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 px-4 py-2 rounded-lg">
            <p className="text-sm text-gray-600">Phiếu chờ nhận</p>
            <p className="text-2xl font-bold text-blue-600">
              {transferOrders.filter(o => o.status === 'delivered' || o.status === 'in-transit').length}
            </p>
          </div>
        </div>
      </div>

      {/* Transfer Orders List */}
      <div className="bg-white rounded-xl shadow border border-gray-200">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Danh sách phiếu chuyển hàng</h2>
          <div className="space-y-4">
            {transferOrders.map((order) => (
              <div
                key={order.id}
                className={`border rounded-lg p-4 transition-all ${
                  selectedOrder === order.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{order.id}</h3>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <TruckIcon className="w-4 h-4" />
                        <span>{order.fromWarehouse}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{order.transferDate}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        <span>{order.totalItems} sản phẩm</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {order.status === 'delivered' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleReceiveOrder(order.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Nhận hàng
                      </Button>
                    )}
                    {order.status === 'in-transit' && (
                      <Button variant="outline" size="sm" disabled>
                        Đang vận chuyển
                      </Button>
                    )}
                    {order.status === 'confirmed' && (
                      <Button variant="outline" size="sm" disabled>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Đã nhận
                      </Button>
                    )}
                  </div>
                </div>

                {/* Items details */}
                {selectedOrder === order.id && receivingMode ? (
                  <div className="mt-4 border-t pt-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Chi tiết sản phẩm - Xác nhận nhận hàng</h4>
                    <div className="space-y-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="bg-white p-3 rounded border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{item.productName}</p>
                              <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-xs text-gray-500">Số lượng dự kiến</p>
                                <p className="font-semibold text-gray-900">{item.expectedQty}</p>
                              </div>
                              <div className="text-right">
                                <label className="text-xs text-gray-500 block">Thực nhận</label>
                                <input
                                  type="number"
                                  defaultValue={item.expectedQty}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                                />
                              </div>
                              <div className="text-right">
                                <label className="text-xs text-gray-500 block">Hư hỏng</label>
                                <input
                                  type="number"
                                  defaultValue={0}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3 mt-4">
                      <Button variant="primary" onClick={handleConfirmReceive}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Xác nhận & Cập nhật tồn kho
                      </Button>
                      <Button variant="outline" onClick={() => setReceivingMode(false)}>
                        Hủy
                      </Button>
                    </div>
                  </div>
                ) : (
                  order.status === 'confirmed' && (
                    <div className="mt-4 border-t pt-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Chi tiết đã nhận</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="bg-gray-50 p-3 rounded">
                            <p className="font-medium text-gray-900">{item.productName}</p>
                            <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                            <div className="flex gap-4 mt-2 text-sm">
                              <span className="text-gray-600">Dự kiến: {item.expectedQty}</span>
                              <span className="text-green-600 font-medium">Thực nhận: {item.receivedQty}</span>
                              {item.damaged > 0 && (
                                <span className="text-orange-600">Hư hỏng: {item.damaged}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Hướng dẫn nhận hàng</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Kiểm tra phiếu chuyển hàng có trạng thái "Đã giao"</li>
              <li>• Nhấn nút "Nhận hàng" và xác nhận số lượng thực tế</li>
              <li>• Ghi nhận số lượng hư hỏng/thiếu nếu có</li>
              <li>• Hệ thống sẽ tự động cập nhật tồn kho sau khi xác nhận</li>
              <li>• Lưu lịch sử nhận hàng để tra cứu</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
