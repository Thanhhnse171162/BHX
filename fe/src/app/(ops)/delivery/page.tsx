'use client'

import { useState } from 'react'
import { Package, Truck, CheckCircle, Clock, MapPin, Phone, User, ChevronDown, ChevronUp } from 'lucide-react'

interface Delivery {
  id: string
  orderId: string
  customer: string
  phone: string
  address: string
  items: number
  status: 'pending' | 'in_transit' | 'delivered' | 'failed'
  time: string
  notes?: string
}

const mockDeliveries: Delivery[] = [
  {
    id: 'D001',
    orderId: 'ORD-2024-001',
    customer: 'Nguyễn Văn A',
    phone: '0901 234 567',
    address: '123 Lê Lợi, Quận 1, TP.HCM',
    items: 3,
    status: 'pending',
    time: '09:00 - 11:00',
    notes: 'Gọi trước khi đến 15 phút',
  },
  {
    id: 'D002',
    orderId: 'ORD-2024-002',
    customer: 'Trần Thị B',
    phone: '0912 345 678',
    address: '456 Nguyễn Huệ, Quận 1, TP.HCM',
    items: 5,
    status: 'in_transit',
    time: '11:00 - 13:00',
  },
  {
    id: 'D003',
    orderId: 'ORD-2024-003',
    customer: 'Lê Văn C',
    phone: '0923 456 789',
    address: '789 Đinh Tiên Hoàng, Bình Thạnh, TP.HCM',
    items: 2,
    status: 'delivered',
    time: '08:00 - 09:30',
  },
  {
    id: 'D004',
    orderId: 'ORD-2024-004',
    customer: 'Phạm Thị D',
    phone: '0934 567 890',
    address: '321 Hoàng Diệu, Quận 4, TP.HCM',
    items: 7,
    status: 'pending',
    time: '14:00 - 16:00',
    notes: 'Để hàng tại bảo vệ nếu không có nhà',
  },
]

const statusConfig = {
  pending: { label: 'Chờ giao', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  in_transit: { label: 'Đang giao', color: 'bg-blue-100 text-blue-800', icon: Truck },
  delivered: { label: 'Đã giao', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  failed: { label: 'Giao thất bại', color: 'bg-red-100 text-red-800', icon: Package },
}

export default function DeliveryPageContent() {
  const [deliveries, setDeliveries] = useState<Delivery[]>(mockDeliveries)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')

  const today = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const counts = {
    all: deliveries.length,
    pending: deliveries.filter(d => d.status === 'pending').length,
    in_transit: deliveries.filter(d => d.status === 'in_transit').length,
    delivered: deliveries.filter(d => d.status === 'delivered').length,
  }

  const filtered = filter === 'all' ? deliveries : deliveries.filter(d => d.status === filter)

  const updateStatus = (id: string, status: Delivery['status']) => {
    setDeliveries(prev => prev.map(d => d.id === id ? { ...d, status } : d))
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý giao hàng</h1>
        <p className="text-gray-500 mt-1">{today}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Tổng đơn</p>
          <p className="text-2xl font-bold text-gray-900">{counts.all}</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 shadow-sm border border-yellow-100">
          <p className="text-sm text-yellow-600">Chờ giao</p>
          <p className="text-2xl font-bold text-yellow-700">{counts.pending}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 shadow-sm border border-blue-100">
          <p className="text-sm text-blue-600">Đang giao</p>
          <p className="text-2xl font-bold text-blue-700">{counts.in_transit}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 shadow-sm border border-green-100">
          <p className="text-sm text-green-600">Hoàn thành</p>
          <p className="text-2xl font-bold text-green-700">{counts.delivered}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {[
          { key: 'all', label: 'Tất cả' },
          { key: 'pending', label: 'Chờ giao' },
          { key: 'in_transit', label: 'Đang giao' },
          { key: 'delivered', label: 'Đã giao' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === tab.key
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Delivery List */}
      <div className="space-y-3">
        {filtered.map(delivery => {
          const cfg = statusConfig[delivery.status]
          const StatusIcon = cfg.icon
          const isExpanded = expandedId === delivery.id

          return (
            <div key={delivery.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div
                className="p-4 cursor-pointer flex items-center justify-between"
                onClick={() => setExpandedId(isExpanded ? null : delivery.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Truck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{delivery.orderId}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
                        <StatusIcon className="inline w-3 h-3 mr-1" />
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{delivery.customer} · {delivery.items} sản phẩm</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-400 hidden sm:block">{delivery.time}</span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-gray-400 mt-0.5" />
                      <span className="text-gray-700">{delivery.customer}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <a href={`tel:${delivery.phone}`} className="text-emerald-600 hover:underline">{delivery.phone}</a>
                    </div>
                    <div className="flex items-start gap-2 sm:col-span-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{delivery.address}</span>
                    </div>
                    {delivery.notes && (
                      <div className="sm:col-span-2 bg-yellow-50 rounded-lg p-3 text-yellow-800 text-xs">
                        📝 {delivery.notes}
                      </div>
                    )}
                  </div>

                  {delivery.status !== 'delivered' && (
                    <div className="flex gap-2 mt-3">
                      {delivery.status === 'pending' && (
                        <button
                          onClick={() => updateStatus(delivery.id, 'in_transit')}
                          className="flex-1 bg-blue-600 text-white text-sm py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Bắt đầu giao
                        </button>
                      )}
                      {delivery.status === 'in_transit' && (
                        <>
                          <button
                            onClick={() => updateStatus(delivery.id, 'delivered')}
                            className="flex-1 bg-green-600 text-white text-sm py-2 rounded-lg hover:bg-green-700 transition-colors"
                          >
                            ✓ Giao thành công
                          </button>
                          <button
                            onClick={() => updateStatus(delivery.id, 'failed')}
                            className="flex-1 bg-red-100 text-red-700 text-sm py-2 rounded-lg hover:bg-red-200 transition-colors"
                          >
                            ✗ Giao thất bại
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Không có đơn hàng nào</p>
          </div>
        )}
      </div>
    </div>
  )
}
