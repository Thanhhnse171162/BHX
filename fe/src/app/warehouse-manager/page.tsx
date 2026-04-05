'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/shared/hooks/useAuth'
import { InventoryAPIService } from '@/services/inventory-api.service'
import { StockMovementAPIService } from '@/services/stock-movement-api.service'
import { TransferAPIService } from '@/services/transfer-api.service'
import { RestockAPIService } from '@/services/restock-api.service'
import {
  Package,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  ArrowRight,
  Clock,
} from 'lucide-react'

export default function WarehouseManagerDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [inventory, setInventory] = useState<any[]>([])
  const [stockMovements, setStockMovements] = useState<any[]>([])
  const [transfers, setTransfers] = useState<any[]>([])
  const [restockRequests, setRestockRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!user?.workplaceId) return

    try {
      setLoading(true)
      const [inventoryData, transfersData, restockData] = await Promise.all([
        InventoryAPIService.getInventoryByWarehouse(user.workplaceId),
        TransferAPIService.getTransfers(),
        RestockAPIService.getByWarehouse(user.workplaceId)
      ])

      setInventory(inventoryData)
      
      // Get stock movements if workplaceId exists
      try {
        const movementsData = await StockMovementAPIService.getByLocation(user.workplaceId)
        setStockMovements(movementsData)
      } catch (error) {
        console.error('Error fetching stock movements:', error)
        setStockMovements([])
      }

      setTransfers(transfersData)
      setRestockRequests(restockData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.workplaceId])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

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
  ]

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
          onClick={fetchData}
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
      <div className="space-y-6">
        {/* Top Section - 2 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Stock Exports */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Lịch sử xuất kho gần đây</h2>
                <p className="text-sm text-gray-600 mt-1">5 lần xuất kho mới nhất</p>
              </div>
              <button
                onClick={() => router.push('/warehouse-manager/inventory')}
                className="flex items-center gap-2 px-3 py-2 text-[#2d6e3e] hover:bg-emerald-50 rounded-lg transition-colors text-sm font-medium"
              >
                Xem tất cả
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {stockMovements.slice(0, 5).length > 0 ? (
                stockMovements.slice(0, 5).map((movement: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                        <p className="font-medium text-gray-900">{movement.movementNumber}</p>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {movement.totalItems} mặt hàng • {new Date(movement.movementDate).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      movement.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700'
                      : movement.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-blue-100 text-blue-700'
                    }`}>
                      {movement.status === 'COMPLETED' ? 'Hoàn thành'
                      : movement.status === 'PENDING' ? 'Chờ xử lý'
                      : 'Đang xử lý'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  Chưa có lịch sử xuất kho
                </div>
              )}
            </div>
          </div>

          {/* Recent Transfers */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Dự chuyển hàng gần đây</h2>
                <p className="text-sm text-gray-600 mt-1">5 lần di chuyển hàng mới nhất</p>
              </div>
              <button
                onClick={() => router.push('/warehouse-manager/transfers')}
                className="flex items-center gap-2 px-3 py-2 text-[#2d6e3e] hover:bg-emerald-50 rounded-lg transition-colors text-sm font-medium"
              >
                Xem tất cả
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {transfers.slice(0, 5).length > 0 ? (
                transfers.slice(0, 5).map((transfer: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-blue-600" />
                        <p className="font-medium text-gray-900">{transfer.transferNumber}</p>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {transfer.items?.length || 0} mặt hàng • {new Date(transfer.transferDate).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      transfer.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700'
                      : transfer.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700'
                      : transfer.status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                    }`}>
                      {transfer.status === 'COMPLETED' ? 'Hoàn thành'
                      : transfer.status === 'PENDING' ? 'Chờ gửi'
                      : transfer.status === 'IN_TRANSIT' ? 'Đang vận chuyển'
                      : transfer.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  Chưa có dự chuyển hàng
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Store Requests - Full Width */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Yêu cầu từ cửa hàng gần đây</h2>
              <p className="text-sm text-gray-600 mt-1">5 yêu cầu cấp hàng mới nhất</p>
            </div>
            <button
              onClick={() => router.push('/warehouse-manager/replenishment-admin')}
              className="flex items-center gap-2 px-3 py-2 text-[#2d6e3e] hover:bg-emerald-50 rounded-lg transition-colors text-sm font-medium"
            >
              Xem tất cả
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {restockRequests.slice(0, 5).length > 0 ? (
              restockRequests.slice(0, 5).map((request: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                      <p className="font-medium text-gray-900">{request.requestNumber}</p>
                      {request.priority === 'URGENT' && (
                        <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded font-semibold">
                          KHẨN
                        </span>
                      )}
                      {request.priority === 'HIGH' && (
                        <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded font-semibold">
                          CAO
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {request.items?.length || 0} mặt hàng • {new Date(request.requestedDate).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    request.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700'
                    : request.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700'
                    : request.status === 'REJECTED' ? 'bg-red-100 text-red-700'
                    : request.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                  }`}>
                    {request.status === 'APPROVED' ? 'Đã phê duyệt'
                    : request.status === 'PENDING' ? 'Chờ phê duyệt'
                    : request.status === 'REJECTED' ? 'Từ chối'
                    : request.status === 'COMPLETED' ? 'Hoàn thành'
                    : request.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                Chưa có yêu cầu từ cửa hàng
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
