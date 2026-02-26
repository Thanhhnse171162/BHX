'use client'

import { useState } from 'react'
import { Search, Download } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'

// Mock data
const inventoryData = [
  { id: 1, name: 'Apple Fuji', sku: 'APL123', category: 'Fresh Produce', quantity: 150, unit: 'kg', status: 'in-stock', lastUpdated: '2024-02-25' },
  { id: 2, name: 'Instant Noodles', sku: 'NDL456', category: 'Dry Goods', quantity: 20, unit: 'boxes', status: 'low-stock', lastUpdated: '2024-02-24' },
  { id: 3, name: 'Fresh Milk 1L', sku: 'MLK789', category: 'Dairy', quantity: 0, unit: 'liters', status: 'out-of-stock', lastUpdated: '2024-02-23' },
  { id: 4, name: 'Bottled Water 500ml', sku: 'WTR555', category: 'Beverages', quantity: 500, unit: 'bottles', status: 'in-stock', lastUpdated: '2024-02-26' },
  { id: 5, name: 'Cooking Oil 1L', sku: 'OIL678', category: 'Cooking Essentials', quantity: 75, unit: 'liters', status: 'in-stock', lastUpdated: '2024-02-25' },
  { id: 6, name: 'Rice 5kg', sku: 'RIC901', category: 'Dry Goods', quantity: 120, unit: 'bags', status: 'in-stock', lastUpdated: '2024-02-26' },
  { id: 7, name: 'Eggs Pack', sku: 'EGG234', category: 'Dairy', quantity: 8, unit: 'cartons', status: 'low-stock', lastUpdated: '2024-02-24' },
  { id: 8, name: 'Sugar 1kg', sku: 'SUG567', category: 'Cooking Essentials', quantity: 15, unit: 'kg', status: 'low-stock', lastUpdated: '2024-02-25' }
]

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all')

  const filteredInventory = inventoryData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || item.status === filterStatus
    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory List</h1>
          <p className="text-gray-600 mt-1">Manage and track all warehouse inventory</p>
        </div>
        <Button className="bg-[#2d6e3e] hover:bg-[#255931] flex items-center gap-2">
          <Download size={18} />
          Export
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Search by product name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <Button
              variant={filterStatus === 'all' ? 'primary' : 'outline'}
              onClick={() => setFilterStatus('all')}
              className={filterStatus === 'all' ? 'bg-[#2d6e3e]' : ''}
            >
              All
            </Button>
            <Button
              variant={filterStatus === 'in-stock' ? 'primary' : 'outline'}
              onClick={() => setFilterStatus('in-stock')}
              className={filterStatus === 'in-stock' ? 'bg-green-600' : ''}
            >
              In Stock
            </Button>
            <Button
              variant={filterStatus === 'low-stock' ? 'primary' : 'outline'}
              onClick={() => setFilterStatus('low-stock')}
              className={filterStatus === 'low-stock' ? 'bg-orange-600' : ''}
            >
              Low Stock
            </Button>
            <Button
              variant={filterStatus === 'out-of-stock' ? 'primary' : 'outline'}
              onClick={() => setFilterStatus('out-of-stock')}
              className={filterStatus === 'out-of-stock' ? 'bg-red-600' : ''}
            >
              Out of Stock
            </Button>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Product Name</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">SKU</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Category</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-700">Quantity</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-700">Status</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-700">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-6 font-medium text-gray-900">{item.name}</td>
                  <td className="py-4 px-6 text-gray-600">{item.sku}</td>
                  <td className="py-4 px-6 text-gray-600">{item.category}</td>
                  <td className="py-4 px-6 text-center">
                    <span className="font-semibold text-gray-900">
                      {item.quantity} <span className="text-gray-500 text-sm font-normal">{item.unit}</span>
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
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
                  <td className="py-4 px-6 text-center text-gray-600 text-sm">{item.lastUpdated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-1">Total Items</p>
            <p className="text-2xl font-bold text-gray-900">{inventoryData.length}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-1">In Stock</p>
            <p className="text-2xl font-bold text-green-600">
              {inventoryData.filter(i => i.status === 'in-stock').length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-1">Low Stock</p>
            <p className="text-2xl font-bold text-orange-600">
              {inventoryData.filter(i => i.status === 'low-stock').length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-1">Out of Stock</p>
            <p className="text-2xl font-bold text-red-600">
              {inventoryData.filter(i => i.status === 'out-of-stock').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
