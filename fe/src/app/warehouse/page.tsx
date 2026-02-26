'use client'

import { useState } from 'react'
import { Package, CheckCircle, AlertTriangle, XCircle, TrendingUp, TrendingDown } from 'lucide-react'
import { Button } from '@/shared/ui/Button'

// Mock data - trong thực tế sẽ fetch từ API
const statsData = {
  totalProducts: 245,
  inStock: 1830,
  lowStock: 12,
  outOfStock: 5
}

const inventoryItems = [
  { id: 1, name: 'Apple Fuji', sku: 'APL123', quantity: 150, status: 'in-stock' },
  { id: 2, name: 'Instant Noodles', sku: 'NDL456', quantity: 20, status: 'low-stock' },
  { id: 3, name: 'Fresh Milk 1L', sku: 'MLK789', quantity: 0, status: 'out-of-stock' },
  { id: 4, name: 'Bottled Water 500ml', sku: 'WTR555', quantity: 500, status: 'in-stock' },
  { id: 5, name: 'Cooking Oil 1L', sku: 'OIL678', quantity: 75, status: 'in-stock' }
]

const lowStockAlerts = [
  { name: 'Instant Noodles', quantity: 20 },
  { name: 'Sugar 1kg', quantity: 15 },
  { name: 'Eggs Pack', quantity: 8 }
]

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
  stockIn: { amount: 200, product: 'Fresh Milk' },
  stockOut: { amount: -50, product: 'Bottled Water' }
}

export default function WarehouseDashboard() {
  const [selectedTab, setSelectedTab] = useState<'in' | 'out'>('in')

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products */}
        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-100 text-sm font-medium mb-1">Total Products</p>
              <p className="text-4xl font-bold">{statsData.totalProducts}</p>
            </div>
            <Package size={48} className="opacity-80" />
          </div>
        </div>

        {/* In Stock Items */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium mb-1">In Stock Items</p>
              <p className="text-4xl font-bold">{statsData.inStock.toLocaleString()}</p>
            </div>
            <CheckCircle size={48} className="opacity-80" />
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium mb-1">Low Stock Items</p>
              <p className="text-4xl font-bold">{statsData.lowStock}</p>
            </div>
            <AlertTriangle size={48} className="opacity-80" />
          </div>
        </div>

        {/* Out of Stock */}
        <div className="bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-200 text-sm font-medium mb-1">Out of Stock</p>
              <p className="text-4xl font-bold">{statsData.outOfStock}</p>
            </div>
            <XCircle size={48} className="opacity-80" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Inventory List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Inventory List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Inventory List</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Product Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">SKU</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">Quantity</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryItems.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-800">{item.name}</td>
                      <td className="py-3 px-4 text-gray-600">{item.sku}</td>
                      <td className="py-3 px-4 text-center font-semibold text-gray-800">{item.quantity}</td>
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

            <div className="mt-4 flex gap-3">
              <Button className="bg-[#2d6e3e] hover:bg-[#25593] text-white">
                Stock In
              </Button>
              <Button variant="outline" className="border-[#2d6e3e] text-[#2d6e3e] hover:bg-[#2d6e3e]/5">
                Stock Out
              </Button>
            </div>
          </div>

          {/* Staff Attendance & Stock Movement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Staff Attendance */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Staff Attendance</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">Check-ins:</span>
                  <span className="font-bold text-gray-900 ml-auto">{staffData.checkIns}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">Check-outs:</span>
                  <span className="font-bold text-gray-900 ml-auto">{staffData.checkOuts}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-gray-700">Absent:</span>
                  <span className="font-bold text-gray-900 ml-auto">{staffData.absent}</span>
                </div>
              </div>
            </div>

            {/* Stock In / Stock Out */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Stock In / Stock Out</h3>
              
              <div className="flex gap-2 mb-4">
                <Button 
                  className={`flex-1 ${selectedTab === 'in' ? 'bg-[#2d6e3e]' : 'bg-gray-200 text-gray-700'}`}
                  onClick={() => setSelectedTab('in')}
                >
                  Record Stock In
                </Button>
                <Button 
                  className={`flex-1 ${selectedTab === 'out' ? 'bg-[#2d6e3e]' : 'bg-gray-200 text-gray-700'}`}
                  onClick={() => setSelectedTab('out')}
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
                    <span className="font-bold text-green-600">+{recentStock.stockIn.amount}</span>
                    <p className="text-xs text-gray-600">{recentStock.stockIn.product}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="text-red-600" size={20} />
                    <span className="text-sm text-gray-700">Yesterday Stock Out:</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-red-600">{recentStock.stockOut.amount}</span>
                    <p className="text-xs text-gray-600">{recentStock.stockOut.product}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Alerts & History */}
        <div className="space-y-6">
          {/* Low Stock Alerts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Low Stock Alerts</h3>
            <div className="space-y-3">
              {lowStockAlerts.map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-sm text-gray-800 font-medium">{alert.name}</span>
                  </div>
                  <span className="text-sm font-bold text-orange-600">{alert.quantity} Left</span>
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
