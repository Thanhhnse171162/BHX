'use client'

import { useState } from 'react'
import { ArrowDownUp, TrendingUp, TrendingDown } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'

// Mock data
const stockMovements = [
  { 
    id: 1, 
    type: 'in', 
    product: 'Fresh Milk 1L', 
    sku: 'MLK789',
    quantity: 200, 
    date: '2024-02-26', 
    time: '10:30',
    reason: 'Supplier Delivery',
    staff: 'Nguyen Van A',
    notes: 'Morning delivery from supplier ABC'
  },
  { 
    id: 2, 
    type: 'out', 
    product: 'Bottled Water 500ml', 
    sku: 'WTR555',
    quantity: 50, 
    date: '2024-02-25', 
    time: '14:20',
    reason: 'Store Transfer',
    staff: 'Tran Thi B',
    notes: 'Transfer to Store Branch 01'
  },
  { 
    id: 3, 
    type: 'in', 
    product: 'Cooking Oil 1L', 
    sku: 'OIL678',
    quantity: 100, 
    date: '2024-02-25', 
    time: '09:15',
    reason: 'Supplier Delivery',
    staff: 'Le Van C',
    notes: 'Regular weekly delivery'
  },
  { 
    id: 4, 
    type: 'out', 
    product: 'Apple Fuji', 
    sku: 'APL123',
    quantity: 30, 
    date: '2024-02-24', 
    time: '16:45',
    reason: 'Damaged Items',
    staff: 'Pham Thi D',
    notes: 'Items damaged during storage'
  },
  { 
    id: 5, 
    type: 'in', 
    product: 'Rice 5kg', 
    sku: 'RIC901',
    quantity: 150, 
    date: '2024-02-24', 
    time: '11:00',
    reason: 'Purchase Order',
    staff: 'Nguyen Van A',
    notes: 'New stock arrival'
  }
]

export default function StockMovementPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'in' | 'out'>('all')
  const [showForm, setShowForm] = useState(false)
  const [movementType, setMovementType] = useState<'in' | 'out'>('in')

  const filteredMovements = activeTab === 'all' 
    ? stockMovements 
    : stockMovements.filter(m => m.type === activeTab)

  const totalIn = stockMovements.filter(m => m.type === 'in').reduce((sum, m) => sum + m.quantity, 0)
  const totalOut = stockMovements.filter(m => m.type === 'out').reduce((sum, m) => sum + m.quantity, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock In / Stock Out</h1>
          <p className="text-gray-600 mt-1">Record and track inventory movements</p>
        </div>
        <div className="flex gap-3">
          <Button 
            className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
            onClick={() => {
              setMovementType('in')
              setShowForm(true)
            }}
          >
            <TrendingUp size={18} />
            Record Stock In
          </Button>
          <Button 
            className="bg-red-600 hover:bg-red-700 flex items-center gap-2"
            onClick={() => {
              setMovementType('out')
              setShowForm(true)
            }}
          >
            <TrendingDown size={18} />
            Record Stock Out
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Stock In (Today)</p>
              <p className="text-3xl font-bold text-green-600">+{totalIn}</p>
            </div>
            <TrendingUp className="text-green-500" size={36} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Stock Out (Today)</p>
              <p className="text-3xl font-bold text-red-600">-{totalOut}</p>
            </div>
            <TrendingDown className="text-red-500" size={36} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Net Movement</p>
              <p className={`text-3xl font-bold ${totalIn - totalOut >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalIn - totalOut >= 0 ? '+' : ''}{totalIn - totalOut}
              </p>
            </div>
            <ArrowDownUp className="text-gray-500" size={36} />
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-300 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              Record Stock {movementType === 'in' ? 'In' : 'Out'}
            </h3>
            <button 
              onClick={() => setShowForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product SKU</label>
              <Input placeholder="Enter SKU..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
              <Input type="number" placeholder="Enter quantity..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d6e3e]">
                {movementType === 'in' ? (
                  <>
                    <option>Supplier Delivery</option>
                    <option>Purchase Order</option>
                    <option>Return from Store</option>
                    <option>Other</option>
                  </>
                ) : (
                  <>
                    <option>Store Transfer</option>
                    <option>Customer Order</option>
                    <option>Damaged Items</option>
                    <option>Expired Items</option>
                    <option>Other</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Staff Name</label>
              <Input placeholder="Your name..." defaultValue="Nguyen Van A" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d6e3e]"
                rows={3}
                placeholder="Additional notes..."
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button 
              className={`flex-1 ${movementType === 'in' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              Record {movementType === 'in' ? 'Stock In' : 'Stock Out'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowForm(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              activeTab === 'all' 
                ? 'bg-[#2d6e3e] text-white' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            All Movements
          </button>
          <button
            onClick={() => setActiveTab('in')}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              activeTab === 'in' 
                ? 'bg-green-600 text-white' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Stock In
          </button>
          <button
            onClick={() => setActiveTab('out')}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              activeTab === 'out' 
                ? 'bg-red-600 text-white' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Stock Out
          </button>
        </div>

        {/* Movement History */}
        <div className="divide-y divide-gray-200">
          {filteredMovements.map((movement) => (
            <div key={movement.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-3 rounded-lg ${
                    movement.type === 'in' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {movement.type === 'in' ? (
                      <TrendingUp className={movement.type === 'in' ? 'text-green-600' : 'text-red-600'} size={24} />
                    ) : (
                      <TrendingDown className="text-red-600" size={24} />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-bold text-gray-900 text-lg">{movement.product}</h4>
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                        {movement.sku}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 mb-1">Quantity</p>
                        <p className={`font-bold text-lg ${movement.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                          {movement.type === 'in' ? '+' : '-'}{movement.quantity}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Date & Time</p>
                        <p className="font-medium text-gray-900">{movement.date}</p>
                        <p className="text-gray-600 text-xs">{movement.time}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Reason</p>
                        <p className="font-medium text-gray-900">{movement.reason}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Recorded By</p>
                        <p className="font-medium text-gray-900">{movement.staff}</p>
                      </div>
                    </div>

                    {movement.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium text-gray-700">Notes:</span> {movement.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
