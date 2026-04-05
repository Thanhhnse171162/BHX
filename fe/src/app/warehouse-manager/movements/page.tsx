'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Search,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { StockMovementAPIService, type StockMovementFromAPI } from '@/services/stock-movement-api.service'
import { ProductAPIService } from '@/services/product-api.service'
import { ProductBatchAPIService } from '@/services/product-batch-api.service'

type UiStatus = 'ALL' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'UNKNOWN'

function normalizeId(value?: string | null) {
  return String(value ?? '').trim().toLowerCase()
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('vi-VN')
}

function normalizeType(value?: string | null) {
  return String(value ?? '').trim().toUpperCase()
}

function normalizeStatus(value?: string | null): UiStatus {
  const status = String(value ?? '').trim().toUpperCase()
  if (status === 'PENDING') return 'PENDING'
  if (status === 'PROCESSING') return 'PROCESSING'
  if (status === 'COMPLETED') return 'COMPLETED'
  if (status === 'CANCELLED') return 'CANCELLED'
  return 'UNKNOWN'
}

function getTypeMeta(type: string) {
  const normalized = normalizeType(type)
  if (normalized === 'OUTBOUND') {
    return {
      label: 'Xuất kho',
      className: 'bg-orange-50 text-orange-700 border-orange-200',
    }
  }

  if (normalized === 'TRANSFER') {
    return {
      label: 'Điều chuyển',
      className: 'bg-blue-50 text-blue-700 border-blue-200',
    }
  }

  if (normalized === 'INBOUND') {
    return {
      label: 'Nhập kho',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    }
  }

  return {
    label: normalized || 'Không xác định',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  }
}

function getStatusMeta(status: UiStatus) {
  if (status === 'COMPLETED') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (status === 'PROCESSING') return 'bg-blue-50 text-blue-700 border-blue-200'
  if (status === 'CANCELLED') return 'bg-red-50 text-red-700 border-red-200'
  if (status === 'UNKNOWN') return 'bg-gray-50 text-gray-700 border-gray-200'
  return 'bg-amber-50 text-amber-700 border-amber-200'
}

function getStatusLabel(status: UiStatus) {
  if (status === 'COMPLETED') return 'Hoàn thành'
  if (status === 'PROCESSING') return 'Đang xử lý'
  if (status === 'CANCELLED') return 'Đã hủy'
  if (status === 'PENDING') return 'Chờ xử lý'
  return 'Không xác định'
}

function MovementDetailModal({
  row,
  productNameById,
  batchNameById,
  batchUnitById,
  onClose,
}: {
  row: StockMovementFromAPI | null
  productNameById: Record<string, string>
  batchNameById: Record<string, string>
  batchUnitById: Record<string, string>
  onClose: () => void
}) {
  if (!row) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-gray-200 shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Chi tiết di chuyển hàng</h2>
            <p className="text-sm text-gray-500 mt-1">Mã phiếu: {row.movementNumber || row.id}</p>
          </div>
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm">
            Đóng
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500">Mã phiếu</p>
              <p className="mt-1 font-semibold text-gray-900 break-all">{row.movementNumber || row.id}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500">Loại</p>
              <p className="mt-1 font-semibold text-gray-900">{getTypeMeta(row.movementType).label}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500">Trạng thái</p>
              <p className="mt-1 font-semibold text-gray-900">{getStatusLabel(normalizeStatus(row.status))}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500">Ngày di chuyển</p>
              <p className="mt-1 font-semibold text-gray-900">{formatDate(row.movementDate)}</p>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500">Ghi chú</p>
            <p className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">{row.notes || 'Không có ghi chú'}</p>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Sản phẩm</th>
                  <th className="px-4 py-3 text-left">Batch</th>
                  <th className="px-4 py-3 text-left">Đơn vị</th>
                  <th className="px-4 py-3 text-right">Số lượng</th>
                </tr>
              </thead>
              <tbody>
                {(row.items ?? []).map((item) => {
                  const productDisplayName =
                    item.productName ||
                    productNameById[normalizeId(item.productId)] ||
                    item.productId

                  // Try normalized ID first, then original ID
                  const batchLookupId = normalizeId(item.batchId || '')
                  const batchDisplayName = item.batchId
                    ? (batchNameById[batchLookupId] || batchNameById[item.batchId] || item.batchId)
                    : '—'

                  // Display unit: prioritize item.unit, then batch unit, then empty dash
                  let unitDisplay = '—'
                  if (item.unit?.trim()) {
                    unitDisplay = item.unit.trim()
                  } else if (item.batchId) {
                    const batchUnit = batchUnitById[batchLookupId] || batchUnitById[item.batchId]
                    if (batchUnit?.trim()) {
                      unitDisplay = batchUnit.trim()
                    }
                  }

                  return (
                    <tr key={item.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-gray-800">{productDisplayName}</td>
                    <td className="px-4 py-3 text-gray-600">{batchDisplayName}</td>
                    <td className="px-4 py-3 text-gray-600">{unitDisplay}</td>
                    <td className="px-4 py-3 text-right text-gray-900 font-semibold">{Number(item.quantity ?? 0).toLocaleString()}</td>
                  </tr>
                  )
                })}
                {(row.items ?? []).length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-gray-400">
                      Không có chi tiết sản phẩm
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function WarehouseManagerMovementsPage() {
  const user = useAuthStore((s) => s.user)
  const currentWarehouseId = String(user?.warehouseId ?? user?.workplaceId ?? '').trim()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rows, setRows] = useState<StockMovementFromAPI[]>([])
  const [productNameById, setProductNameById] = useState<Record<string, string>>({})
  const [batchNameById, setBatchNameById] = useState<Record<string, string>>({})
  const [batchUnitById, setBatchUnitById] = useState<Record<string, string>>({})

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<UiStatus>('ALL')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10

  const [selected, setSelected] = useState<StockMovementFromAPI | null>(null)

  const loadRows = useCallback(async () => {
    if (!currentWarehouseId) {
      setRows([])
      setError('Không tìm thấy kho hiện tại của tài khoản.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const [data, products, batches] = await Promise.all([
        StockMovementAPIService.getByLocation(currentWarehouseId),
        ProductAPIService.getAllProducts().catch(() => []),
        ProductBatchAPIService.getByWarehouse(currentWarehouseId).catch(() => []),
      ])

      const nextProductNameById: Record<string, string> = {}
      for (const product of products ?? []) {
        const id = normalizeId((product as any)?.id)
        const name = String((product as any)?.name ?? '').trim()
        if (id && name) nextProductNameById[id] = name
      }
      setProductNameById(nextProductNameById)

      // Build initial batch mapping from warehouse batch data
      const nextBatchNameById: Record<string, string> = {}
      const nextBatchUnitById: Record<string, string> = {}
      for (const batch of batches ?? []) {
        const batchId = String((batch as any)?.id ?? (batch as any)?.batchId ?? '').trim()
        const batchNumber = String((batch as any)?.batchNumber ?? (batch as any)?.name ?? '').trim()
        // Check multiple possible unit field names
        const unit = String(
          (batch as any)?.unit ??
          (batch as any)?.Unit ??
          (batch as any)?.unitName ??
          (batch as any)?.displayUnit ??
          ''
        ).trim()
        
        if (batchId && batchNumber) {
          const normalizedId = normalizeId(batchId)
          nextBatchNameById[normalizedId] = batchNumber
          nextBatchNameById[batchId] = batchNumber
          // Always store unit if present, even if empty string to differentiate from undefined
          nextBatchUnitById[normalizedId] = unit
          nextBatchUnitById[batchId] = unit
        }
      }

      // Extract batch IDs from stock movement items to fill any missing data
      const missingBatchIds = new Set<string>()
      const filteredByLocation = (Array.isArray(data) ? data : []).filter((row) => {
        const rowLocationId = normalizeId(row.locationId)
        const rowLocationType = normalizeType(row.locationType)
        if (rowLocationId === normalizeId(currentWarehouseId) && rowLocationType === 'WAREHOUSE') {
          // Collect batch IDs from items
          for (const item of row.items ?? []) {
            if (item.batchId && !nextBatchNameById[normalizeId(item.batchId)] && !nextBatchNameById[item.batchId]) {
              missingBatchIds.add(item.batchId)
            }
          }
          return true
        }
        return false
      })

      // Try to fetch missing batch details
      if (missingBatchIds.size > 0) {
        const batchPromises = Array.from(missingBatchIds).map((batchId) =>
          ProductBatchAPIService.getById(batchId).catch(() => null)
        )
        const batchDetails = await Promise.all(batchPromises)
        
        for (const batchDetail of batchDetails) {
          if (batchDetail) {
            const batchId = String(batchDetail.id ?? '').trim()
            const batchNumber = String(batchDetail.batchNumber ?? '').trim()
            // Check multiple possible unit field names
            const unit = String(
              batchDetail.unit ??
              batchDetail.Unit ??
              (batchDetail as any)?.unitName ??
              (batchDetail as any)?.displayUnit ??
              ''
            ).trim()
            
            if (batchId && batchNumber) {
              const normalizedId = normalizeId(batchId)
              nextBatchNameById[normalizedId] = batchNumber
              nextBatchNameById[batchId] = batchNumber
              nextBatchUnitById[normalizedId] = unit
              nextBatchUnitById[batchId] = unit
            }
          }
        }
      }

      setBatchNameById(nextBatchNameById)
      setBatchUnitById(nextBatchUnitById)
      setRows(filteredByLocation)
    } catch (err: any) {
      setRows([])
      setProductNameById({})
      setBatchNameById({})
      setBatchUnitById({})
      setError(err?.response?.data?.message || err?.message || 'Không thể tải dữ liệu di chuyển hàng.')
    } finally {
      setLoading(false)
    }
  }, [currentWarehouseId])

  useEffect(() => {
    void loadRows()
  }, [loadRows])

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = rows.filter((row) => {
      const rowStatus = normalizeStatus(row.status)
      if (statusFilter !== 'ALL' && rowStatus !== statusFilter) return false

      if (q) {
        const searchTarget = [
          row.movementNumber,
          row.id,
          row.supplierName,
          row.transferId,
          row.restockRequestId,
        ]
          .map((v) => String(v ?? '').toLowerCase())
          .join(' ')

        if (!searchTarget.includes(q)) return false
      }

      if (fromDate || toDate) {
        const date = new Date(row.movementDate || row.createdAt || '')
        if (Number.isNaN(date.getTime())) return false

        if (fromDate) {
          const start = new Date(fromDate)
          if (date < start) return false
        }

        if (toDate) {
          const end = new Date(toDate)
          end.setHours(23, 59, 59, 999)
          if (date > end) return false
        }
      }

      return true
    })

    return filtered.sort((a, b) => {
      const da = new Date(a.movementDate || a.createdAt || '').getTime()
      const db = new Date(b.movementDate || b.createdAt || '').getTime()
      if (Number.isNaN(da)) return 1
      if (Number.isNaN(db)) return -1
      return db - da
    })
  }, [rows, search, statusFilter, fromDate, toDate])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, fromDate, toDate])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  const paginatedRows = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return filteredRows.slice(start, start + PAGE_SIZE)
  }, [filteredRows, safePage])

  const stats = useMemo(() => {
    const total = rows.length
    const completed = rows.filter((r) => normalizeStatus(r.status) === 'COMPLETED').length
    const outbound = rows.filter((r) => {
      const type = normalizeType(r.movementType)
      return type.includes('OUT') || type.includes('EXPORT') || type.includes('SHIP') || type.includes('TRANSFER_OUT')
    }).length
    const totalItems = rows.reduce((sum, r) => sum + Number(r.totalItems ?? 0), 0)
    return { total, completed, outbound, totalItems }
  }, [rows])

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          Đang tải dữ liệu di chuyển hàng...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Di chuyển hàng</h1>
          <p className="text-gray-600 mt-1">Theo dõi toàn bộ hoạt động nhập, xuất và điều chuyển tại kho hiện tại.</p>
        </div>
        <button
          onClick={() => void loadRows()}
          className="h-10 px-4 rounded-lg bg-[#2d6e3e] hover:bg-[#1e4d2b] text-white text-sm font-semibold"
        >
          Làm mới
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-500">Tổng phiếu</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-500">Phiếu hoàn thành</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{stats.completed.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-500">Phiếu xuất / chuyển ra</p>
          <p className="text-2xl font-bold text-orange-700 mt-1">{stats.outbound.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-500">Tổng dòng sản phẩm</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{stats.totalItems.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã phiếu, transfer, supplier..."
              className="w-full pl-9 pr-3 h-10 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as UiStatus)}
            className="h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Chờ xử lý</option>
            <option value="PROCESSING">Đang xử lý</option>
            <option value="COMPLETED">Hoàn thành</option>
            <option value="CANCELLED">Đã hủy</option>
            <option value="UNKNOWN">Không xác định</option>
          </select>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
            <span className="text-gray-400 text-sm">đến</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-gray-100 rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Mã phiếu</th>
                <th className="px-4 py-3 text-left">Loại</th>
                <th className="px-4 py-3 text-left">Trạng thái</th>
                <th className="px-4 py-3 text-left">Ngày di chuyển</th>
                <th className="px-4 py-3 text-right">Sản phẩm</th>
                <th className="px-4 py-3 text-center">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => {
                const typeMeta = getTypeMeta(row.movementType)
                const rowStatus = normalizeStatus(row.status)

                return (
                  <tr key={row.id} className="border-t border-gray-100 hover:bg-gray-50/60">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{row.movementNumber || row.id.slice(0, 10)}</p>
                      <p className="text-xs text-gray-500 font-mono">{normalizeId(row.locationId)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${typeMeta.className}`}>
                        {typeMeta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-full border text-xs font-semibold ${getStatusMeta(rowStatus)}`}>
                        {getStatusLabel(rowStatus)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{formatDate(row.movementDate)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{Number(row.totalItems ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelected(row)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
                      >
                        <Eye className="w-4 h-4" />
                        Xem
                      </button>
                    </td>
                  </tr>
                )
              })}

              {paginatedRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    Không có dữ liệu phù hợp bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-gray-500">
            Tổng <span className="font-semibold text-gray-700">{filteredRows.length}</span> kết quả
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="w-8 h-8 rounded-md border border-gray-200 text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 mx-auto" />
            </button>
            <span className="px-3 text-sm font-semibold text-gray-700">
              {safePage}/{totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="w-8 h-8 rounded-md border border-gray-200 text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4 mx-auto" />
            </button>
          </div>
        </div>
      </div>

      <MovementDetailModal
        row={selected}
        productNameById={productNameById}
        batchNameById={batchNameById}
        batchUnitById={batchUnitById}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
