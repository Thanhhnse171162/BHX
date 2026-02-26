'use client'

import { AlertTriangle, Package, TrendingDown } from 'lucide-react'
import { Button } from '@/shared/ui/Button'

// Mock data
const lowStockItems = [
  { id: 1, name: 'Instant Noodles', sku: 'NDL456', quantity: 20, minQuantity: 50, category: 'Dry Goods', daysUntilReorder: 3 },
  { id: 2, name: 'Sugar 1kg', sku: 'SUG567', quantity: 15, minQuantity: 40, category: 'Cooking Essentials', daysUntilReorder: 2 },
  { id: 3, name: 'Eggs Pack', sku: 'EGG234', quantity: 8, minQuantity: 30, category: 'Dairy', daysUntilReorder: 1 },
  { id: 4, name: 'Tomato Sauce', sku: 'TOM789', quantity: 12, minQuantity: 35, category: 'Condiments', daysUntilReorder: 4 },
  { id: 5, name: 'Bread', sku: 'BRD456', quantity: 18, minQuantity: 50, category: 'Bakery', daysUntilReorder: 1 }
]

export default function LowStockPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Low Stock Alerts</h1>
          <p className="text-gray-600 mt-1">Monitor items that need to be restocked</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-[#2d6e3e] text-[#2d6e3e]">
            Settings
          </Button>
          <Button className="bg-[#2d6e3e] hover:bg-[#255931]">
            Generate Reorder List
          </Button>
        </div>
      </div>

      {/* Alert Banner */}
      <div className="bg-orange-50 border-l-4 border-orange-500 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="text-orange-600" size={24} />
          <div>
            <p className="font-semibold text-orange-800">
              {lowStockItems.length} items need attention
            </p>
            <p className="text-sm text-orange-700 mt-1">
              Some items are running low on stock. Please review and take action.
            </p>
          </div>
        </div>
      </div>

      {/* Low Stock Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {lowStockItems.map((item) => {
          const stockPercentage = (item.quantity / item.minQuantity) * 100
          const isUrgent = item.daysUntilReorder <= 2

          return (
            <div 
              key={item.id} 
              className={`bg-white rounded-xl shadow-sm border-2 ${isUrgent ? 'border-red-300' : 'border-orange-200'} p-6 relative overflow-hidden`}
            >
              {isUrgent && (
                <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  URGENT
                </div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg">{item.name}</h3>
                  <p className="text-sm text-gray-500">{item.sku}</p>
                  <p className="text-xs text-gray-400 mt-1">{item.category}</p>
                </div>
                <Package className="text-gray-400" size={32} />
              </div>

              {/* Stock Level */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Current Stock</span>
                  <span className="font-bold text-orange-600">{item.quantity} units</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      stockPercentage <= 30 ? 'bg-red-500' : 'bg-orange-500'
                    }`}
                    style={{ width: `${Math.max(stockPercentage, 5)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500">Min: {item.minQuantity}</span>
                  <span className="text-xs font-medium text-orange-600">{stockPercentage.toFixed(0)}%</span>
                </div>
              </div>

              {/* Reorder Info */}
              <div className={`p-3 rounded-lg mb-4 ${isUrgent ? 'bg-red-50' : 'bg-orange-50'}`}>
                <div className="flex items-center gap-2">
                  <TrendingDown className={isUrgent ? 'text-red-600' : 'text-orange-600'} size={18} />
                  <span className={`text-sm font-medium ${isUrgent ? 'text-red-800' : 'text-orange-800'}`}>
                    Reorder in {item.daysUntilReorder} {item.daysUntilReorder === 1 ? 'day' : 'days'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  className={`flex-1 ${isUrgent ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'}`}
                >
                  Reorder Now
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="flex-1 border-gray-300"
                >
                  View Details
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Alerts</p>
              <p className="text-3xl font-bold text-orange-600">{lowStockItems.length}</p>
            </div>
            <AlertTriangle className="text-orange-400" size={40} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Urgent Items</p>
              <p className="text-3xl font-bold text-red-600">
                {lowStockItems.filter(i => i.daysUntilReorder <= 2).length}
              </p>
            </div>
            <AlertTriangle className="text-red-400 animate-pulse" size={40} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Avg. Days to Reorder</p>
              <p className="text-3xl font-bold text-gray-900">
                {(lowStockItems.reduce((sum, i) => sum + i.daysUntilReorder, 0) / lowStockItems.length).toFixed(1)}
              </p>
            </div>
            <TrendingDown className="text-gray-400" size={40} />
          </div>
        </div>
      </div>
    </div>
  )
}
