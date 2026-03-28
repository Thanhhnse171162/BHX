'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Search,
  SlidersHorizontal,
  Eye,
  FileDown,
  Package,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { RestockAPIService, type RestockRequestFromAPI, type RestockRequestItem } from '@/services/restock-api.service'
import { useAuthStore } from '@/store/auth.store'
import { WarehouseAPIService } from '@/services/warehouse-api.service'
import { UserAPIService } from '@/services/user-api.service'
import { ToastContainer, type ToastItem } from '@/shared/ui/Toast'

type UiStatus = 'Tất cả' | 'Chờ duyệt' | 'Đã duyệt' | 'Đã từ chối' | 'Đang xử lý' | 'Hoàn tất'
type UiPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

const PAGE_SIZE = 10

function formatDateVI(value?: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function sumRequestedQty(req: RestockRequestFromAPI) {
  const items: RestockRequestItem[] = Array.isArray(req.items) ? req.items : []
  return items.reduce((sum, it) => sum + Number(it.requestedQuantity ?? 0), 0)
}

function toUiPriority(p?: string | null): UiPriority {
  const s = String(p ?? '').trim().toUpperCase()
  if (s === 'URGENT') return 'URGENT'
  if (s === 'HIGH') return 'HIGH'
  if (s === 'LOW') return 'LOW'
  return 'NORMAL'
}

function statusFromApiToUi(status?: string | null): Exclude<UiStatus, 'Tất cả'> {
  const s = String(status ?? '').trim().toUpperCase()
  if (s === 'APPROVED') return 'Đã duyệt'
  if (s === 'REJECTED') return 'Đã từ chối'
  if (s === 'PROCESSING') return 'Đang xử lý'
  if (s === 'COMPLETED') return 'Hoàn tất'
  return 'Chờ duyệt'
}

function isFromCentralWarehouse(request: RestockRequestFromAPI, parentWarehouseId?: string) {
  const fromId = String(request.fromWarehouseId ?? '').trim()
  if (!fromId) return true
  if (!parentWarehouseId) return false
  return fromId.toLowerCase() === String(parentWarehouseId).trim().toLowerCase()
}

function statusBadgeClass(ui: Exclude<UiStatus, 'Tất cả'>) {
  switch (ui) {
    case 'Chờ duyệt':
      return 'text-amber-600 bg-amber-50 border border-amber-200'
    case 'Đã duyệt':
      return 'text-green-600 bg-green-50 border border-green-200'
    case 'Đã từ chối':
      return 'text-red-500 bg-red-50 border border-red-200'
    case 'Đang xử lý':
      return 'text-indigo-700 bg-indigo-50 border border-indigo-200'
    case 'Hoàn tất':
      return 'text-emerald-700 bg-emerald-50 border border-emerald-200'
  }
}

function priorityDotClass(p: UiPriority) {
  switch (p) {
    case 'HIGH':
      return 'bg-blue-500'
    case 'URGENT':
      return 'bg-red-500'
    case 'LOW':
      return 'bg-emerald-500'
    case 'NORMAL':
    default:
      return 'bg-gray-400'
  }
}

function priorityTextClass(p: UiPriority) {
  switch (p) {
    case 'HIGH':
      return 'text-blue-600 font-semibold'
    case 'URGENT':
      return 'text-red-500 font-semibold'
    case 'LOW':
      return 'text-emerald-600 font-semibold'
    case 'NORMAL':
    default:
      return 'text-gray-500 font-medium'
  }
}

function PriorityPill({ priority }: { priority: UiPriority }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${priorityDotClass(priority)}`} />
      <span className={`text-xs ${priorityTextClass(priority)}`}>{priority}</span>
    </div>
  )
}

function StatusBadge({ ui }: { ui: Exclude<UiStatus, 'Tất cả'> }) {
  return (
    <span className={`text-[11px] font-semibold px-2 py-1 rounded-lg inline-flex items-center ${statusBadgeClass(ui)}`}>
      {ui}
    </span>
  )
}

export default function ReplenishmentAdminRequestsPage() {
  const { token, user } = useAuthStore()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [requests, setRequests] = useState<RestockRequestFromAPI[]>([])

  const [warehouseNameMap, setWarehouseNameMap] = useState<Record<string, string>>({})
  const [userNameMap, setUserNameMap] = useState<Record<string, string>>({})
  const [resolvedParentWarehouseId, setResolvedParentWarehouseId] = useState<string>('')
  const [parentWarehouseName, setParentWarehouseName] = useState<string>('Kho tổng')

  const [search, setSearch] = useState('')
  const [statusTab, setStatusTab] = useState<UiStatus>('Tất cả')

  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [filterWarehouseId, setFilterWarehouseId] = useState<string>('ALL')
  const [filterDateFrom, setFilterDateFrom] = useState<string>('')
  const [filterDateTo, setFilterDateTo] = useState<string>('')
  const [filterPriority, setFilterPriority] = useState<'ALL' | UiPriority>('ALL')

  const [page, setPage] = useState(1)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [detailRequest, setDetailRequest] = useState<RestockRequestFromAPI | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectReasonError, setRejectReasonError] = useState<string | null>(null)

  const pushToast = (t: Omit<ToastItem, 'id' | 'onClose'>) => {
    setToasts((prev) => [{ ...t, id: `${Date.now()}-${Math.random()}`, onClose: () => {} }, ...prev].slice(0, 3))
  }
  const removeToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id))

  const refreshRequests = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    setActionLoadingId(null)
    try {
      const isSystemAdmin = Number(user?.roleId) === 1
      const currentWarehouseId = String(user?.warehouseId ?? user?.workplaceId ?? '').trim()
      if (!currentWarehouseId && !isSystemAdmin) {
        setError('Tài khoản chưa được gán kho hợp lệ.')
        setRequests([])
        return
      }

      // System admin may not be bound to a warehouse. In that case, use global scope.
      if (!currentWarehouseId && isSystemAdmin) {
        setResolvedParentWarehouseId('')
        setParentWarehouseName('Kho tổng')

        const all = await RestockAPIService.getAll().catch(() => [])
        const scoped = Array.isArray(all)
          ? all.filter((r) => isFromCentralWarehouse(r))
          : []

        setRequests(scoped)

        const visibleWarehouseIds = Array.from(
          new Set(
            scoped
              .map((r) => String(r.toWarehouseId ?? '').trim())
              .filter(Boolean)
              .slice(0, 100),
          ),
        )

        const warehouses = await WarehouseAPIService.getAll().catch(() => [])
        const wMap: Record<string, string> = {}
        for (const id of visibleWarehouseIds) {
          const w = Array.isArray(warehouses) ? warehouses.find((x) => String(x.id) === id) : null
          wMap[id] = String(w?.name ?? w?.id ?? id)
        }
        setWarehouseNameMap(wMap)
        return
      }

      // Derive parentWarehouseId by warehouse hierarchy.
      const currentWarehouse = await WarehouseAPIService.getById(currentWarehouseId).catch(() => null)
      const parentWarehouseId = String(currentWarehouse?.parentId ?? currentWarehouse?.parent_id ?? currentWarehouseId).trim()
      setResolvedParentWarehouseId(parentWarehouseId)

      const parentWh = await WarehouseAPIService.getById(parentWarehouseId).catch(() => null)
      setParentWarehouseName(String(parentWh?.name ?? parentWh?.id ?? parentWarehouseId ?? 'Kho tổng'))

      // Managed scope: parent + its children warehouses.
      const children = await WarehouseAPIService.getChildren(parentWarehouseId).catch(() => [])
      const managedIds = new Set([parentWarehouseId, ...children.map((c) => String(c.id)).filter(Boolean)])

      let reqs: RestockRequestFromAPI[] = []
      // Prefer scoped endpoint. However, BE contract here was observed:
      // - Phiếu từ kho tổng gửi lên có `fromWarehouseId: null`
      // Therefore we must filter by `fromWarehouseId == null` when needed.
      try {
        reqs = await RestockAPIService.getByParentWarehouse(parentWarehouseId)
      } catch {
        reqs = []
      }

      const normalized = Array.isArray(reqs) ? reqs : []
      const fromNullOnly = normalized.filter((r) => {
        if (!isFromCentralWarehouse(r, parentWarehouseId)) return false
        // Limit to destination scope if BE did not already.
        const toId = r.toWarehouseId != null ? String(r.toWarehouseId) : ''
        return managedIds.size === 0 ? true : (toId ? managedIds.has(toId) : true)
      })

      // If scoped endpoint doesn't return the expected set (fromWarehouseId null),
      // fallback to GET /api/restock-requests and keep only fromWarehouseId null.
      if (fromNullOnly.length > 0) {
        reqs = fromNullOnly
      } else {
        const all = await RestockAPIService.getAll()
        reqs = Array.isArray(all)
          ? all.filter((r) => {
              if (!isFromCentralWarehouse(r, parentWarehouseId)) return false
              const toId = r.toWarehouseId != null ? String(r.toWarehouseId) : ''
              return managedIds.size === 0 ? true : (toId ? managedIds.has(toId) : true)
            })
          : []
      }

      setRequests(Array.isArray(reqs) ? reqs : [])

      const visibleWarehouseIds = Array.from(
        new Set([
          // even if fromWarehouseId is null, we want to resolve parentWarehouseName label
          parentWarehouseId,
          ...(Array.isArray(reqs) ? reqs : [])
            .map((r) => String(r.fromWarehouseId))
            .filter(Boolean)
            .slice(0, 50),
          ...(Array.isArray(reqs) ? reqs : []).map((r) => String(r.toWarehouseId)).filter(Boolean).slice(0, 50),
        ]),
      )

      const warehouses = await WarehouseAPIService.getAll().catch(() => [])
      const wMap: Record<string, string> = {}
      for (const id of visibleWarehouseIds) {
        const w = Array.isArray(warehouses) ? warehouses.find((x) => String(x.id) === id) : null
        wMap[id] = String(w?.name ?? w?.id ?? id)
      }
      setWarehouseNameMap(wMap)
    } catch {
      setError('Không thể tải danh sách yêu cầu. Vui lòng thử lại.')
      setRequests([])
    } finally {
      setLoading(false)
    }
  }, [token, user?.warehouseId, user?.workplaceId, user?.roleId])

  useEffect(() => {
    if (!token) return
    refreshRequests()
  }, [token, refreshRequests])

  useEffect(() => {
    if (!token || requests.length === 0) return
    const unresolvedUserIds = Array.from(
      new Set(
        requests
          .map((r) => String(r.requestedBy ?? '').trim())
          .filter(Boolean),
      ),
    ).filter((id) => !userNameMap[id])

    if (!unresolvedUserIds.length) return

    let cancelled = false
    ;(async () => {
      const entries = await Promise.all(
        unresolvedUserIds.map(async (id) => {
          try {
            const info = await UserAPIService.getIamDetailsById(id)
            const name = String(info?.fullName ?? info?.full_name ?? info?.name ?? info?.email ?? '').trim()
            return [id, name] as const
          } catch {
            return [id, ''] as const
          }
        }),
      )

      if (cancelled) return
      setUserNameMap((prev) => {
        const next = { ...prev }
        for (const [id, name] of entries) {
          if (name) next[id] = name
        }
        return next
      })
    })()

    return () => {
      cancelled = true
    }
  }, [token, requests, userNameMap])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const from = filterDateFrom ? new Date(filterDateFrom) : null
    const to = filterDateTo ? new Date(filterDateTo) : null

    return requests.filter((r) => {
      const uiStatus = statusFromApiToUi(r.status)

      if (statusTab !== 'Tất cả' && uiStatus !== statusTab) return false

      const effectiveFromWarehouseId = r.fromWarehouseId ?? resolvedParentWarehouseId
      if (filterWarehouseId !== 'ALL' && String(effectiveFromWarehouseId) !== String(filterWarehouseId)) return false

      const pr = toUiPriority(r.priority)
      if (filterPriority !== 'ALL' && pr !== filterPriority) return false

      const created = r.requestedDate ? new Date(r.requestedDate) : null
      if (from && created && created < from) return false
      if (to && created && created > new Date(to.setHours(23, 59, 59, 999))) return false

      if (!q) return true

      const requestCode = String(r.requestNumber || r.id)
      const warehouseName =
        r.fromWarehouseId != null ? warehouseNameMap[String(r.fromWarehouseId)] || String(r.fromWarehouseId || '') : parentWarehouseName
      const creatorId = String(r.requestedBy ?? '').trim()
      const creatorName = userNameMap[creatorId] || creatorId
      const reasonTotal = String(r.notes || '')

      const inHeader =
        requestCode.toLowerCase().includes(q) ||
        warehouseName.toLowerCase().includes(q) ||
        creatorName.toLowerCase().includes(q) ||
        reasonTotal.toLowerCase().includes(q)

      return inHeader
    })
  }, [
    requests,
    search,
    statusTab,
    filterWarehouseId,
    filterDateFrom,
    filterDateTo,
    filterPriority,
    warehouseNameMap,
    userNameMap,
    resolvedParentWarehouseId,
    parentWarehouseName,
  ])

  const getCreatorLabel = (id?: string | null) => {
    const creatorId = String(id ?? '').trim()
    if (!creatorId) return '—'
    return userNameMap[creatorId] || creatorId
  }

  useEffect(() => {
    setPage(1)
  }, [search, statusTab, filterWarehouseId, filterDateFrom, filterDateTo, filterPriority])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const paged = useMemo(() => {
    return filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  }, [filtered, safePage])

  const totalStats = useMemo(() => {
    const total = requests.length
    const pending = requests.filter((r) => statusFromApiToUi(r.status) === 'Chờ duyệt').length
    const approved = requests.filter((r) => statusFromApiToUi(r.status) === 'Đã duyệt').length
    const rejected = requests.filter((r) => statusFromApiToUi(r.status) === 'Đã từ chối').length
    return { total, pending, approved, rejected }
  }, [requests])

  const onExportExcel = () => {
    pushToast({
      type: 'info',
      message: 'Tính năng xuất Excel cho module này chưa được cấu hình.',
    })
  }

  const openDetail = async (id: string) => {
    if (!id) return
    setDetailOpen(true)
    setDetailLoading(true)
    setDetailError(null)
    setRejectReason('')
    setRejectReasonError(null)
    try {
      const detail = await RestockAPIService.getById(id)
      if (!detail) {
        setDetailRequest(null)
        setDetailError('Không tìm thấy chi tiết yêu cầu.')
        return
      }
      setDetailRequest(detail)
    } catch {
      setDetailRequest(null)
      setDetailError('Không thể tải chi tiết yêu cầu.')
    } finally {
      setDetailLoading(false)
    }
  }

  const onApprove = async (requestId: string) => {
    if (!requestId) return
    if (actionLoadingId) return
    setActionLoadingId(requestId)
    try {
      await RestockAPIService.approve(requestId)
      pushToast({ type: 'success', message: 'Duyệt yêu cầu thành công!' })
      await refreshRequests()
      setDetailOpen(false)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Không thể duyệt yêu cầu.'
      pushToast({ type: 'error', message: msg })
    } finally {
      setActionLoadingId(null)
    }
  }

  const onReject = async (requestId: string, reason: string) => {
    if (!requestId) return
    if (actionLoadingId) return

    const normalizedReason = String(reason ?? '').trim()
    if (!normalizedReason) {
      setRejectReasonError('Vui lòng nhập lý do từ chối.')
      return
    }
    setRejectReasonError(null)

    setActionLoadingId(requestId)
    try {
      await RestockAPIService.reject(requestId, normalizedReason)
      pushToast({ type: 'success', message: 'Từ chối yêu cầu thành công!' })
      await refreshRequests()
      setDetailOpen(false)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Không thể từ chối yêu cầu.'
      pushToast({ type: 'error', message: msg })
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/80 p-6">
      {toasts.length > 0 && <ToastContainer toasts={toasts} onRemove={removeToast} />}

      {detailOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm p-4 flex items-center justify-center" onClick={() => setDetailOpen(false)}>
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Chi tiết yêu cầu nhập hàng</h3>
                <p className="text-xs text-gray-400 mt-1">{detailRequest?.requestNumber || detailRequest?.id || '—'}</p>
              </div>
              <button
                onClick={() => setDetailOpen(false)}
                className="text-gray-300 hover:text-gray-500 transition-colors p-1 rounded-lg hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {detailLoading ? (
                <div className="py-10 text-center text-sm text-gray-400">Đang tải chi tiết...</div>
              ) : detailError ? (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{detailError}</div>
              ) : detailRequest ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Trạng thái</p>
                      <p className="text-sm font-semibold text-gray-800 mt-1">{statusFromApiToUi(detailRequest.status)}</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Kho gửi</p>
                      <p className="text-sm font-semibold text-gray-800 mt-1">
                        {detailRequest.fromWarehouseId != null
                          ? warehouseNameMap[String(detailRequest.fromWarehouseId)] || String(detailRequest.fromWarehouseId)
                          : parentWarehouseName}
                      </p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Người tạo</p>
                      <p className="text-sm font-semibold text-gray-800 mt-1">{getCreatorLabel(detailRequest.requestedBy)}</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Ngày tạo</p>
                      <p className="text-sm font-semibold text-gray-800 mt-1">{formatDateVI(detailRequest.requestedDate)}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 border-b border-gray-200 grid grid-cols-[1fr_120px_120px_1fr] gap-2 px-4 py-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sản phẩm</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">SL yêu cầu</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tồn hiện có</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Lý do</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {(detailRequest.items || []).map((it) => (
                        <div key={it.id} className="grid grid-cols-[1fr_120px_120px_1fr] gap-2 px-4 py-3 items-center">
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{it.productName || it.productId}</p>
                            <p className="text-[11px] text-gray-400">{it.unit || '—'}</p>
                          </div>
                          <p className="text-sm font-bold text-gray-800">{Number(it.requestedQuantity || 0).toLocaleString()}</p>
                          <p className="text-sm text-gray-600">{Number(it.currentQuantity || 0).toLocaleString()}</p>
                          <p className="text-sm text-gray-600">{it.reason || '—'}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {statusFromApiToUi(detailRequest.status) === 'Chờ duyệt' && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Lý do từ chối</label>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => {
                          setRejectReason(e.target.value)
                          if (rejectReasonError) setRejectReasonError(null)
                        }}
                        rows={2}
                        placeholder="Nhập lý do khi từ chối yêu cầu..."
                        className={`w-full border rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 ${
                          rejectReasonError ? 'border-red-300 bg-red-50/30' : 'border-gray-200'
                        }`}
                      />
                      {rejectReasonError && (
                        <p className="mt-2 text-xs text-red-600 font-semibold">{rejectReasonError}</p>
                      )}
                      <div className="flex items-center justify-end gap-2 mt-3">
                        <button
                          onClick={() => onReject(String(detailRequest.id), rejectReason)}
                          disabled={actionLoadingId === String(detailRequest.id) || !rejectReason.trim()}
                          className="h-8 px-3 text-xs font-bold rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoadingId === String(detailRequest.id) ? <Loader2 size={12} className="animate-spin" /> : 'Từ chối'}
                        </button>
                        <button
                          onClick={() => onApprove(String(detailRequest.id))}
                          disabled={actionLoadingId === String(detailRequest.id)}
                          className="h-8 px-3 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {actionLoadingId === String(detailRequest.id) ? <Loader2 size={12} className="animate-spin" /> : 'Duyệt'}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-5">
        {user?.roleId !== 1 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
            Bạn không có quyền truy cập màn này. (Yêu cầu roleId = 1)
          </div>
        )}
        {/* Breadcrumb + Title */}
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <span className="text-blue-600 font-semibold">Admin</span>
              <span>/</span>
              <span className="truncate">Yêu cầu nhập hàng</span>
              <span>/</span>
              <span className="text-gray-400">Danh sách</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-1">Danh sách yêu cầu nhập hàng</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onExportExcel}
              className="flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
              title="Export Excel"
            >
              <FileDown size={16} />
              Excel
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wide">Tổng số yêu cầu</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalStats.total}</p>
          </div>
          <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-sm">
            <p className="text-[11px] text-amber-700 font-bold uppercase tracking-wide">Chờ duyệt</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{totalStats.pending}</p>
          </div>
          <div className="bg-white rounded-xl border border-green-200 p-4 shadow-sm">
            <p className="text-[11px] text-green-700 font-bold uppercase tracking-wide">Đã duyệt</p>
            <p className="text-2xl font-bold text-green-700 mt-1">{totalStats.approved}</p>
          </div>
          <div className="bg-white rounded-xl border border-red-200 p-4 shadow-sm">
            <p className="text-[11px] text-red-700 font-bold uppercase tracking-wide">Đã từ chối</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{totalStats.rejected}</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
          <div className="flex items-end gap-5 flex-wrap">
            <div className="w-72 flex-shrink-0">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Tìm kiếm
              </label>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm mã phiếu, kho gửi, người tạo, ghi chú..."
                  className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 placeholder:text-gray-300 transition-all"
                />
              </div>
            </div>

            <div className="flex-1 min-w-[320px]">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Trạng thái yêu cầu</p>
              <div className="flex items-center gap-1 flex-wrap">
                {(['Tất cả', 'Chờ duyệt', 'Đã duyệt', 'Đã từ chối', 'Đang xử lý', 'Hoàn tất'] as UiStatus[]).map((tab) => {
                  const count =
                    tab === 'Tất cả'
                      ? requests.length
                      : requests.filter((r) => statusFromApiToUi(r.status) === tab).length
                  return (
                    <button
                      key={tab}
                      onClick={() => setStatusTab(tab)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        statusTab === tab ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      {tab}
                      <span
                        className={`text-[10px] rounded-full px-1.5 py-0.5 font-bold leading-none ${
                          statusTab === tab ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <button
              onClick={() => setAdvancedOpen((v) => !v)}
              className="flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors flex-shrink-0"
            >
              <SlidersHorizontal size={13} />
              Lọc nâng cao
            </button>
          </div>

          {advancedOpen && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Kho gửi</label>
                  <select
                    value={filterWarehouseId}
                    onChange={(e) => setFilterWarehouseId(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="ALL">Tất cả kho</option>
                    {Object.entries(warehouseNameMap).map(([id, name]) => (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Ngày tạo</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={filterDateFrom}
                      onChange={(e) => setFilterDateFrom(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <span className="text-gray-400 text-xs">-</span>
                    <input
                      type="date"
                      value={filterDateTo}
                      onChange={(e) => setFilterDateTo(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Mức ưu tiên</label>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value as any)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="ALL">Tất cả</option>
                    <option value="LOW">LOW</option>
                    <option value="NORMAL">NORMAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => {
                    setFilterWarehouseId('ALL')
                    setFilterDateFrom('')
                    setFilterDateTo('')
                    setFilterPriority('ALL')
                    setStatusTab('Tất cả')
                    setSearch('')
                  }}
                  className="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Xóa
                </button>
                <button
                  onClick={() => setAdvancedOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
                >
                  Áp dụng
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3 text-sm text-red-700">
            <span>{error}</span>
            <button
              onClick={() => {
                setError(null)
                refreshRequests()
              }}
              className="text-xs underline hover:no-underline font-semibold"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-[#0f1f3d]">
            <div className="grid grid-cols-[110px_130px_180px_90px_120px_90px_110px_minmax(250px,1fr)] gap-2 px-6 py-3.5">
              {[
                'Mã yêu cầu',
                'Kho gửi',
                'Người tạo',
                'Số mặt hàng',
                'Tổng SL yêu cầu',
                'Ưu tiên',
                'Ngày tạo',
                'Trạng thái / Thao tác',
              ].map((h) => (
                <span key={h} className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-tight">
                  {h}
                </span>
              ))}
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="grid grid-cols-[110px_130px_180px_90px_120px_90px_110px_minmax(250px,1fr)] gap-2 px-6 py-4 items-center">
                  {Array.from({ length: 8 }).map((__, j) => (
                    <div key={j} className="h-4 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <Package size={34} className="mx-auto text-gray-200 mb-3" />
                <p className="text-gray-400 text-sm font-medium">Không có yêu cầu nào phù hợp với bộ lọc</p>
              </div>
            ) : (
              paged.map((r) => {
                const uiStatus = statusFromApiToUi(r.status)
                const pr = toUiPriority(r.priority)
                const totalQty = sumRequestedQty(r)
                const totalItems = Array.isArray(r.items) ? r.items.length : 0
                const requestCode = String(r.requestNumber || r.id)
                const warehouseName =
                  r.fromWarehouseId != null ? warehouseNameMap[String(r.fromWarehouseId)] || String(r.fromWarehouseId || '') : parentWarehouseName
                const createdByName = getCreatorLabel(r.requestedBy)

                return (
                  <div
                    key={r.id}
                    className="grid grid-cols-[110px_130px_180px_90px_120px_90px_110px_minmax(250px,1fr)] gap-2 px-6 py-4 items-center hover:bg-blue-50/20 transition-colors"
                  >
                    <span className="text-[11px] font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                      {requestCode}
                    </span>
                    <span className="text-sm font-semibold text-gray-800">{warehouseName || '—'}</span>
                    <span className="text-sm font-semibold text-gray-800">{createdByName || '—'}</span>
                    <span className="text-sm font-bold text-gray-900">{totalItems}</span>
                    <span className="text-sm font-bold text-gray-900">{totalQty.toLocaleString()}</span>
                    <PriorityPill priority={pr} />
                    <span className="text-sm text-gray-500 whitespace-nowrap">{formatDateVI(r.requestedDate)}</span>
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <StatusBadge ui={uiStatus} />
                      <button
                        onClick={() => openDetail(String(r.id))}
                        className="flex items-center justify-center text-gray-400 hover:text-blue-600 border border-gray-200 hover:border-blue-200 transition-colors w-7 h-7 rounded-lg hover:bg-blue-50/60 flex-shrink-0"
                        title="Xem chi tiết"
                      >
                        <Eye size={13} />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Pagination */}
          <div className="px-6 py-3.5 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <p className="text-xs text-gray-400">
              Hiển thị{' '}
              <span className="font-bold text-gray-600">
                {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}-
                {Math.min(safePage * PAGE_SIZE, filtered.length)}
              </span>{' '}
              của <span className="font-bold text-gray-600">{filtered.length}</span> yêu cầu
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={13} />
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const n = totalPages <= 7 ? i + 1 : Math.min(totalPages, Math.max(1, safePage - 3 + i))
                return n
              })
                .filter((v, i, arr) => arr.indexOf(v) === i)
                .map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                      p === safePage ? 'bg-blue-600 text-white shadow-sm' : 'border border-gray-200 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

