'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Input } from '@/shared/ui/Input'
import { DataTable } from '@/shared/ui/DataTable'
import Modal from '@/shared/ui/Modal'

interface StockItem extends Record<string, unknown> {
  id: string
  sku: string
  productName: string
  category: string
  currentStock: number
  reservedStock: number
  availableStock: number
  minStock: number
  maxStock: number
  reorderPoint: number
  unit: string
  lastUpdated: string
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'REORDER'
}

const statusLabels = {
  IN_STOCK: 'In Stock',
  LOW_STOCK: 'Low Stock',
  OUT_OF_STOCK: 'Out of Stock',
  REORDER: 'Need Reorder',
}

const statusColors = {
  IN_STOCK: 'bg-green-100 text-green-800',
  LOW_STOCK: 'bg-yellow-100 text-yellow-800',
  OUT_OF_STOCK: 'bg-red-100 text-red-800',
  REORDER: 'bg-orange-100 text-orange-800',
}

export default function ItemStockPage() {
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adjustingId, setAdjustingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  
  // Form states for edit
  const [sku, setSku] = useState('')
  const [productName, setProductName] = useState('')
  const [category, setCategory] = useState('')
  const [minStock, setMinStock] = useState(0)
  const [maxStock, setMaxStock] = useState(0)
  const [reorderPoint, setReorderPoint] = useState(0)
  const [unit, setUnit] = useState('pcs')
  
  // Form states for adjust
  const [adjustmentType, setAdjustmentType] = useState<'ADD' | 'SUBTRACT' | 'SET'>('ADD')
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(0)
  const [adjustmentReason, setAdjustmentReason] = useState('')
  
  const [stockItems, setStockItems] = useState<StockItem[]>([])

  // Load stock items từ localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = window.localStorage.getItem('demo-stock-items')
    if (!raw) {
      // Initialize with some demo data if empty
      const demoData: StockItem[] = []
      setStockItems(demoData)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('demo-stock-items', JSON.stringify(demoData))
      }
      return
    }
    try {
      const parsed = JSON.parse(raw) as StockItem[]
      setStockItems(parsed)
    } catch {
      // ignore parse error
    }
  }, [])

  const syncStockItems = (next: StockItem[]) => {
    setStockItems(next)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('demo-stock-items', JSON.stringify(next))
    }
  }

  const calculateStatus = (current: number, min: number, reorder: number): StockItem['status'] => {
    if (current === 0) return 'OUT_OF_STOCK'
    if (current <= reorder) return 'REORDER'
    if (current <= min) return 'LOW_STOCK'
    return 'IN_STOCK'
  }

  const handleOpenAdjust = (item: StockItem) => {
    setAdjustingId(item.id)
    setAdjustmentType('ADD')
    setAdjustmentQuantity(0)
    setAdjustmentReason('')
    setIsAdjustModalOpen(true)
  }

  const handleCloseAdjustModal = () => {
    setIsAdjustModalOpen(false)
    setAdjustingId(null)
    setAdjustmentType('ADD')
    setAdjustmentQuantity(0)
    setAdjustmentReason('')
  }

  const handleOpenEdit = (item: StockItem) => {
    setEditingId(item.id)
    setSku(item.sku)
    setProductName(item.productName)
    setCategory(item.category)
    setMinStock(item.minStock)
    setMaxStock(item.maxStock)
    setReorderPoint(item.reorderPoint)
    setUnit(item.unit)
    setIsEditModalOpen(true)
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setEditingId(null)
    setSku('')
    setProductName('')
    setCategory('')
    setMinStock(0)
    setMaxStock(0)
    setReorderPoint(0)
    setUnit('pcs')
  }

  const handleDeleteItem = (id: string) => {
    if (confirm('Are you sure you want to delete this stock item?')) {
      syncStockItems(stockItems.filter((item) => item.id !== id))
    }
  }

  const handleAdjustStock = (e: React.FormEvent) => {
    e.preventDefault()
    if (!adjustingId || !adjustmentReason.trim()) return

    const item = stockItems.find((i) => i.id === adjustingId)
    if (!item) return

    let newQuantity = item.currentStock
    if (adjustmentType === 'ADD') {
      newQuantity = item.currentStock + adjustmentQuantity
    } else if (adjustmentType === 'SUBTRACT') {
      newQuantity = Math.max(0, item.currentStock - adjustmentQuantity)
    } else if (adjustmentType === 'SET') {
      newQuantity = adjustmentQuantity
    }

    syncStockItems(
      stockItems.map((i) =>
        i.id === adjustingId
          ? {
              ...i,
              currentStock: newQuantity,
              availableStock: newQuantity - i.reservedStock,
              lastUpdated: new Date().toISOString(),
              status: calculateStatus(newQuantity, i.minStock, i.reorderPoint),
            }
          : i
      )
    )

    // TODO: Gọi API để log stock adjustment
    // await axiosInstance.post('/inventory/adjustments', { itemId, type, quantity, reason })

    handleCloseAdjustModal()
  }

  const handleEditStock = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return

    const item = stockItems.find((i) => i.id === editingId)
    if (!item) return

    syncStockItems(
      stockItems.map((i) =>
        i.id === editingId
          ? {
              ...i,
              sku,
              productName,
              category,
              minStock,
              maxStock,
              reorderPoint,
              unit,
              lastUpdated: new Date().toISOString(),
              status: calculateStatus(i.currentStock, minStock, reorderPoint),
            }
          : i
      )
    )

    // TODO: Gọi API để update stock item
    // await axiosInstance.put(`/inventory/stock/${editingId}`, { ... })

    handleCloseEditModal()
  }

  // Filter và search
  const filteredItems = stockItems.filter((item) => {
    const matchesSearch =
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus
    
    return matchesSearch && matchesStatus
  })

  const addButton = (
    <Button onClick={() => {
      // Create new item with default values
      const newItem: StockItem = {
        id: `stock-${Date.now()}`,
        sku: `SKU-${Date.now()}`,
        productName: 'New Product',
        category: 'Uncategorized',
        currentStock: 0,
        reservedStock: 0,
        availableStock: 0,
        minStock: 10,
        maxStock: 1000,
        reorderPoint: 20,
        unit: 'pcs',
        lastUpdated: new Date().toISOString(),
        status: 'OUT_OF_STOCK',
      }
      syncStockItems([...stockItems, newItem])
      handleOpenEdit(newItem)
    }}>
      Add Stock Item
    </Button>
  )

  return (
    <div className="p-6">
      <PageHeader
        title="Item Stock"
        subtitle="Manage stock levels, reorder points, and inventory thresholds"
        actions={addButton}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Kho & Tồn kho', href: '/admin/inventory' },
          { label: 'Item Stock', href: '/admin/inventory/stock' },
        ]}
      />

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by SKU, product name, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-48">
            <select
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="REORDER">Need Reorder</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        {filteredItems.length === 0 ? (
          <EmptyState
            title="No Stock Items"
            description={searchQuery || filterStatus !== 'all' 
              ? "No items match your search criteria"
              : "Start adding stock items to track inventory"}
            action={!searchQuery && filterStatus === 'all' ? addButton : undefined}
          />
        ) : (
          <DataTable
            data={filteredItems}
            columns={[
              {
                key: 'sku',
                label: 'SKU',
                render: (value: unknown, item: unknown) => {
                  const stock = item as StockItem
                  return (
                    <div>
                      <div className="font-semibold text-gray-900">{value as string}</div>
                      <div className="text-xs text-gray-500">{stock.category}</div>
                    </div>
                  )
                },
              },
              {
                key: 'productName',
                label: 'Product Name',
              },
              {
                key: 'currentStock',
                label: 'Stock Levels',
                render: (_value: unknown, item: unknown) => {
                  const stock = item as StockItem
                  return (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">
                          {stock.currentStock} {stock.unit}
                        </span>
                        {stock.reservedStock > 0 && (
                          <span className="text-xs text-gray-500">
                            ({stock.reservedStock} reserved)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        Available: {stock.availableStock} {stock.unit}
                      </div>
                    </div>
                  )
                },
              },
              {
                key: 'reorderPoint',
                label: 'Reorder Settings',
                render: (_value, item) => {
                  const stock = item as StockItem
                  return (
                    <div className="text-sm">
                      <div>Min: {stock.minStock} {stock.unit}</div>
                      <div>Reorder: {stock.reorderPoint} {stock.unit}</div>
                      <div>Max: {stock.maxStock} {stock.unit}</div>
                    </div>
                  )
                },
              },
              {
                key: 'status',
                label: 'Status',
                render: (value) => {
                  const status = value as StockItem['status']
                  return (
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status]}`}
                    >
                      {statusLabels[status]}
                    </span>
                  )
                },
              },
              {
                key: 'lastUpdated',
                label: 'Last Updated',
                render: (value) => {
                  return new Date(value as string).toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                },
              },
              {
                key: 'id',
                label: 'Actions',
                render: (_value, item) => {
                  const stock = item as StockItem
                  return (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenAdjust(stock)
                        }}
                      >
                        Adjust
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenEdit(stock)
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteItem(stock.id)
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  )
                },
              },
            ]}
          />
        )}
      </div>

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={handleCloseAdjustModal}
        title="Adjust Stock"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={handleCloseAdjustModal}>
              Cancel
            </Button>
            <Button onClick={handleAdjustStock}>Apply Adjustment</Button>
          </div>
        }
      >
        {adjustingId && (
          <form className="space-y-4" onSubmit={handleAdjustStock}>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Product</div>
              <div className="font-semibold text-gray-900">
                {stockItems.find((i) => i.id === adjustingId)?.productName} (
                {stockItems.find((i) => i.id === adjustingId)?.sku})
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Current Stock: {stockItems.find((i) => i.id === adjustingId)?.currentStock}{' '}
                {stockItems.find((i) => i.id === adjustingId)?.unit}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Adjustment Type</label>
              <select
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                value={adjustmentType}
                onChange={(e) => setAdjustmentType(e.target.value as 'ADD' | 'SUBTRACT' | 'SET')}
              >
                <option value="ADD">Add Stock</option>
                <option value="SUBTRACT">Subtract Stock</option>
                <option value="SET">Set Stock</option>
              </select>
            </div>

            <Input
              label="Quantity"
              type="number"
              value={adjustmentQuantity}
              onChange={(e) => setAdjustmentQuantity(Number(e.target.value))}
              placeholder="0"
              required
              min={0}
            />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Reason *</label>
              <textarea
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                placeholder="Enter reason for stock adjustment..."
                rows={3}
                required
              />
            </div>

            {adjustmentType === 'ADD' && (
              <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                New stock will be: {stockItems.find((i) => i.id === adjustingId)?.currentStock || 0} + {adjustmentQuantity} = {(stockItems.find((i) => i.id === adjustingId)?.currentStock || 0) + adjustmentQuantity}
              </div>
            )}
            {adjustmentType === 'SUBTRACT' && (
              <div className="p-3 bg-yellow-50 rounded-lg text-sm text-yellow-800">
                New stock will be: {stockItems.find((i) => i.id === adjustingId)?.currentStock || 0} - {adjustmentQuantity} = {Math.max(0, (stockItems.find((i) => i.id === adjustingId)?.currentStock || 0) - adjustmentQuantity)}
              </div>
            )}
            {adjustmentType === 'SET' && (
              <div className="p-3 bg-green-50 rounded-lg text-sm text-green-800">
                Stock will be set to: {adjustmentQuantity}
              </div>
            )}
          </form>
        )}
      </Modal>

      {/* Edit Stock Item Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        title={editingId ? 'Edit Stock Item' : 'Add Stock Item'}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={handleCloseEditModal}>
              Cancel
            </Button>
            <Button onClick={handleEditStock}>Save</Button>
          </div>
        }
      >
        <form className="space-y-4" onSubmit={handleEditStock}>
          <Input
            label="SKU"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="PROD-001"
            required
          />
          <Input
            label="Product Name"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Product name"
            required
          />
          <Input
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category"
            required
          />
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Min Stock"
              type="number"
              value={minStock}
              onChange={(e) => setMinStock(Number(e.target.value))}
              placeholder="0"
              required
              min={0}
            />
            <Input
              label="Reorder Point"
              type="number"
              value={reorderPoint}
              onChange={(e) => setReorderPoint(Number(e.target.value))}
              placeholder="0"
              required
              min={0}
            />
            <Input
              label="Max Stock"
              type="number"
              value={maxStock}
              onChange={(e) => setMaxStock(Number(e.target.value))}
              placeholder="0"
              required
              min={0}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Unit</label>
            <select
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            >
              <option value="pcs">Pieces (pcs)</option>
              <option value="kg">Kilograms (kg)</option>
              <option value="g">Grams (g)</option>
              <option value="l">Liters (l)</option>
              <option value="ml">Milliliters (ml)</option>
              <option value="box">Box</option>
              <option value="pack">Pack</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  )
}

