'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Package, 
  AlertTriangle, 
  Warehouse,
  ArrowRight,
  RefreshCw,
  Store,
  FileText
} from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { inventoryData } from '@/data/inventory-data'

export default function WarehouseDashboard() {
  const router = useRouter()

  // Calculate real-time statistics
  const stats = useMemo(() => {
    const total = inventoryData.length
    const inStock = inventoryData.filter(item => item.status === 'in-stock').length
    const lowStock = inventoryData.filter(item => item.status === 'low-stock').length
    const outOfStock = inventoryData.filter(item => item.status === 'out-of-stock').length
    const totalQuantity = inventoryData.reduce((sum, item) => sum + item.quantity, 0)
    
    // Mock data for pending requests
    const pendingRequests = 12
    const linkedWarehouses = 3
    const activeStores = 6
    
    return {
      totalProducts: total,
      inStock,
      lowStock,
      outOfStock,
      totalQuantity,
      pendingRequests,
      linkedWarehouses,
      activeStores
    }
  }, [])

  // Mock data for charts
  const weeklyData = [
    { day: 'T2', incoming: 320, outgoing: 280 },
    { day: 'T3', incoming: 450, outgoing: 380 },
    { day: 'T4', incoming: 280, outgoing: 420 },
    { day: 'T5', incoming: 520, outgoing: 490 },
    { day: 'T6', incoming: 380, outgoing: 540 },
    { day: 'T7', incoming: 280, outgoing: 620 }
  ]

  const maxValue = Math.max(...weeklyData.flatMap(d => [d.incoming, d.outgoing]))

  return (
    <div className="space-y-6 p-6 bg-gray-50">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tổng quan Dashboard</h1>
        <p className="text-gray-600 mt-1">Giám sát chuỗi cung ứng thời gian thực cho Kho trung tâm & Các trung tâm phân phối liên kết.</p>
      </div>

      {/* Main Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Package className="text-green-600" size={20} />
            </div>
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">+2.5%</span>
          </div>
          <p className="text-xs text-gray-600 font-medium uppercase mb-1">TỔNG SẢN PHẨM</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalProducts.toLocaleString()}</p>
        </div>

        {/* Low Stock Items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push('/warehouse/inventory/overview?filter=low-stock')}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
              <AlertTriangle className="text-red-600" size={20} />
            </div>
            <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded">-10%</span>
          </div>
          <p className="text-xs text-gray-600 font-medium uppercase mb-1">SẢN PHẨM TỒN KHO THẤP</p>
          <p className="text-3xl font-bold text-gray-900">{stats.lowStock}</p>
        </div>

        {/* Pending Requests */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <FileText className="text-orange-600" size={20} />
            </div>
            <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded">+5%</span>
          </div>
          <p className="text-xs text-gray-600 font-medium uppercase mb-1">YÊU CẦU CHỜ XỬ LÝ</p>
          <p className="text-3xl font-bold text-gray-900">{stats.pendingRequests}</p>
        </div>

        {/* Linked Warehouses */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Warehouse className="text-blue-600" size={20} />
            </div>
            <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-2 py-1 rounded">0%</span>
          </div>
          <p className="text-xs text-gray-600 font-medium uppercase mb-1">KHO LIÊN KẾT</p>
          <p className="text-3xl font-bold text-gray-900">{stats.linkedWarehouses}</p>
        </div>

        {/* Active Stores */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <Store className="text-purple-600" size={20} />
            </div>
            <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-2 py-1 rounded">0%</span>
          </div>
          <p className="text-xs text-gray-600 font-medium uppercase mb-1">CỬA HÀNG HOẠT ĐỘNG</p>
          <p className="text-3xl font-bold text-gray-900">{stats.activeStores}</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock Levels & Throughput - Takes 2 columns */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Mức độ tồn kho & Thông lượng</h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-gray-600">Nhập kho</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-200 rounded"></div>
                <span className="text-gray-600">Xuất kho</span>
              </div>
            </div>
          </div>
          
          {/* Bar Chart */}
          <div className="flex items-end justify-between h-64 gap-4">
            {weeklyData.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center gap-1 flex-1 justify-end">
                  {/* Outgoing (lighter) */}
                  <div 
                    className="w-full bg-green-200 rounded-t transition-all hover:bg-green-300"
                    style={{ height: `${(data.outgoing / maxValue) * 100}%` }}
                  ></div>
                  {/* Incoming (darker) */}
                  <div 
                    className="w-full bg-green-600 rounded-t transition-all hover:bg-green-700"
                    style={{ height: `${(data.incoming / maxValue) * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-600 font-medium uppercase">{data.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Warehouse Distribution - Takes 1 column */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Phân bổ kho hàng</h3>
          </div>
          
          <div className="space-y-4">
            {/* Warehouse 1 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">KHO 1 (THỰC PHẨM)</span>
                <span className="text-sm font-bold text-gray-900">85% CÔNG SUẤT</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>

            {/* Warehouse 2 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">KHO 2 (ĐỒ UỐNG)</span>
                <span className="text-sm font-bold text-gray-900">42% CÔNG SUẤT</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: '42%' }}></div>
              </div>
            </div>

            {/* Warehouse 3 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">KHO 3 (ĐỒ GIA DỤNG)</span>
                <span className="text-sm font-bold text-gray-900">68% CÔNG SUẤT</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '68%' }}></div>
              </div>
            </div>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-6"
            onClick={() => router.push('/warehouse/inventory/overview')}
          >
            Xem bản đồ mạng lưới <ArrowRight size={16} className="ml-1" />
          </Button>
        </div>
      </div>

      {/* Bottom Section: Inventory Highlights and Incoming Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Central Inventory Highlights */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Điểm nổi bật tồn kho</h3>
            <Button 
              variant="outline" 
              size="sm"
              className="text-green-600 hover:text-green-700"
            >
              Xem tất cả
            </Button>
          </div>
          
          {/* Table Header */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase py-3 px-2">SẢN PHẨM</th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase py-3 px-2">SKU</th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase py-3 px-2">SỐ LƯỢNG</th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase py-3 px-2">LÔ</th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase py-3 px-2">TRẠNG THÁI</th>
                </tr>
              </thead>
              <tbody>
                {inventoryData.slice(0, 3).map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <Package size={16} className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{item.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-600">{item.sku}</td>
                    <td className="py-3 px-2 text-sm font-semibold text-gray-900">{item.quantity}</td>
                    <td className="py-3 px-2 text-sm text-gray-600">B24-OCT</td>
                    <td className="py-3 px-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === 'in-stock' ? 'bg-green-100 text-green-700' :
                        item.status === 'low-stock' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {item.status === 'in-stock' ? 'CÒN HÀNG' : 
                         item.status === 'low-stock' ? 'TỒN KHO THẤP' : 'HẾT HÀNG'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Incoming Requests */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Yêu cầu đến</h3>
            <Button 
              variant="outline" 
              size="sm"
              className="text-green-600 hover:text-green-700"
            >
              Xem lại tất cả
            </Button>
          </div>
          
          <div className="space-y-3">
            {/* Request 1 */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Warehouse className="text-blue-600" size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs font-medium text-gray-500">ID</p>
                    <p className="text-sm font-semibold text-gray-900">#RQ-8821</p>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs font-medium text-gray-500">NGUỒN</p>
                    <p className="text-sm text-gray-900">Kho 2</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-gray-500">SẢN PHẨM</p>
                    <p className="text-sm text-gray-900">Coca Cola (200)</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                  CHỜ XỬ LÝ
                </span>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="p-2"
                >
                  <RefreshCw size={16} className="text-gray-600" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
