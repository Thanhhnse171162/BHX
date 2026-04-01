'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/shared/hooks/useAuth'
import { InventoryAPIService } from '@/services/inventory-api.service'
import {
  Package,
  AlertTriangle,
  RefreshCw,
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
      </div>
    </div>
  )
}
