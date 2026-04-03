'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Eye, Loader2, RefreshCw, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import useAuthStore from '@/store/auth.store'
import { StockMovementAPIService, type StockMovementFromAPI } from '@/services/stock-movement-api.service'
import { ProductAPIService } from '@/services/product-api.service'
import { ProductBatchAPIService } from '@/services/product-batch-api.service'

function normalizeId(value?: string | null): string {
  return String(value || '').trim().toLowerCase()
}

function normalizeText(value?: string | null): string {
  return String(value || '').trim().toUpperCase()
}

function formatDateTime(value?: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('vi-VN')
}

function movementTypeLabel(type?: string | null): string {
  const normalized = normalizeText(type)
  if (normalized === 'INBOUND') return 'Nhập kho'
  if (normalized === 'OUTBOUND') return 'Xuất kho'
  if (normalized === 'TRANSFER') return 'Điều chuyển'
  return normalized || 'Không xác định'
}

function movementStatusLabel(status?: string | null): string {
  const normalized = normalizeText(status)
  if (normalized === 'COMPLETED') return 'Hoàn thành'
  if (normalized === 'PROCESSING') return 'Đang xử lý'
  if (normalized === 'PENDING') return 'Chờ xử lý'
  if (normalized === 'CANCELLED') return 'Đã hủy'
  return normalized || 'Không xác định'
}

function statusClass(status?: string | null): string {
  const normalized = normalizeText(status)
  if (normalized === 'COMPLETED') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (normalized === 'PROCESSING') return 'bg-blue-50 text-blue-700 border-blue-200'
  if (normalized === 'PENDING') return 'bg-amber-50 text-amber-700 border-amber-200'
  if (normalized === 'CANCELLED') return 'bg-red-50 text-red-700 border-red-200'
  return 'bg-gray-50 text-gray-700 border-gray-200'
}

export default function StoreManagerTransfersPage() {
  const { user } = useAuthStore()

  const workplaceId = String(
    user?.workplaceId ||
      (user as any)?.workplace_id ||
      (user as any)?.workplace?.id ||
      user?.storeId ||
      ''
  ).trim()

  const [rows, setRows] = useState<StockMovementFromAPI[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [movementTypeFilter, setMovementTypeFilter] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [selected, setSelected] = useState<StockMovementFromAPI | null>(null)

  const [productNameById, setProductNameById] = useState<Record<string, string>>({})
  const [batchNumberById, setBatchNumberById] = useState<Record<string, string>>({})

  const PAGE_SIZE = 10

  const fetchData = useCallback(async () => {
    if (!workplaceId) {
      setRows([])
      setError('Tài khoản chưa được gán cửa hàng để xem di chuyển hàng.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const [allMovements, products, batches] = await Promise.all([
        StockMovementAPIService.getByLocation(workplaceId),
        ProductAPIService.getAllProducts().catch(() => []),
        ProductBatchAPIService.getByWarehouse(workplaceId).catch(() => []),
      ])

      const nextProductMap: Record<string, string> = {}
      for (const p of products ?? []) {
        const id = normalizeId((p as any)?.id)
        const name = String((p as any)?.name ?? '').trim()
        if (id && name) nextProductMap[id] = name
      }
      setProductNameById(nextProductMap)

      const nextBatchMap: Record<string, string> = {}
      for (const b of batches ?? []) {
        const id = normalizeId((b as any)?.id)
        const batchNumber = String((b as any)?.batchNumber ?? '').trim()
        if (id && batchNumber) nextBatchMap[id] = batchNumber
      }
      setBatchNumberById(nextBatchMap)

      const currentLocationKey = normalizeId(workplaceId)
      const scopedRows = (allMovements ?? []).filter((movement) => {
        const movementLocationId = normalizeId(movement.locationId)
        const movementLocationType = normalizeText(movement.locationType)
        return movementLocationId === currentLocationKey && movementLocationType === 'STORE'
      })

      setRows(scopedRows)
    } catch (e: any) {
      setRows([])
      setError(e?.response?.data?.message || e?.message || 'Không thể tải dữ liệu di chuyển hàng.')
    } finally {
      setIsLoading(false)
    }
  }, [workplaceId])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()

    const filtered = rows.filter((row) => {
      if (statusFilter !== 'ALL' && normalizeText(row.status) !== statusFilter) return false
      if (movementTypeFilter !== 'ALL' && normalizeText(row.movementType) !== movementTypeFilter) return false

      if (!q) return true
      const joined = [
        row.movementNumber,
        row.id,
        row.movementType,
        row.transferId,
        row.restockRequestId,
      ]
        .map((x) => String(x || '').toLowerCase())
        .join(' ')

      return joined.includes(q)
    })

    return filtered.sort((a, b) => {
      const da = new Date(a.movementDate || a.createdAt || '').getTime()
      const db = new Date(b.movementDate || b.createdAt || '').getTime()
      if (Number.isNaN(da)) return 1
      if (Number.isNaN(db)) return -1
      return db - da
    })
  }, [rows, search, statusFilter, movementTypeFilter])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, movementTypeFilter])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const start = (safePage - 1) * PAGE_SIZE
  const paginatedRows = filteredRows.slice(start, start + PAGE_SIZE)

  const stats = useMemo(() => {
    const total = rows.length
    const completed = rows.filter((r) => normalizeText(r.status) === 'COMPLETED').length
    const totalItems = rows.reduce((sum, r) => sum + Number(r.totalItems || 0), 0)
    return { total, completed, totalItems }
  }, [rows])

  return (
    <div className="p-6 space-y-4 bg-[#f5f7fb] min-h-screen">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[30px] leading-[32px] font-extrabold text-slate-900">Di chuyển hàng</h1>
          <p className="text-[13px] text-slate-500">Theo dõi các phiếu nhập, xuất, điều chuyển của cửa hàng hiện tại.</p>
        </div>
        <button
          onClick={() => void fetchData()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
          disabled={isLoading}
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Làm mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-[12px] text-slate-500 font-semibold">Tổng phiếu</p>
          <p className="text-[30px] font-extrabold text-slate-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-[12px] text-slate-500 font-semibold">Hoàn thành</p>
          <p className="text-[30px] font-extrabold text-emerald-600 mt-1">{stats.completed}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-[12px] text-slate-500 font-semibold">Tổng dòng sản phẩm</p>
          <p className="text-[30px] font-extrabold text-blue-600 mt-1">{stats.totalItems}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide">
              Loại di chuyển
              <select
                value={movementTypeFilter}
                onChange={(e) => setMovementTypeFilter(e.target.value)}
                className="block mt-1 min-w-[180px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-700 outline-none"
              >
                <option value="ALL">Tất cả</option>
                <option value="INBOUND">Nhập kho</option>
                <option value="OUTBOUND">Xuất kho</option>
                <option value="TRANSFER">Điều chuyển</option>
              </select>
            </label>

            <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide">
              Trạng thái
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block mt-1 min-w-[180px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-700 outline-none"
              >
                <option value="ALL">Tất cả</option>
                <option value="PENDING">Chờ xử lý</option>
                <option value="PROCESSING">Đang xử lý</option>
                <option value="COMPLETED">Hoàn thành</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
            </label>

            <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide">
              Tìm kiếm
              <div className="relative mt-1 min-w-[320px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Mã phiếu, transfer id..."
                  className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-[13px] text-slate-700 outline-none"
                />
              </div>
            </label>
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 flex items-center justify-center text-slate-500">
            <Loader2 size={18} className="animate-spin mr-2" /> Đang tải dữ liệu...
          </div>
        ) : error ? (
          <div className="py-8 px-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 uppercase text-[11px] tracking-wide">
                  <tr>
                    <th className="text-left py-3 px-4">Mã phiếu</th>
                    <th className="text-left py-3 px-4">Loại</th>
                    <th className="text-left py-3 px-4">Trạng thái</th>
                    <th className="text-left py-3 px-4">Ngày di chuyển</th>
                    <th className="text-right py-3 px-4">Sản phẩm</th>
                    <th className="text-center py-3 px-4">Chi tiết</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-800">{row.movementNumber || row.id.slice(0, 8)}</p>
                        <p className="text-xs text-slate-500">{row.id.slice(0, 12)}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{movementTypeLabel(row.movementType)}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full border text-xs font-semibold ${statusClass(row.status)}`}>
                          {movementStatusLabel(row.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{formatDateTime(row.movementDate)}</td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-900">{Number(row.totalItems || 0).toLocaleString('vi-VN')}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelected(row)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                        >
                          <Eye size={14} /> Xem
                        </button>
                      </td>
                    </tr>
                  ))}

                  {paginatedRows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400">Không có dữ liệu phù hợp.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-4">
              <p className="text-[12px] text-slate-500">
                Hiển thị {filteredRows.length === 0 ? 0 : start + 1}-{Math.min(start + PAGE_SIZE, filteredRows.length)} trên {filteredRows.length} phiếu
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-slate-200 text-slate-500 disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm text-slate-700 min-w-[70px] text-center">{safePage}/{totalPages}</span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-slate-200 text-slate-500 disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Chi tiết phiếu di chuyển</h3>
                <p className="text-sm text-slate-500">{selected.movementNumber || selected.id}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-sm px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700">
                Đóng
              </button>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Loại</p>
                  <p className="font-semibold text-slate-900 mt-1">{movementTypeLabel(selected.movementType)}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Trạng thái</p>
                  <p className="font-semibold text-slate-900 mt-1">{movementStatusLabel(selected.status)}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Ngày</p>
                  <p className="font-semibold text-slate-900 mt-1">{formatDateTime(selected.movementDate)}</p>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-xs tracking-wider">
                    <tr>
                      <th className="px-4 py-3 text-left">Sản phẩm</th>
                      <th className="px-4 py-3 text-left">Lô hàng</th>
                      <th className="px-4 py-3 text-left">Đơn vị</th>
                      <th className="px-4 py-3 text-right">Số lượng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selected.items || []).map((item) => {
                      const productName =
                        String(item.productName || '').trim() ||
                        productNameById[normalizeId(item.productId)] ||
                        item.productId
                      const batchName = item.batchId
                        ? batchNumberById[normalizeId(item.batchId)] || item.batchId
                        : '—'

                      return (
                        <tr key={item.id} className="border-t border-slate-100">
                          <td className="px-4 py-3 text-slate-800">{productName}</td>
                          <td className="px-4 py-3 text-slate-700">{batchName}</td>
                          <td className="px-4 py-3 text-slate-700">{item.unit || '—'}</td>
                          <td className="px-4 py-3 text-right text-slate-900 font-semibold">{Number(item.quantity || 0).toLocaleString('vi-VN')}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
