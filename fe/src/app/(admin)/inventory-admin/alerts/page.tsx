'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Input } from '@/shared/ui/Input'
import { DataTable } from '@/shared/ui/DataTable'
import Modal from '@/shared/ui/Modal'

interface LowStockAlert extends Record<string, unknown> {
  id: string
  sku: string
  productName: string
  category: string
  currentStock: number
  minStock: number
  reorderPoint: number
  maxStock: number
  unit: string
  location: string
  locationType: 'WAREHOUSE' | 'STORE'
  alertLevel: 'CRITICAL' | 'WARNING' | 'INFO'
  daysUntilOutOfStock: number | null
  lastUpdated: string
}

const alertLevelColors = {
  CRITICAL: 'bg-red-100 text-red-800 border-red-300',
  WARNING: 'bg-orange-100 text-orange-800 border-orange-300',
  INFO: 'bg-yellow-100 text-yellow-800 border-yellow-300',
}

const alertLevelLabels = {
  CRITICAL: 'Critical',
  WARNING: 'Warning',
  INFO: 'Low Stock',
}

export default function LowStockAlertsPage() {
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false)
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<LowStockAlert | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterLevel, setFilterLevel] = useState<string>('all')
  const [alerts, setAlerts] = useState<LowStockAlert[]>([])

  // Form states for adjust
  const [adjustmentType, setAdjustmentType] = useState<'ADD' | 'SET'>('ADD')
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(0)
  const [adjustmentReason, setAdjustmentReason] = useState('')

  // Form states for threshold
  const [newMinStock, setNewMinStock] = useState(0)
  const [newReorderPoint, setNewReorderPoint] = useState(0)

  // Load alerts từ localStorage (sẽ thay bằng API)
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    // Load từ demo-stock-items và filter low stock items
    const raw = window.localStorage.getItem('demo-stock-items')
    if (!raw) {
      setAlerts([])
      return
    }
    
    try {
      const stockItems = JSON.parse(raw) as Array<{
        id: string
        sku: string
        productName: string
        category: string
        currentStock: number
        minStock: number
        reorderPoint: number
        maxStock: number
        unit: string
        lastUpdated: string
        status: string
      }>
      
      // Filter items with low stock
      const lowStockItems = stockItems.filter(
        (item) => 
          item.status === 'LOW_STOCK' || 
          item.status === 'REORDER' || 
          item.status === 'OUT_OF_STOCK'
      )
      
      // Convert to alerts with alert level
      const alertsData: LowStockAlert[] = lowStockItems.map((item) => {
        let alertLevel: 'CRITICAL' | 'WARNING' | 'INFO' = 'INFO'
        let daysUntilOutOfStock: number | null = null
        
        if (item.currentStock === 0) {
          alertLevel = 'CRITICAL'
        } else if (item.currentStock <= item.reorderPoint) {
          alertLevel = 'CRITICAL'
          // Estimate days until out of stock (simplified calculation)
          const dailyUsage = (item.minStock - item.currentStock) / 30 // Assume 30 days to reach min
          daysUntilOutOfStock = dailyUsage > 0 ? Math.ceil(item.currentStock / dailyUsage) : 0
        } else if (item.currentStock <= item.minStock) {
          alertLevel = 'WARNING'
          const dailyUsage = (item.minStock - item.currentStock) / 30
          daysUntilOutOfStock = dailyUsage > 0 ? Math.ceil(item.currentStock / dailyUsage) : 0
        }
        
        return {
          id: item.id,
          sku: item.sku,
          productName: item.productName,
          category: item.category,
          currentStock: item.currentStock,
          minStock: item.minStock,
          reorderPoint: item.reorderPoint,
          maxStock: item.maxStock,
          unit: item.unit,
          location: 'Warehouse A', // Default, sẽ lấy từ API
          locationType: 'WAREHOUSE',
          alertLevel,
          daysUntilOutOfStock,
          lastUpdated: item.lastUpdated,
        }
      })
      
      setAlerts(alertsData)
    } catch {
      setAlerts([])
    }
  }, [])

  const handleOpenAdjust = (item: LowStockAlert) => {
    setSelectedItem(item)
    setAdjustmentType('ADD')
    setAdjustmentQuantity(0)
    setAdjustmentReason('')
    setIsAdjustModalOpen(true)
  }

  const handleCloseAdjustModal = () => {
    setIsAdjustModalOpen(false)
    setSelectedItem(null)
    setAdjustmentQuantity(0)
    setAdjustmentReason('')
  }

  const handleOpenThreshold = (item: LowStockAlert) => {
    setSelectedItem(item)
    setNewMinStock(item.minStock)
    setNewReorderPoint(item.reorderPoint)
    setIsThresholdModalOpen(true)
  }

  const handleCloseThresholdModal = () => {
    setIsThresholdModalOpen(false)
    setSelectedItem(null)
    setNewMinStock(0)
    setNewReorderPoint(0)
  }

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem || !adjustmentReason.trim()) return

    // TODO: Gọi API để adjust stock
    // await axiosInstance.post('/api/inventory/adjust', { ... })

    // Update local state (temporary, sẽ thay bằng API)
    if (typeof window !== 'undefined') {
      const raw = window.localStorage.getItem('demo-stock-items')
      if (raw) {
        try {
          const stockItems = JSON.parse(raw)
          const updatedItems = stockItems.map((item: any) => {
            if (item.id === selectedItem.id) {
              const newQuantity = adjustmentType === 'ADD' 
                ? item.currentStock + adjustmentQuantity
                : adjustmentQuantity
              return {
                ...item,
                currentStock: newQuantity,
                availableStock: newQuantity - (item.reservedStock || 0),
                lastUpdated: new Date().toISOString(),
              }
            }
            return item
          })
          window.localStorage.setItem('demo-stock-items', JSON.stringify(updatedItems))
          
          // Reload alerts
          window.location.reload()
        } catch {
          // ignore
        }
      }
    }

    handleCloseAdjustModal()
  }

  const handleUpdateThreshold = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem) return

    // TODO: Gọi API để update threshold
    // await axiosInstance.put(`/api/inventory/stock/${selectedItem.id}/threshold`, { ... })

    // Update local state (temporary)
    if (typeof window !== 'undefined') {
      const raw = window.localStorage.getItem('demo-stock-items')
      if (raw) {
        try {
          const stockItems = JSON.parse(raw)
          const updatedItems = stockItems.map((item: any) => {
            if (item.id === selectedItem.id) {
              return {
                ...item,
                minStock: newMinStock,
                reorderPoint: newReorderPoint,
                lastUpdated: new Date().toISOString(),
              }
            }
            return item
          })
          window.localStorage.setItem('demo-stock-items', JSON.stringify(updatedItems))
          
          // Reload alerts
          window.location.reload()
        } catch {
          // ignore
        }
      }
    }

    handleCloseThresholdModal()
  }

  // Filter alerts
  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch =
      alert.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.category.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesLevel = filterLevel === 'all' || alert.alertLevel === filterLevel
    
    return matchesSearch && matchesLevel
  })

  // Sort by alert level (CRITICAL first)
  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    const levelOrder = { CRITICAL: 0, WARNING: 1, INFO: 2 }
    return levelOrder[a.alertLevel] - levelOrder[b.alertLevel]
  })

  // Statistics
  const criticalCount = alerts.filter((a) => a.alertLevel === 'CRITICAL').length
  const warningCount = alerts.filter((a) => a.alertLevel === 'WARNING').length
  const infoCount = alerts.filter((a) => a.alertLevel === 'INFO').length

  return (
    <div className="p-6">
      <PageHeader
        title="Cảnh báo tồn thấp"
        subtitle="Theo dõi và xử lý sản phẩm có mức tồn kho thấp"
        breadcrumbs={[
          { label: 'Quản trị', href: '/admin' },
          { label: 'Kho & Tồn kho', href: '/admin/inventory' },
          { label: 'Cảnh báo tồn thấp', href: '/admin/inventory/alerts' },
        ]}
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Cảnh báo nghiêm trọng</p>
              <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card p-4 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Cảnh báo mức trung bình</p>
              <p className="text-2xl font-bold text-orange-600">{warningCount}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card p-4 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Mặt hàng tồn thấp</p>
              <p className="text-2xl font-bold text-yellow-600">{infoCount}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Tìm theo SKU, tên sản phẩm hoặc danh mục..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-48">
            <select
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
            >
              <option value="all">Tất cả mức cảnh báo</option>
              <option value="CRITICAL">Nghiêm trọng</option>
              <option value="WARNING">Cảnh báo</option>
              <option value="INFO">Tồn thấp</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="card">
        {sortedAlerts.length === 0 ? (
          <EmptyState
            title="Không có cảnh báo tồn thấp"
            description={searchQuery || filterLevel !== 'all'
              ? 'Không có cảnh báo phù hợp tiêu chí tìm kiếm'
              : 'Tất cả sản phẩm đang có tồn kho tốt'}
          />
        ) : (
          <DataTable
            data={sortedAlerts}
            columns={[
              {
                key: 'alertLevel',
                label: 'Mức cảnh báo',
                render: (value) => {
                  const level = value as LowStockAlert['alertLevel']
                  return (
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full border ${alertLevelColors[level]}`}
                    >
                      {alertLevelLabels[level]}
                    </span>
                  )
                },
              },
              {
                key: 'sku',
                label: 'SKU',
                render: (value, item) => {
                  const alert = item as LowStockAlert
                  return (
                    <div>
                      <div className="font-semibold text-gray-900">{value as string}</div>
                      <div className="text-xs text-gray-500">{alert.category}</div>
                    </div>
                  )
                },
              },
              {
                key: 'productName',
                label: 'Tên sản phẩm',
              },
              {
                key: 'currentStock',
                label: 'Trạng thái tồn kho',
                render: (_value, item) => {
                  const alert = item as LowStockAlert
                  const stockPercentage = (alert.currentStock / alert.maxStock) * 100
                  return (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">
                          {alert.currentStock} {alert.unit}
                        </span>
                        <span className="text-xs text-gray-500">
                          / {alert.maxStock} {alert.unit}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            alert.alertLevel === 'CRITICAL'
                              ? 'bg-red-500'
                              : alert.alertLevel === 'WARNING'
                              ? 'bg-orange-500'
                              : 'bg-yellow-500'
                          }`}
                          style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  )
                },
              },
              {
                key: 'minStock',
                label: 'Ngưỡng cảnh báo',
                render: (_value, item) => {
                  const alert = item as LowStockAlert
                  return (
                    <div className="text-sm">
                      <div>Min: {alert.minStock} {alert.unit}</div>
                      <div>Reorder: {alert.reorderPoint} {alert.unit}</div>
                    </div>
                  )
                },
              },
              {
                key: 'daysUntilOutOfStock',
                label: 'Số ngày còn lại (ước tính)',
                render: (value) => {
                  const days = value as number | null
                  if (days === null) return <span className="text-gray-400">-</span>
                  if (days === 0) return <span className="text-red-600 font-semibold">Hết hàng</span>
                  return (
                    <span className={days <= 7 ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                      {days} ngày
                    </span>
                  )
                },
              },
              {
                key: 'location',
                label: 'Khu vực',
                render: (value, item) => {
                  const alert = item as LowStockAlert
                  return (
                    <div>
                      <div className="text-sm font-medium text-gray-900">{value as string}</div>
                      <div className="text-xs text-gray-500">
                        {alert.locationType === 'WAREHOUSE' ? 'Kho' : 'Cửa hàng'}
                      </div>
                    </div>
                  )
                },
              },
              {
                key: 'id',
                label: 'Thao tác',
                render: (_value, item) => {
                  const alert = item as LowStockAlert
                  return (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenAdjust(alert)
                        }}
                      >
                        Nhập thêm
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenThreshold(alert)
                        }}
                      >
                        Ngưỡng
                      </Button>
                    </div>
                  )
                },
              },
            ]}
          />
        )}
      </div>

      {/* Restock Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={handleCloseAdjustModal}
        title="Nhập thêm hàng"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={handleCloseAdjustModal}>
              Hủy
            </Button>
            <Button onClick={handleAdjustStock}>Nhập thêm</Button>
          </div>
        }
      >
        {selectedItem && (
          <form className="space-y-4" onSubmit={handleAdjustStock}>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Sản phẩm</div>
              <div className="font-semibold text-gray-900">
                {selectedItem.productName} ({selectedItem.sku})
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Tồn kho hiện tại: {selectedItem.currentStock} {selectedItem.unit}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Loại điều chỉnh</label>
              <select
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                value={adjustmentType}
                onChange={(e) => setAdjustmentType(e.target.value as 'ADD' | 'SET')}
              >
                <option value="ADD">Cộng tồn</option>
                <option value="SET">Đặt lại tồn</option>
              </select>
            </div>

            <Input
              label="Số lượng"
              type="number"
              value={adjustmentQuantity}
              onChange={(e) => setAdjustmentQuantity(Number(e.target.value))}
              placeholder="0"
              required
              min={0}
            />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Lý do *</label>
              <textarea
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                placeholder="Nhập lý do nhập thêm hàng..."
                rows={3}
                required
              />
            </div>

            {adjustmentType === 'ADD' && (
              <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                Tồn kho mới sẽ là: {selectedItem.currentStock} + {adjustmentQuantity} = {selectedItem.currentStock + adjustmentQuantity} {selectedItem.unit}
              </div>
            )}
            {adjustmentType === 'SET' && (
              <div className="p-3 bg-green-50 rounded-lg text-sm text-green-800">
                Tồn kho sẽ được đặt thành: {adjustmentQuantity} {selectedItem.unit}
              </div>
            )}
          </form>
        )}
      </Modal>

      {/* Update Threshold Modal */}
      <Modal
        isOpen={isThresholdModalOpen}
        onClose={handleCloseThresholdModal}
        title="Cập nhật ngưỡng cảnh báo"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={handleCloseThresholdModal}>
              Hủy
            </Button>
            <Button onClick={handleUpdateThreshold}>Cập nhật</Button>
          </div>
        }
      >
        {selectedItem && (
          <form className="space-y-4" onSubmit={handleUpdateThreshold}>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Sản phẩm</div>
              <div className="font-semibold text-gray-900">
                {selectedItem.productName} ({selectedItem.sku})
              </div>
            </div>

            <Input
              label="Tồn tối thiểu"
              type="number"
              value={newMinStock}
              onChange={(e) => setNewMinStock(Number(e.target.value))}
              placeholder="0"
              required
              min={0}
            />

            <Input
              label="Điểm đặt hàng lại"
              type="number"
              value={newReorderPoint}
              onChange={(e) => setNewReorderPoint(Number(e.target.value))}
              placeholder="0"
              required
              min={0}
            />

            <div className="p-3 bg-yellow-50 rounded-lg text-sm text-yellow-800">
              <p className="font-medium mb-1">Quy tắc cảnh báo:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Khi tồn kho ≤ Điểm đặt hàng lại: Cảnh báo nghiêm trọng</li>
                <li>Khi tồn kho ≤ Tồn tối thiểu: Cảnh báo</li>
                <li>Khi tồn kho &lt; Tồn tối đa: Thông tin tồn thấp</li>
              </ul>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

