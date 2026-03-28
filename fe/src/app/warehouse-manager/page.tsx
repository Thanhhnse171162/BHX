'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/shared/hooks/useAuth'
import { InventoryAPIService } from '@/services/inventory-api.service'
import {
  Package,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Clock,
} from 'lucide-react'

export default function WarehouseManagerDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [inventory, setInventory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch inventory data
  const fetchInventory = useCallback(async () => {
    if (!user?.workplaceId) return

    try {
      setLoading(true)
      const data = await InventoryAPIService.getInventoryByWarehouse(user.workplaceId)
      setInventory(data)
    } catch (error) {
      console.error('Error fetching inventory:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.workplaceId])

  useEffect(() => {
    void fetchInventory()
  }, [fetchInventory])

  // Calculate metrics from real data
  const totalProducts = inventory.length
  const totalStock = inventory.reduce((sum, item) => sum + item.quantity, 0)
  const lowStockItems = inventory.filter(item => item.isLowStock).length

  const metrics = [
    {
      label: 'Tổng sản phẩm',
      value: totalProducts.toString(),
      change: '+2.5%',
      trend: 'up',
      icon: Package,
      color: 'emerald',
      onClick: () => router.push('/warehouse-manager/inventory'),
    },
    {
      label: 'Tổng hàng tồn kho',
      value: totalStock >= 1000 ? `${(totalStock / 1000).toFixed(1)}k` : totalStock.toString(),
      change: '+2%',
      trend: 'up',
      icon: Package,
      color: 'blue',
      onClick: () => router.push('/warehouse-manager/inventory'),
    },
    {
      label: 'Sản phẩm sắp hết',
      value: lowStockItems.toString(),
      change: lowStockItems > 0 ? 'Nghiêm trọng' : 'Bình thường',
      trend: lowStockItems > 0 ? 'down' : 'up',
      icon: AlertTriangle,
      color: 'red',
      onClick: () => router.push('/warehouse-manager/inventory'),
    },
    {
      label: 'Yêu cầu bổ sung',
      value: '18',
      change: 'Đang chờ',
      trend: 'neutral',
      icon: RefreshCw,
      color: 'orange',
      onClick: () => router.push('/warehouse-manager/shipments'),
    },
    {
      label: 'Chuyển kho',
      value: '7',
      change: 'Đang xử lý',
      trend: 'neutral',
      icon: ArrowRight,
      color: 'purple',
      onClick: () => router.push('/warehouse-manager/transfers'),
    },
  ]

  const pendingRefills = [
    {
      id: 'Cửa hàng #44-Trung tâm',
      items: '12 SKUs - Điện tử, Văn phòng',
      status: 'urgent',
      urgency: 'KHẨN CẤP',
    },
    {
      id: 'Cửa hàng #12-Trung tâm thương mại Bắc',
      items: '42 SKUs - Thời trang, Phụ kiện',
      status: 'routine',
      urgency: 'THƯỜNG XUYÊN',
    },
  ]

  const transferRequests = [
    {
      id: 'KH-2 Đông đến KH-1',
      description: 'Yêu cầu: Hôm nay 16:00',
      item: 'Pallet lưu trữ số lượng lớn x120',
      status: 'in-transit',
    },
    {
      id: 'KH-1 đến KH-4 Ven biển',
      description: 'Yêu cầu: 2 ngày trước',
      item: 'Hàng mùa đông (+650 đơn vị)',
      status: 'action-required',
    },
  ]

  const dailyMovementData = [
    { day: 'T2', inbound: 210, outbound: 180 },
    { day: 'T3', inbound: 260, outbound: 220 },
    { day: 'T4', inbound: 190, outbound: 240 },
    { day: 'T5', inbound: 340, outbound: 280 },
    { day: 'T6', inbound: 310, outbound: 380 },
    { day: 'T7', inbound: 240, outbound: 320 },
    { day: 'CN', inbound: 280, outbound: 180 },
  ]

  const maxValue = Math.max(
    ...dailyMovementData.flatMap((d) => [d.inbound, d.outbound])
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2d6e3e]"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tổng quan vận hành</h1>
          <p className="text-gray-600 mt-1">Trạng thái thời gian thực cho phân phối khu vực</p>
        </div>
        <button
          onClick={fetchInventory}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#2d6e3e] text-white rounded-lg hover:bg-[#1e4d2b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <div
              key={index}
              onClick={metric.onClick}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    metric.color === 'emerald'
                      ? 'bg-emerald-50'
                      : metric.color === 'blue'
                      ? 'bg-blue-50'
                      : metric.color === 'red'
                      ? 'bg-red-50'
                      : metric.color === 'orange'
                      ? 'bg-orange-50'
                      : 'bg-purple-50'
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 ${
                      metric.color === 'emerald'
                        ? 'text-emerald-600'
                        : metric.color === 'blue'
                        ? 'text-blue-600'
                        : metric.color === 'red'
                        ? 'text-red-600'
                        : metric.color === 'orange'
                        ? 'text-orange-600'
                        : 'text-purple-600'
                    }`}
                  />
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded ${
                    metric.trend === 'up'
                      ? 'text-emerald-700 bg-emerald-50'
                      : metric.trend === 'down'
                      ? 'text-red-700 bg-red-50'
                      : 'text-gray-700 bg-gray-100'
                  }`}
                >
                  {metric.change}
                </span>
              </div>
              <div className="text-sm font-medium text-gray-500 mb-1">
                {metric.label}
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {metric.value}
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6">
        {/* Daily Stock Movement Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">
              Biến động hàng tồn kho hàng ngày
            </h2>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#ff6b35] rounded"></div>
                <span className="text-gray-600">Nhập kho</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-300 rounded"></div>
                <span className="text-gray-600">Xuất kho</span>
              </div>
            </div>
          </div>
          <div className="h-64 flex items-end justify-between gap-2">
            {dailyMovementData.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end justify-center gap-1 flex-1">
                  <div
                    className="w-full bg-[#ff6b35] rounded-t transition-all hover:opacity-80"
                    style={{
                      height: `${(data.inbound / maxValue) * 100}%`,
                      minHeight: '8px',
                    }}
                    title={`Nhập kho: ${data.inbound}`}
                  ></div>
                  <div
                    className="w-full bg-gray-300 rounded-t transition-all hover:opacity-80"
                    style={{
                      height: `${(data.outbound / maxValue) * 100}%`,
                      minHeight: '8px',
                    }}
                    title={`Xuất kho: ${data.outbound}`}
                  ></div>
                </div>
                <span className="text-xs font-medium text-gray-600">
                  {data.day}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Store Refills */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              Yêu cầu bổ sung cửa hàng đang chờ
            </h2>
            <button 
              onClick={() => router.push('/warehouse-manager/shipments')}
              className="text-sm font-medium text-[#2d6e3e] hover:underline"
            >
              Xem tất cả
            </button>
          </div>
          <div className="space-y-4">
            {pendingRefills.map((refill, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{refill.id}</h3>
                    <p className="text-sm text-gray-600 mt-1">{refill.items}</p>
                  </div>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded ${
                      refill.status === 'urgent'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {refill.urgency}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex-1 px-4 py-2 bg-[#ff6b35] text-white text-sm font-medium rounded-lg hover:bg-[#e55a2a] transition-colors">
                    Phê duyệt
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                    Chi tiết
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transfer Requests */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Yêu cầu chuyển kho</h2>
            <button 
              onClick={() => router.push('/warehouse-manager/transfers')}
              className="text-sm font-medium text-[#2d6e3e] hover:underline"
            >
              Xem tất cả
            </button>
          </div>
          <div className="space-y-4">
            {transferRequests.map((transfer, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      transfer.status === 'in-transit'
                        ? 'bg-blue-50'
                        : 'bg-orange-50'
                    }`}
                  >
                    {transfer.status === 'in-transit' ? (
                      <ArrowRight className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-orange-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{transfer.id}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {transfer.description}
                    </p>
                    <p className="text-sm text-gray-700 mt-2">{transfer.item}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {transfer.status === 'in-transit' ? (
                    <span className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 text-sm font-medium text-center rounded-lg">
                      Đang vận chuyển
                    </span>
                  ) : (
                    <>
                      <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
                        Chấp nhận
                      </button>
                      <button className="flex-1 px-4 py-2 bg-[#ff6b35] text-white text-sm font-medium rounded-lg hover:bg-[#e55a2a] transition-colors">
                        Cần xử lý
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
