'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Package, 
  AlertTriangle, 
  Warehouse,
  FileText
} from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { useAuthStore } from '@/store/auth.store'
import { InventoryAPIService, InventoryItem } from '@/services/inventory-api.service'
import { RestockAPIService, RestockRequestFromAPI } from '@/services/restock-api.service'
import { WarehouseAPIService, WarehouseFromAPI } from '@/services/warehouse-api.service'
import { StockMovementAPIService, StockMovementFromAPI } from '@/services/stock-movement-api.service'
import { UserAPIService, UserInfoFromAPI } from '@/services/user-api.service'
import { ProductAPIService, ProductFromAPI } from '@/services/product-api.service'
import { ProductBatchAPIService, ProductBatchFromAPI } from '@/services/product-batch-api.service'

type WeeklyDataPoint = {
  day: string
  incoming: number
  outgoing: number
}

type WarehouseDistributionItem = {
  id: string
  name: string
  quantity: number
  percentage: number
}

type InventoryHighlightRow = {
  id: string
  name: string
  sku: string
  quantity: number
  lot: string
  status: 'in-stock' | 'low-stock' | 'out-of-stock'
}

type IncomingRequestRow = {
  id: string
  requestNumber: string
  sourceName: string
  productSummary: string
  statusLabel: string
}

type DashboardStats = {
  totalProducts: number
  lowStock: number
  pendingRequests: number
  linkedWarehouses: number
}

const WEEKDAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'] as const

function normalizeId(value?: string | number | null): string {
  return String(value ?? '').trim().toLowerCase()
}

function getStatusKey(value?: string | null): string {
  return String(value ?? '').trim().toUpperCase()
}

function isPendingRequest(status?: string | null): boolean {
  const key = getStatusKey(status)
  return key === 'PENDING' || key === 'PROCESSING'
}

function isInboundMovement(type?: string | null): boolean {
  const key = getStatusKey(type)
  return key.includes('IN') || key.includes('IMPORT') || key.includes('NHAP') || key.includes('RECEIVE')
}

function isOutboundMovement(type?: string | null): boolean {
  const key = getStatusKey(type)
  return key.includes('OUT') || key.includes('EXPORT') || key.includes('XUAT') || key.includes('SHIP')
}

function toRequestStatusLabel(status?: string | null): string {
  const key = getStatusKey(status)
  if (key === 'PENDING') return 'CHỜ XỬ LÝ'
  if (key === 'PROCESSING') return 'ĐANG XỬ LÝ'
  if (key === 'APPROVED') return 'ĐÃ DUYỆT'
  if (key === 'COMPLETED') return 'HOÀN TẤT'
  if (key === 'REJECTED') return 'TỪ CHỐI'
  return key || 'KHÔNG XÁC ĐỊNH'
}

function getWorkplaceType(user: ReturnType<typeof useAuthStore.getState>['user']): 'WAREHOUSE' | 'STORE' | null {
  const value = String(user?.workplaceType ?? '').toUpperCase()
  if (value === 'WAREHOUSE' || value === 'STORE') return value
  return null
}

function pickLatestBatchByProduct(batches: ProductBatchFromAPI[]): Map<string, ProductBatchFromAPI> {
  const latestByProduct = new Map<string, ProductBatchFromAPI>()

  batches.forEach((batch) => {
    const productId = normalizeId(batch.productId)
    if (!productId) return

    const current = latestByProduct.get(productId)
    if (!current) {
      latestByProduct.set(productId, batch)
      return
    }

    const currentTime = new Date(current.receivedAt || 0).getTime()
    const nextTime = new Date(batch.receivedAt || 0).getTime()
    if (nextTime > currentTime) {
      latestByProduct.set(productId, batch)
    }
  })

  return latestByProduct
}

export default function WarehouseDashboard() {
  const router = useRouter()
  const { user, hydrated } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    lowStock: 0,
    pendingRequests: 0,
    linkedWarehouses: 0,
  })
  const [weeklyData, setWeeklyData] = useState<WeeklyDataPoint[]>([])
  const [distribution, setDistribution] = useState<WarehouseDistributionItem[]>([])
  const [highlights, setHighlights] = useState<InventoryHighlightRow[]>([])
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequestRow[]>([])

  const loadDashboardData = useCallback(async () => {
    if (!hydrated) return

    const workplaceType = getWorkplaceType(user)
    const workplaceId = String(user?.workplaceId ?? '').trim()

    if (!workplaceType || !workplaceId) {
      setError('Tài khoản chưa có thông tin kho/cửa hàng (workplace). Vui lòng đăng xuất và đăng nhập lại.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const [inventory, requestData, warehouseData, userData, productData, batchData] = await Promise.all([
        InventoryAPIService.getInventoryByLocation(workplaceType, workplaceId),
        workplaceType === 'WAREHOUSE'
          ? RestockAPIService.getByParentWarehouse(workplaceId).catch(() => RestockAPIService.getByWarehouse(workplaceId))
          : RestockAPIService.getByWarehouse(workplaceId),
        WarehouseAPIService.getAll().catch(() => [] as WarehouseFromAPI[]),
        UserAPIService.getAll().catch(() => [] as UserInfoFromAPI[]),
        ProductAPIService.getAllProducts().catch(() => [] as ProductFromAPI[]),
        workplaceType === 'WAREHOUSE'
          ? ProductBatchAPIService.getByWarehouse(workplaceId).catch(() => [] as ProductBatchFromAPI[])
          : Promise.resolve([] as ProductBatchFromAPI[]),
      ])

      const inventoryList = Array.isArray(inventory) ? inventory : []
      const requestList = Array.isArray(requestData) ? requestData : []
      const warehouseList = Array.isArray(warehouseData) ? warehouseData : []
      const products = Array.isArray(productData) ? productData : []
      const batches = Array.isArray(batchData) ? batchData : []

      const productById = new Map<string, ProductFromAPI>()
      products.forEach((product) => {
        const id = normalizeId(product.id)
        if (id) productById.set(id, product)
      })

      const latestBatchByProduct = pickLatestBatchByProduct(batches)

      const normalizedCurrentId = normalizeId(workplaceId)
      const warehouseById = new Map<string, WarehouseFromAPI>()
      warehouseList.forEach((wh) => {
        const id = normalizeId(wh.id)
        if (id) warehouseById.set(id, wh)
      })

      const childWarehouses = warehouseList.filter((wh) => {
        const parentId = normalizeId(wh.parentId ?? wh.parent_id)
        return parentId === normalizedCurrentId
      })

      const movementLocationIds = Array.from(
        new Set([workplaceId, ...childWarehouses.map((wh) => wh.id)].filter(Boolean))
      )
      const movementChunks = await Promise.all(
        movementLocationIds.map((locationId) =>
          StockMovementAPIService.getByLocation(locationId).catch(() => [] as StockMovementFromAPI[])
        )
      )
      const movementList = movementChunks.flat()

      const activeStoreIds = new Set<string>()
      userData.forEach((account) => {
        const accountStatus = getStatusKey(account.status)
        const workplaceTypeKey = getStatusKey(account.workplaceType ?? account.workplace_type ?? account.workplace?.type)
        const workplaceIdKey = normalizeId(account.workplaceId ?? account.workplace_id ?? account.workplace?.id)

        if (!workplaceIdKey || workplaceTypeKey !== 'STORE') return
        if (accountStatus && accountStatus !== 'ACTIVE') return
        activeStoreIds.add(workplaceIdKey)
      })

      const lowStock = inventoryList.filter((item) => item.availableQuantity > 0 && item.isLowStock).length
      const pendingRequests = requestList.filter((req) => isPendingRequest(req.status)).length

      setStats({
        totalProducts: inventoryList.length,
        lowStock,
        pendingRequests,
        linkedWarehouses: childWarehouses.length,
      })

      const highlightsData: InventoryHighlightRow[] = [...inventoryList]
        .sort((a, b) => {
          const score = (item: InventoryItem) => {
            if (item.availableQuantity === 0) return 3
            if (item.isLowStock) return 2
            return 1
          }
          const scoreDiff = score(b) - score(a)
          if (scoreDiff !== 0) return scoreDiff
          return a.availableQuantity - b.availableQuantity
        })
        .slice(0, 5)
        .map((item) => ({
          product: productById.get(normalizeId(item.productId)),
          batch: latestBatchByProduct.get(normalizeId(item.productId)),
          source: item,
        }))
        .map(({ product, batch, source }) => ({
          id: source.id,
          name: source.product?.name || source.name || source.productName || product?.name || `SP-${source.productId.slice(0, 8)}`,
          sku: source.product?.sku || source.sku || product?.sku || `SKU-${source.productId.slice(0, 8).toUpperCase()}`,
          quantity: source.availableQuantity,
          lot: String(batch?.batchNumber || '').trim() || 'CHUA_CO_LO',
          status:
            source.availableQuantity === 0
              ? ('out-of-stock' as const)
              : source.isLowStock
              ? ('low-stock' as const)
              : ('in-stock' as const),
        }))
      setHighlights(highlightsData)

      const recentRequests = requestList
        .filter((req) => isPendingRequest(req.status))
        .sort((a, b) => {
          const left = new Date(a.requestedDate || 0).getTime()
          const right = new Date(b.requestedDate || 0).getTime()
          return right - left
        })
        .slice(0, 3)
        .map((req: RestockRequestFromAPI) => {
          const sourceWarehouseId = normalizeId(req.fromWarehouseId)
          const sourceWarehouse = warehouseById.get(sourceWarehouseId)
          const sourceName = sourceWarehouse?.name || (req.fromWarehouseId ? `Kho ${String(req.fromWarehouseId).slice(0, 8)}` : 'N/A')

          const firstItem = req.items?.[0]
          const totalQty = (req.items || []).reduce((sum, item) => sum + Number(item.requestedQuantity || 0), 0)
          const firstProductName = (() => {
            const fromItem = String(firstItem?.productName ?? '').trim()
            if (fromItem) return fromItem

            const fromMap = firstItem?.productId
              ? productById.get(normalizeId(firstItem.productId))?.name
              : ''
            return String(fromMap ?? '').trim() || 'Sản phẩm chưa đồng bộ'
          })()
          const productSummary = firstItem
            ? `${firstProductName} (${totalQty})`
            : `Tổng SL (${totalQty})`

          return {
            id: req.id,
            requestNumber: req.requestNumber || req.id,
            sourceName,
            productSummary,
            statusLabel: toRequestStatusLabel(req.status),
          }
        })
      setIncomingRequests(recentRequests)

      const distributionTargets: WarehouseFromAPI[] = []
      const currentWarehouse = warehouseById.get(normalizedCurrentId)
      if (currentWarehouse) distributionTargets.push(currentWarehouse)
      distributionTargets.push(...childWarehouses)

      if (distributionTargets.length > 0) {
        const quantityByWarehouse = await Promise.all(
          distributionTargets.map(async (wh) => {
            const whInventory = await InventoryAPIService.getInventoryByWarehouse(wh.id).catch(() => [] as InventoryItem[])
            const totalQty = whInventory.reduce((sum, item) => sum + Number(item.availableQuantity || item.quantity || 0), 0)
            return { id: wh.id, name: wh.name || 'Kho', quantity: totalQty }
          })
        )

        const maxQty = Math.max(...quantityByWarehouse.map((item) => item.quantity), 1)
        const distributionData = quantityByWarehouse
          .filter((item) => item.quantity > 0)
          .slice(0, 5)
          .map((item) => ({
            ...item,
            percentage: Math.round((item.quantity / maxQty) * 100),
          }))

        setDistribution(distributionData)
      } else {
        const fallbackQty = inventoryList.reduce((sum, item) => sum + Number(item.availableQuantity || item.quantity || 0), 0)
        setDistribution([
          {
            id: workplaceId,
            name: 'Kho hiện tại',
            quantity: fallbackQty,
            percentage: 100,
          },
        ])
      }

      const dailyMap = new Map<string, WeeklyDataPoint>()
      const today = new Date()

      for (let offset = 5; offset >= 0; offset -= 1) {
        const date = new Date(today)
        date.setDate(today.getDate() - offset)
        const key = date.toISOString().slice(0, 10)
        dailyMap.set(key, {
          day: WEEKDAY_LABELS[date.getDay()],
          incoming: 0,
          outgoing: 0,
        })
      }

      movementList.forEach((movement) => {
        const movementDate = new Date(movement.movementDate || movement.createdAt || Date.now())
        const key = movementDate.toISOString().slice(0, 10)
        const daily = dailyMap.get(key)
        if (!daily) return

        const qty = (movement.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)
        if (isInboundMovement(movement.movementType)) {
          daily.incoming += qty
          return
        }
        if (isOutboundMovement(movement.movementType)) {
          daily.outgoing += qty
        }
      })

      setWeeklyData(Array.from(dailyMap.values()))
    } catch (err) {
      console.error('Error loading warehouse dashboard:', err)
      setError('Không thể tải dữ liệu dashboard. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }, [hydrated, user])

  useEffect(() => {
    void loadDashboardData()
  }, [loadDashboardData])

  const throughputData = useMemo<WeeklyDataPoint[]>(() => {
    if (weeklyData.length > 0) return weeklyData

    const today = new Date()
    const fallback: WeeklyDataPoint[] = []
    for (let offset = 5; offset >= 0; offset -= 1) {
      const date = new Date(today)
      date.setDate(today.getDate() - offset)
      fallback.push({ day: WEEKDAY_LABELS[date.getDay()], incoming: 0, outgoing: 0 })
    }
    return fallback
  }, [weeklyData])

  const chartMaxValue = useMemo(
    () => Math.max(...throughputData.flatMap((d) => [d.incoming, d.outgoing]), 1),
    [throughputData]
  )

  const chartGeometry = useMemo(() => {
    const width = 960
    const height = 220
    const leftPad = 16
    const rightPad = 16
    const topPad = 12
    const bottomPad = 20
    const drawWidth = width - leftPad - rightPad
    const drawHeight = height - topPad - bottomPad
    const step = throughputData.length > 1 ? drawWidth / (throughputData.length - 1) : 0

    const buildPath = (key: 'incoming' | 'outgoing') => throughputData
      .map((point, index) => {
        const x = leftPad + step * index
        const y = topPad + (1 - point[key] / chartMaxValue) * drawHeight
        return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
      })
      .join(' ')

    const incomingPoints = throughputData.map((point, index) => {
      const x = leftPad + step * index
      const y = topPad + (1 - point.incoming / chartMaxValue) * drawHeight
      return { x, y }
    })

    const outgoingPoints = throughputData.map((point, index) => {
      const x = leftPad + step * index
      const y = topPad + (1 - point.outgoing / chartMaxValue) * drawHeight
      return { x, y }
    })

    return {
      width,
      height,
      leftPad,
      topPad,
      drawWidth,
      drawHeight,
      incomingPath: buildPath('incoming'),
      outgoingPath: buildPath('outgoing'),
      incomingPoints,
      outgoingPoints,
    }
  }, [throughputData, chartMaxValue])

  return (
    <div className="space-y-6 p-6 bg-gray-50">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tổng quan Dashboard</h1>
        <p className="text-gray-600 mt-1">Giám sát chuỗi cung ứng thời gian thực cho Kho trung tâm & Các trung tâm phân phối liên kết.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Main Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Package className="text-green-600" size={20} />
            </div>
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">Realtime</span>
          </div>
          <p className="text-xs text-gray-600 font-medium uppercase mb-1">TỔNG SẢN PHẨM</p>
          <p className="text-3xl font-bold text-gray-900">{isLoading ? '...' : stats.totalProducts.toLocaleString()}</p>
        </div>

        {/* Low Stock Items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push('/warehouse/inventory/overview?filter=low-stock')}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
              <AlertTriangle className="text-red-600" size={20} />
            </div>
            <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded">Realtime</span>
          </div>
          <p className="text-xs text-gray-600 font-medium uppercase mb-1">SẢN PHẨM TỒN KHO THẤP</p>
          <p className="text-3xl font-bold text-gray-900">{isLoading ? '...' : stats.lowStock}</p>
        </div>

        {/* Pending Requests */}
        <div
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push('/warehouse/requests')}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <FileText className="text-orange-600" size={20} />
            </div>
            <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded">Realtime</span>
          </div>
          <p className="text-xs text-gray-600 font-medium uppercase mb-1">YÊU CẦU CHỜ XỬ LÝ</p>
          <p className="text-3xl font-bold text-gray-900">{isLoading ? '...' : stats.pendingRequests}</p>
        </div>

        {/* Linked Warehouses */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Warehouse className="text-blue-600" size={20} />
            </div>
            <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-2 py-1 rounded">Live</span>
          </div>
          <p className="text-xs text-gray-600 font-medium uppercase mb-1">KHO LIÊN KẾT</p>
          <p className="text-3xl font-bold text-gray-900">{isLoading ? '...' : stats.linkedWarehouses}</p>
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
          
          {/* Line Chart */}
          <div className="h-64">
            <svg viewBox={`0 0 ${chartGeometry.width} ${chartGeometry.height}`} className="w-full h-[220px]">
              <rect
                x={chartGeometry.leftPad}
                y={chartGeometry.topPad}
                width={chartGeometry.drawWidth}
                height={chartGeometry.drawHeight}
                fill="transparent"
                stroke="#E5E7EB"
                strokeWidth="1"
                rx="8"
              />

              {[0.25, 0.5, 0.75].map((ratio) => {
                const y = chartGeometry.topPad + chartGeometry.drawHeight * ratio
                return (
                  <line
                    key={ratio}
                    x1={chartGeometry.leftPad}
                    x2={chartGeometry.leftPad + chartGeometry.drawWidth}
                    y1={y}
                    y2={y}
                    stroke="#F3F4F6"
                    strokeWidth="1"
                  />
                )
              })}

              <path d={chartGeometry.outgoingPath} fill="none" stroke="#86EFAC" strokeWidth="3" strokeLinecap="round" />
              <path d={chartGeometry.incomingPath} fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" />

              {chartGeometry.outgoingPoints.map((point, index) => (
                <circle key={`out-${index}`} cx={point.x} cy={point.y} r="3.5" fill="#86EFAC" />
              ))}
              {chartGeometry.incomingPoints.map((point, index) => (
                <circle key={`in-${index}`} cx={point.x} cy={point.y} r="3.5" fill="#22C55E" />
              ))}
            </svg>

            <div className="mt-2 grid grid-cols-6 text-center">
              {throughputData.map((item, idx) => (
                <span key={`${item.day}-${idx}`} className="text-xs text-gray-600 font-medium uppercase">
                  {item.day}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Warehouse Distribution - Takes 1 column */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Phân bổ kho hàng</h3>
          </div>
          
          <div className="space-y-4">
            {distribution.length > 0 ? distribution.map((item) => {
              const barColor = item.percentage >= 70 ? 'bg-green-600' : item.percentage >= 40 ? 'bg-orange-500' : 'bg-red-500'

              return (
                <div key={item.id}>
                  <div className="flex items-center justify-between mb-2 gap-4">
                    <span className="text-sm font-medium text-gray-700 truncate">{item.name.toUpperCase()}</span>
                    <span className="text-sm font-bold text-gray-900 whitespace-nowrap">{item.percentage}% MỨC TỒN</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`${barColor} h-2 rounded-full`} style={{ width: `${item.percentage}%` }}></div>
                  </div>
                </div>
              )
            }) : (
              <div className="text-sm text-gray-500">Chưa có dữ liệu phân bổ kho.</div>
            )}
          </div>

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
              onClick={() => router.push('/warehouse/inventory')}
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
                {highlights.slice(0, 3).map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <Package size={16} className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{item.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-600">{item.sku}</td>
                    <td className="py-3 px-2 text-sm font-semibold text-gray-900">{item.quantity}</td>
                    <td className="py-3 px-2 text-sm text-gray-600">{item.lot}</td>
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
                {!isLoading && highlights.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-gray-500">
                      Chưa có dữ liệu tồn kho.
                    </td>
                  </tr>
                )}
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
              onClick={() => router.push('/warehouse/requests')}
            >
              Xem lại tất cả
            </Button>
          </div>
          
          <div className="space-y-3">
            {incomingRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Warehouse className="text-blue-600" size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-medium text-gray-500">ID</p>
                      <p className="text-sm font-semibold text-gray-900">#{request.requestNumber}</p>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-medium text-gray-500">NGUỒN</p>
                      <p className="text-sm text-gray-900">{request.sourceName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-gray-500">SẢN PHẨM</p>
                      <p className="text-sm text-gray-900">{request.productSummary}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                    {request.statusLabel}
                  </span>
                </div>
              </div>
            ))}
            {!isLoading && incomingRequests.length === 0 && (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                Hiện không có yêu cầu chờ xử lý.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
