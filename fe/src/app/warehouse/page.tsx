'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Package, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Eye, 
  Warehouse,
  BarChart3,
  ArrowRight,
  TrendingUp
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
    
    // For shelf monitoring (mock data)
    const refillNeeded = Math.floor(total * 0.25) // 25% need refill
    
    return {
      totalProducts: total,
      inStock,
      lowStock,
      outOfStock,
      totalQuantity,
      refillNeeded
    }
  }, [])

  // Get recent low stock items for alerts
  const recentLowStock = inventoryData
    .filter(item => item.status === 'low-stock')
    .slice(0, 5)

  // Get out of stock items for alerts
  const recentOutOfStock = inventoryData
    .filter(item => item.status === 'out-of-stock')
    .slice(0, 5)

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Warehouse Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of warehouse operations and inventory status</p>
      </div>

      {/* Main Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Products</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalProducts}</p>
              <p className="text-xs text-gray-500 mt-1">SKU count</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        {/* In Stock */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">In Stock</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.inStock}</p>
              <p className="text-xs text-gray-500 mt-1">Well stocked</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        {/* Low Stock */}
        <div 
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => router.push('/warehouse/inventory/overview?filter=low-stock')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Low Stock</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{stats.lowStock}</p>
              <p className="text-xs text-gray-500 mt-1">Needs attention</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="text-orange-600" size={24} />
            </div>
          </div>
        </div>

        {/* Out of Stock */}
        <div 
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => router.push('/warehouse/inventory/overview?filter=out-of-stock')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Out of Stock</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.outOfStock}</p>
              <p className="text-xs text-gray-500 mt-1">Urgent action</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="text-red-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Inventory Overview */}
        <div 
          className="bg-gradient-to-br from-[#2d6e3e] to-[#1f5b2e] rounded-xl shadow-sm p-6 text-white cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => router.push('/warehouse/inventory/overview')}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <BarChart3 className="mb-3" size={32} />
              <h3 className="text-lg font-bold mb-1">Inventory Overview</h3>
              <p className="text-sm text-white/80 mb-4">View all inventory metrics</p>
              <Button variant="outline" size="sm" className="bg-white/10 border-white/30 hover:bg-white/20 text-white">
                View Overview <ArrowRight size={16} className="ml-1" />
              </Button>
            </div>
          </div>
        </div>

        {/* Backroom Stock */}
        <div 
          className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-sm p-6 text-white cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => router.push('/warehouse/inventory/backroom')}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Warehouse className="mb-3" size={32} />
              <h3 className="text-lg font-bold mb-1">Backroom Stock</h3>
              <p className="text-sm text-white/80 mb-4">Manage warehouse inventory</p>
              <Button variant="outline" size="sm" className="bg-white/10 border-white/30 hover:bg-white/20 text-white">
                Manage Stock <ArrowRight size={16} className="ml-1" />
              </Button>
            </div>
          </div>
        </div>

        {/* Shelf Monitoring */}
        <div 
          className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl shadow-sm p-6 text-white cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => router.push('/warehouse/inventory/shelf')}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Eye className="mb-3" size={32} />
              <h3 className="text-lg font-bold mb-1">Shelf Monitoring</h3>
              <p className="text-sm text-white/80 mb-4">{stats.refillNeeded} shelves need refill</p>
              <Button variant="outline" size="sm" className="bg-white/10 border-white/30 hover:bg-white/20 text-white">
                Monitor Shelves <ArrowRight size={16} className="ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="text-orange-600" size={20} />
              Low Stock Alerts
            </h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/warehouse/inventory/overview?filter=low-stock')}
            >
              View All
            </Button>
          </div>
          
          <div className="space-y-3">
            {recentLowStock.length > 0 ? (
              recentLowStock.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600">{item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-orange-600">{item.quantity} {item.unit}</p>
                    <p className="text-xs text-gray-500">Low stock</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="mx-auto mb-2 text-green-500" size={32} />
                <p>No low stock items</p>
              </div>
            )}
          </div>
        </div>

        {/* Out of Stock Alerts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <XCircle className="text-red-600" size={20} />
              Out of Stock
            </h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/warehouse/inventory/overview?filter=out-of-stock')}
            >
              View All
            </Button>
          </div>
          
          <div className="space-y-3">
            {recentOutOfStock.length > 0 ? (
              recentOutOfStock.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600">{item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600">0 {item.unit}</p>
                    <p className="text-xs text-gray-500">Out of stock</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="mx-auto mb-2 text-green-500" size={32} />
                <p>All items in stock</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="text-green-600" size={20} />
          Inventory Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Total Stock Units</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalQuantity.toLocaleString()}</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Stock Health</p>
            <p className="text-2xl font-bold text-green-600">
              {Math.round((stats.inStock / stats.totalProducts) * 100)}%
            </p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Attention Needed</p>
            <p className="text-2xl font-bold text-orange-600">{stats.lowStock}</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Critical Items</p>
            <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
