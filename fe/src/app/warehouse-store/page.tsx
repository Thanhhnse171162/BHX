'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Package, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  TruckIcon,
  ArrowRightLeft,
  TrendingUp,
  Store
} from 'lucide-react'
import { Button } from '@/shared/ui/Button'

export default function StoreWarehouseDashboard() {
  const router = useRouter()

  // Mock statistics for store warehouse
  const stats = useMemo(() => {
    return {
      totalProducts: 450,
      inStorage: 280,
      onShelf: 170,
      lowStock: 35,
      outOfStock: 8,
      pendingFromCentral: 12, // Hàng chờ nhận từ kho tổng
      waitingForShelf: 25, // Hàng đang chờ xuất ra quầy
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Store Warehouse Dashboard</h1>
          <p className="text-gray-600 mt-1">Tổng quan kho cửa hàng</p>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Store className="w-5 h-5" />
          <span className="font-medium">Store #001</span>
        </div>
      </div>

      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Products at Store */}
        <div className="bg-gradient-to-br from-[#2d6e3e] to-green-700 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Tổng sản phẩm</p>
              <h3 className="text-3xl font-bold mt-2">{stats.totalProducts}</h3>
              <p className="text-green-100 text-xs mt-1">Tại cửa hàng</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <Package className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* In Storage */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Hàng trong kho</p>
              <h3 className="text-3xl font-bold mt-2">{stats.inStorage}</h3>
              <p className="text-green-100 text-xs mt-1">Còn trong kho sau cửa hàng</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* On Shelf */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Hàng trên quầy</p>
              <h3 className="text-3xl font-bold mt-2">{stats.onShelf}</h3>
              <p className="text-purple-100 text-xs mt-1">Đang bán tại quầy</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <Store className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Sắp hết hàng</p>
              <h3 className="text-3xl font-bold mt-2">{stats.lowStock}</h3>
              <p className="text-orange-100 text-xs mt-1">Cần nhập thêm</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Store-Specific Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Out of Stock */}
        <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-gray-600 text-sm font-medium">Hết hàng</p>
              <h3 className="text-2xl font-bold text-red-600 mt-2">{stats.outOfStock}</h3>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 text-red-600 border-red-600 hover:bg-red-50"
                onClick={() => router.push('/warehouse-store/out-of-stock')}
              >
                Xem chi tiết
              </Button>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        {/* Pending from Central */}
        <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-gray-600 text-sm font-medium">Chờ nhận từ kho tổng</p>
              <h3 className="text-2xl font-bold text-green-600 mt-2">{stats.pendingFromCentral}</h3>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 text-green-600 border-green-600 hover:bg-green-50"
                onClick={() => router.push('/warehouse-store/receive-goods')}
              >
                Xem phiếu chuyển
              </Button>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <TruckIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Waiting for Shelf */}
        <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-gray-600 text-sm font-medium">Chờ xuất ra quầy</p>
              <h3 className="text-2xl font-bold text-purple-600 mt-2">{stats.waitingForShelf}</h3>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 text-purple-600 border-purple-600 hover:bg-purple-50"
                onClick={() => router.push('/warehouse-store/transfer-to-shelf')}
              >
                Xuất hàng
              </Button>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <ArrowRightLeft className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Thao tác nhanh</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button
            variant="outline"
            className="justify-start h-auto py-4"
            onClick={() => router.push('/warehouse-store/receive-goods')}
          >
            <TruckIcon className="w-5 h-5 mr-2" />
            <span>Nhận hàng từ kho tổng</span>
          </Button>
          <Button
            variant="outline"
            className="justify-start h-auto py-4"
            onClick={() => router.push('/warehouse-store/transfer-to-shelf')}
          >
            <ArrowRightLeft className="w-5 h-5 mr-2" />
            <span>Xuất hàng ra quầy</span>
          </Button>
          <Button
            variant="outline"
            className="justify-start h-auto py-4"
            onClick={() => router.push('/warehouse-store/restock-request')}
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            <span>Yêu cầu nhập hàng</span>
          </Button>
          <Button
            variant="outline"
            className="justify-start h-auto py-4"
            onClick={() => router.push('/warehouse-store/inventory-check')}
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            <span>Kiểm kê kho</span>
          </Button>
        </div>
      </div>

      {/* Recent Activities (Optional) */}
      <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Hoạt động gần đây</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <TruckIcon className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Nhận hàng từ kho tổng</p>
                <p className="text-xs text-gray-500">Phiếu #WH-2026-001 - 50 sản phẩm</p>
              </div>
            </div>
            <span className="text-xs text-gray-400">2 giờ trước</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <ArrowRightLeft className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Xuất hàng ra quầy</p>
                <p className="text-xs text-gray-500">30 sản phẩm từ kho ra quầy bán</p>
              </div>
            </div>
            <span className="text-xs text-gray-400">4 giờ trước</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Kiểm kê định kỳ</p>
                <p className="text-xs text-gray-500">Hoàn thành kiểm kê 120 sản phẩm</p>
              </div>
            </div>
            <span className="text-xs text-gray-400">Hôm qua</span>
          </div>
        </div>
      </div>
    </div>
  )
}
