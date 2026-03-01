'use client'

import { useState, useMemo } from 'react'
import { Search, Package, ArrowRight, Edit, Warehouse } from 'lucide-react'
import { Input } from '@/shared/ui/Input'
import { Button } from '@/shared/ui/Button'
import { inventoryData, InventoryItem } from '@/data/inventory-data'

// Extend inventory data with backroom-specific info
interface BackroomStock extends InventoryItem {
  backroomQty: number
  expiryDate?: string
}

// Mock backroom data (in production, this would come from API)
const backroomData: BackroomStock[] = inventoryData.map(item => ({
  ...item,
  backroomQty: Math.floor(item.quantity * 0.7), // 70% in backroom
  expiryDate: item.category === 'Dairy' || item.category === 'Fresh Produce' 
    ? new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    : undefined
}))

export default function BackroomStockPage() {
  const [searchTerm, setSearchTerm] = useState('')

  // Filter data
  const filteredData = useMemo(() => {
    return backroomData.filter(item => {
      const matchesSearch = 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      
      return matchesSearch
    })
  }, [searchTerm])

  // Handle transfer to shelf
  const handleTransferToShelf = (itemId: number) => {
    console.log('Transfer to shelf:', itemId)
    // In production, this would call an API
    alert(`Transfer item ${itemId} to shelf - API integration needed`)
  }

  // Handle stock adjustment
  const handleAdjustStock = (itemId: number) => {
    console.log('Adjust stock:', itemId)
    // In production, this would open a modal
    alert(`Adjust stock for item ${itemId} - Modal integration needed`)
  }

  // Check if expiry is near (within 7 days)
  const isExpiryNear = (expiryDate?: string) => {
    if (!expiryDate) return false
    const days = Math.floor((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days <= 7
  }

  // Status badge for stock level
  const StockStatusBadge = ({ qty, status }: { qty: number, status: InventoryItem['status'] }) => {
    if (qty === 0) {
      return <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-red-100 text-red-800 border-red-200">Empty</span>
    }
    if (status === 'low-stock') {
      return <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-orange-100 text-orange-800 border-orange-200">Low</span>
    }
    return <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-green-100 text-green-800 border-green-200">Good</span>
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Backroom Stock</h1>
        <p className="text-gray-600 mt-1">Manage warehouse inventory and transfers</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Backroom SKUs</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{backroomData.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Backroom Stock</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {backroomData.reduce((sum, item) => sum + item.backroomQty, 0).toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Warehouse className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Items Near Expiry</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">
                {backroomData.filter(item => isExpiryNear(item.expiryDate)).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="text-orange-600" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Search by product name, SKU, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Backroom Stock Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Backroom Qty
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Expiry Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Warehouse className="mx-auto mb-3 text-gray-400" size={48} />
                    <p className="text-lg font-medium">No products found</p>
                    <p className="text-sm mt-1">Try adjusting your search</p>
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr 
                    key={item.id} 
                    className={`hover:bg-gray-50 transition-colors ${
                      isExpiryNear(item.expiryDate) ? 'bg-orange-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{item.category}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 font-mono">{item.sku}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">
                        {item.backroomQty} {item.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {item.expiryDate ? (
                        <div className={`text-sm ${isExpiryNear(item.expiryDate) ? 'text-orange-600 font-semibold' : 'text-gray-600'}`}>
                          {new Date(item.expiryDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                          {isExpiryNear(item.expiryDate) && (
                            <span className="ml-2 text-xs">(Soon!)</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StockStatusBadge qty={item.backroomQty} status={item.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTransferToShelf(item.id)}
                          className="text-[#2d6e3e] border-[#2d6e3e] hover:bg-[#2d6e3e] hover:text-white"
                        >
                          <ArrowRight size={16} className="mr-1" />
                          Transfer
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAdjustStock(item.id)}
                          className="text-gray-700 hover:bg-gray-100"
                        >
                          <Edit size={16} className="mr-1" />
                          Adjust
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Info */}
      {filteredData.length > 0 && (
        <div className="text-sm text-gray-600 text-center">
          Showing {filteredData.length} of {backroomData.length} items
        </div>
      )}
    </div>
  )
}
