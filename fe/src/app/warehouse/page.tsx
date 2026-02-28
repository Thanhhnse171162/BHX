'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Package, CheckCircle, AlertTriangle, XCircle, TrendingUp, TrendingDown } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { inventoryData, getLowStockItems, getOutOfStockItems } from '@/data/inventory-data'

// Use first 5 items from shared inventory data for dashboard preview
const inventoryItems = inventoryData.slice(0, 5)

// Get low stock and out of stock items from shared data (only first 5 for dashboard)
const lowStockAlerts = getLowStockItems().slice(0, 5).map(item => ({
  name: item.name,
  quantity: item.quantity,
  unit: item.unit
}))

const outOfStockItems = getOutOfStockItems().slice(0, 5).map(item => ({
  name: item.name,
  sku: item.sku,
  unit: item.unit
}))

const inventoryChecks = [
  { date: '10/04/2024', status: 'Completed' },
  { date: '05/04/2024', status: 'Completed' },
  { date: '30/03/2024', status: 'Completed' }
]

const staffData = {
  checkIns: 12,
  checkOuts: 12,
  absent: 1
}

const recentStock = {
  stockIn: { amount: 200, product: 'Fresh Milk', unit: 'liters' },
  stockOut: { amount: -50, product: 'Bottled Water', unit: 'bottles' }
}

export default function WarehouseDashboard() {
  const router = useRouter()
  const [selectedTab, setSelectedTab] = useState<'in' | 'out'>('in')

  // Tính toán statistics động dựa trên inventoryItems
  const statsData = useMemo(() => {
    // Giả sử có 245 sản phẩm trong hệ thống (mở rộng từ 5 items mock hiện tại)
    const totalProducts = 245
    
    // Từ 5 mock items, tính tỷ lệ cho 245 sản phẩm
    // In Stock = sản phẩm có quantity > 0 (BAO GỒM cả low stock)
    const mockInStock = inventoryItems.filter(item => item.quantity > 0).length // 4/5
    const mockOutOfStock = inventoryItems.filter(item => item.quantity === 0).length // 1/5
    const mockLowStock = inventoryItems.filter(item => item.status === 'low-stock').length // 1/5
    
    // Scale lên 245 sản phẩm với tỷ lệ tương tự
    const scaledInStock = Math.round((mockInStock / 5) * totalProducts) // (4/5) * 245 = 196
    const scaledOutOfStock = totalProducts - scaledInStock // 245 - 196 = 49
    const scaledLowStock = Math.round((mockLowStock / 5) * totalProducts) // (1/5) * 245 = 49

    return {
      totalProducts,
      inStockCount: scaledInStock,      // 196 (bao gồm cả low stock)
      lowStockCount: scaledLowStock,     // 49 (subset của inStock)
      outOfStockCount: scaledOutOfStock, // 49
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products */}
        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-100 text-sm font-medium mb-1">Total Products</p>
              <p className="text-xs text-teal-100 mb-2">Tổng số loại sản phẩm (SKU)</p>
              <p className="text-4xl font-bold">{statsData.totalProducts}</p>
            </div>
            <Package size={48} className="opacity-80" />
          </div>
        </div>

        {/* Products In Stock */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium mb-1">Products In Stock</p>
              <p className="text-xs text-green-100 mb-2">Số loại còn hàng (bao gồm sắp hết)</p>
              <p className="text-4xl font-bold">{statsData.inStockCount}</p>
            </div>
            <CheckCircle size={48} className="opacity-80" />
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium mb-1">Low Stock Alerts</p>
              <p className="text-xs text-orange-100 mb-2">Số loại sắp hết (trong {statsData.inStockCount} loại còn hàng)</p>
              <p className="text-4xl font-bold">{statsData.lowStockCount}</p>
            </div>
            <AlertTriangle size={48} className="opacity-80" />
          </div>
        </div>

        {/* Out of Stock */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium mb-1">Out of Stock</p>
              <p className="text-xs text-red-100 mb-2">Số loại hết hàng hoàn toàn</p>
              <p className="text-4xl font-bold">{statsData.outOfStockCount}</p>
            </div>
            <XCircle size={48} className="opacity-80" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Inventory List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Inventory */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Recent Inventory</h2>
                <p className="text-sm text-gray-500 mt-1">Hiển thị 5 sản phẩm gần đây nhất</p>
              </div>
              <Button 
                variant="outline" 
                className="border-[#2d6e3e] text-[#2d6e3e] hover:bg-[#2d6e3e]/5"
                onClick={() => router.push('/warehouse/inventory')}
              >
                View All Inventory →
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Product Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">SKU</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">Quantity</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">Unit</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryItems.slice(0, 5).map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-800">{item.name}</td>
                      <td className="py-3 px-4 text-gray-600">{item.sku}</td>
                      <td className="py-3 px-4 text-center font-semibold text-gray-800">{item.quantity}</td>
                      <td className="py-3 px-4 text-center text-gray-600">{item.unit}</td>
                      <td className="py-3 px-4 text-center">
                        {item.status === 'in-stock' && (
                          <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                            In Stock
                          </span>
                        )}
                        {item.status === 'low-stock' && (
                          <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                            Low Stock
                          </span>
                        )}
                        {item.status === 'out-of-stock' && (
                          <span className="inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                            Out of Stock
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stock In / Stock Out */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Stock In / Stock Out</h3>
              
              <div className="flex gap-2 mb-4">
                <Button 
                  className={`flex-1 ${selectedTab === 'in' ? 'bg-[#2d6e3e]' : 'bg-gray-200 text-gray-700'}`}
                  onClick={() => router.push('/warehouse/stock-movement')}
                >
                  Record Stock In
                </Button>
                <Button 
                  className={`flex-1 ${selectedTab === 'out' ? 'bg-[#2d6e3e]' : 'bg-gray-200 text-gray-700'}`}
                  onClick={() => router.push('/warehouse/stock-movement')}
                >
                  Record Stock Out
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="text-green-600" size={20} />
                    <span className="text-sm text-gray-700">Today Stock In:</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-green-600">+{recentStock.stockIn.amount} {recentStock.stockIn.unit}</span>
                    <p className="text-xs text-gray-600">{recentStock.stockIn.product}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="text-red-600" size={20} />
                    <span className="text-sm text-gray-700">Yesterday Stock Out:</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-red-600">{recentStock.stockOut.amount} {recentStock.stockOut.unit}</span>
                    <p className="text-xs text-gray-600">{recentStock.stockOut.product}</p>
                  </div>
                </div>
              </div>
            </div>
        </div>

        {/* Sidebar - Alerts & History */}
        <div className="space-y-6">
          {/* Low Stock Alerts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Low Stock Alerts</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push('/warehouse/low-stock')}
                className="text-orange-600 border-orange-200 hover:bg-orange-50"
              >
                View All
              </Button>
            </div>
            <div className="space-y-3">
              {lowStockAlerts.map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-sm text-gray-800 font-medium">{alert.name}</span>
                  </div>
                  <span className="text-sm font-bold text-orange-600">{alert.quantity} {alert.unit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Out of Stock Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Out of Stock</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push('/warehouse/out-of-stock')}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                View All
              </Button>
            </div>
            <div className="space-y-3">
              {outOfStockItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-gray-800 font-medium">{item.name}</span>
                    </div>
                    <span className="text-xs text-gray-500 ml-4">{item.sku}</span>
                  </div>
                  <span className="text-sm font-bold text-red-600">0 {item.unit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Inventory Check History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Inventory Check History</h3>
            <div className="space-y-3">
              {inventoryChecks.map((check, index) => (
                <div key={index} className="flex items-center justify-between p-3 border-l-4 border-green-500 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-sm text-gray-700">{check.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-green-600">{check.status}</span>
                    <CheckCircle size={16} className="text-green-600" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
