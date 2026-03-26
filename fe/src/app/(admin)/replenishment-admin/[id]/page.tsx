'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Package,
  ChevronLeft,
  Loader2,
} from 'lucide-react'
import { RestockAPIService, type RestockRequestFromAPI, type RestockRequestItem } from '@/services/restock-api.service'
import { useAuthStore } from '@/store/auth.store'
import { WarehouseAPIService } from '@/services/warehouse-api.service'
import { ReplenishmentProductAPIService } from '@/services/replenishment-product-api.service'
import Modal from '@/shared/ui/Modal'
import { ToastContainer, type ToastItem } from '@/shared/ui/Toast'

type UiStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSING' | 'COMPLETED'
type UiPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

function formatDateVI(value?: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function toUiPriority(p?: string | null): UiPriority {
  const s = String(p ?? '').trim().toUpperCase()
  if (s === 'URGENT') return 'URGENT'
  if (s === 'HIGH') return 'HIGH'
  if (s === 'LOW') return 'LOW'
  return 'NORMAL'
}

function statusBadge(ui: UiStatus) {
  if (ui === 'PENDING') return 'text-amber-600 bg-amber-50 border border-amber-200'
  if (ui === 'APPROVED') return 'text-green-600 bg-green-50 border border-green-200'
  if (ui === 'PROCESSING') return 'text-indigo-700 bg-indigo-50 border border-indigo-200'
  if (ui === 'COMPLETED') return 'text-emerald-700 bg-emerald-50 border border-emerald-200'
  return 'text-red-500 bg-red-50 border border-red-200'
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

function StatusBadge({ status }: { status: UiStatus }) {
  const mapLabel: Record<UiStatus, string> = {
    PENDING: 'Chờ duyệt',
    APPROVED: 'Đã duyệt',
    REJECTED: 'Đã từ chối',
    PROCESSING: 'Đang xử lý',
    COMPLETED: 'Hoàn tất',
  }
  return (
    <span className={`text-[11px] font-semibold px-2 py-1 rounded-lg inline-flex items-center ${statusBadge(status)}`}>
      {mapLabel[status]}
    </span>
  )
}

function safeNonEmpty(s?: string | null) {
  return String(s ?? '').trim()
}

export default function ReplenishmentAdminDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { token, user } = useAuthStore()

  const requestId = useMemo(() => String(params?.id ?? '').trim(), [params])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [request, setRequest] = useState<RestockRequestFromAPI | null>(null)

  const [warehouseNameMap, setWarehouseNameMap] = useState<Record<string, string>>({})
  const [productSkuMap, setProductSkuMap] = useState<Record<string, string>>({})
  const [productUnitMap, setProductUnitMap] = useState<Record<string, string>>({})
  const [productNameMap, setProductNameMap] = useState<Record<string, string>>({})

  const [rejectReason, setRejectReason] = useState('')

  const [actionLoading, setActionLoading] = useState<'approve' | 'reject' | null>(null)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null)

  const [toasts, setToasts] = useState<ToastItem[]>([])
  const pushToast = useCallback((t: Omit<ToastItem, 'id' | 'onClose'>) => {
    setToasts((prev) => [{ ...t, id: `${Date.now()}-${Math.random()}`, onClose: () => {} }, ...prev].slice(0, 3))
  }, [])
  const removeToast = useCallback((id: string) => setToasts((prev) => prev.filter((t) => t.id !== id)), [])

  const uiStatus = useMemo((): UiStatus => {
    const s = String(request?.status ?? '').trim().toUpperCase()
    if (s === 'APPROVED') return 'APPROVED'
    if (s === 'REJECTED') return 'REJECTED'
    if (s === 'PROCESSING') return 'PROCESSING'
    if (s === 'COMPLETED') return 'COMPLETED'
    return 'PENDING'
  }, [request])

  const uiPriority = useMemo(() => toUiPriority(request?.priority ?? null), [request?.priority])

  const loadAll = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)

    try {
      const detail = await RestockAPIService.getById(requestId)
      setRequest(detail)
      if (!detail) {
        setError('Không tìm thấy yêu cầu. Vui lòng kiểm tra lại mã phiếu.')
        return
      }

      // Warehouses: map only needed ids (best-effort)
      const ids = Array.from(new Set([detail.fromWarehouseId, detail.toWarehouseId].filter(Boolean)))
      const wMap: Record<string, string> = {}
      await Promise.all(
        ids.map(async (id) => {
          const w = await WarehouseAPIService.getById(String(id)).catch(() => null)
          if (w?.id) wMap[String(w.id)] = String(w.name ?? w.id)
        })
      )
      setWarehouseNameMap(wMap)

      // Enrich SKU/unit/name using details-batch (best-effort).
      // Backend response schema is NOT confirmed → adapter in service normalizes defensively.
      const items = Array.isArray(detail.items) ? detail.items : []
      const productIds = items.map((it) => String(it.productId || '').trim()).filter(Boolean)
      const enrich = (await ReplenishmentProductAPIService.detailsBatch(productIds).catch(() => ({}))) as Record<
        string,
        Partial<import('@/services/replenishment-product-api.service').CatalogProductFromAPI>
      >

      const skuMap: Record<string, string> = {}
      const unitMap: Record<string, string> = {}
      const nameMap: Record<string, string> = {}
      for (const pid of productIds) {
        const e = enrich[String(pid)]
        if (e?.sku) skuMap[pid] = String(e.sku)
        if (e?.unit) unitMap[pid] = String(e.unit)
        if (e?.name) nameMap[pid] = String(e.name)
      }
      setProductSkuMap(skuMap)
      setProductUnitMap(unitMap)
      setProductNameMap(nameMap)
    } catch (e) {
      setError('Không thể tải chi tiết yêu cầu. Vui lòng thử lại.')
      setRequest(null)
    } finally {
      setLoading(false)
    }
  }, [token, requestId])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const onClickApprove = () => {
    if (!request) return
    if (uiStatus !== 'PENDING') return
    setConfirmAction('approve')
    setConfirmOpen(true)
  }

  const onClickReject = () => {
    if (!request) return
    if (uiStatus !== 'PENDING') return
    setConfirmAction('reject')
    setConfirmOpen(true)
  }

  const submitApproveReject = async () => {
    if (!request) return

    try {
      if (!confirmAction) return
      setActionLoading(confirmAction)

      if (confirmAction === 'approve') {
        await RestockAPIService.approve(String(request.id))
        pushToast({ type: 'success', message: 'Duyệt yêu cầu thành công!' })
        setConfirmOpen(false)
        setRejectReason('')
        router.push('/replenishment-admin')
        return
      }

      if (confirmAction === 'reject') {
        const reason = safeNonEmpty(rejectReason)
        if (!reason) {
          pushToast({ type: 'warning', message: 'Vui lòng nhập lý do từ chối.' })
          setActionLoading(null)
          return
        }
        await RestockAPIService.reject(String(request.id), reason)
        pushToast({ type: 'success', message: 'Từ chối yêu cầu thành công!' })
        setConfirmOpen(false)
        setRejectReason('')
        router.push('/replenishment-admin')
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Không thể cập nhật trạng thái. Vui lòng thử lại.'
      pushToast({ type: 'error', message: msg })
    } finally {
      setActionLoading(null)
    }
  }

  const lineItems: RestockRequestItem[] = Array.isArray(request?.items) ? request!.items : []

  const warehouseName = request ? warehouseNameMap[String(request.fromWarehouseId)] || String(request.fromWarehouseId || '') : '—'
  const createdByName = request ? String(request.requestedBy || '—') : '—'

  const rejectReasonResolved = useMemo(() => {
    if (!request) return ''
    const anyReq = request as any
    return safeNonEmpty(
      anyReq.rejectReason ??
        anyReq.rejectionReason ??
        anyReq.reason ??
        anyReq.reject_reason ??
        anyReq.rejectReasonText ??
        request.notes
    )
  }, [request])

  const approvedByName = request
    ? String((request as any).approvedByName || request.approvedBy || '—')
    : '—'
  const rejectedByName = request
    ? String((request as any).rejectedByName || (request as any).rejectedBy || '—')
    : '—'

  return (
    <div className="min-h-screen bg-gray-50/80 p-6">
      {toasts.length > 0 && <ToastContainer toasts={toasts} onRemove={removeToast} />}

      <div className="max-w-6xl mx-auto space-y-5">
        {/* Role guard */}
        {user?.roleId !== 1 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
            Bạn không có quyền truy cập màn này. (Yêu cầu roleId = 1)
          </div>
        )}

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <button
            onClick={() => router.push('/replenishment-admin')}
            className="inline-flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
            title="Quay lại danh sách"
          >
            <ChevronLeft size={16} />
            Danh sách
          </button>
          <span>/</span>
          <span className="truncate font-semibold text-gray-700">Chi tiết yêu cầu nhập hàng</span>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3 text-sm text-red-700">
            <span>{error}</span>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 text-gray-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              Đang tải chi tiết...
            </div>
          </div>
        )}

        {!loading && request && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-[280px]">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-xl font-bold text-gray-900 font-mono">{request.requestNumber || request.id}</h1>
                    <StatusBadge status={uiStatus} />
                    <PriorityPill priority={uiPriority} />
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    <span className="font-semibold text-gray-700">Kho gửi:</span> {warehouseName}
                    <span className="mx-2 text-gray-300">•</span>
                    <span className="font-semibold text-gray-700">Người tạo:</span> {createdByName}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                {/* Left: details / line items */}
                <div className="xl:col-span-3 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Ngày tạo</p>
                      <p className="mt-1 text-gray-900 font-semibold">{formatDateVI(request.requestedDate)}</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Mức độ ưu tiên</p>
                      <p className="mt-1">{uiPriority}</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 md:col-span-2">
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Ghi chú chung</p>
                      <p className="mt-2 text-sm text-gray-800">{safeNonEmpty(request.notes) || '—'}</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                          <Package size={16} className="text-blue-600" />
                        </div>
                        <h2 className="text-sm font-bold text-gray-900">Danh sách sản phẩm trong yêu cầu</h2>
                      </div>
                      <span className="text-xs text-gray-500">{lineItems.length} sản phẩm</span>
                    </div>

                    <div className="rounded-2xl overflow-hidden border border-gray-200">
                      {/* header */}
                      <div className="bg-[#0f1f3d] px-6 py-3.5">
                        <div className="grid grid-cols-[110px_1fr_120px_120px_120px_140px_1fr] gap-3 items-center">
                          {['SKU', 'TÊN SẢN PHẨM', 'ĐƠN VỊ', 'TỒN HIỆN CÓ', 'SL YÊU CẦU', 'SL ADMIN DUYỆT', 'LÝ DO DÒNG'].map((h) => (
                            <span key={h} className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                              {h}
                            </span>
                          ))}
                        </div>
                      </div>

                      {lineItems.length === 0 ? (
                        <div className="py-12 text-center text-gray-400">
                          <Package size={28} className="mx-auto mb-2 text-gray-200" />
                          <div>Không có sản phẩm trong yêu cầu</div>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {lineItems.map((it, idx) => {
                            const pid = String(it.productId || '').trim()
                            const sku = productSkuMap[pid] || '—'
                            const unit = safeNonEmpty(it.unit) || productUnitMap[pid] || '—'
                            const name = safeNonEmpty(it.productName) || productNameMap[pid] || '—'
                            const approvedQty = it.approvedQuantity ?? null

                            return (
                              <div
                                key={it.id ?? `${it.productId}-${idx}`}
                                className="grid grid-cols-[110px_1fr_120px_120px_120px_140px_1fr] gap-3 px-6 py-4 items-center hover:bg-blue-50/20 transition-colors"
                              >
                                <span className="text-[11px] font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                                  {sku || '—'}
                                </span>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-gray-800 truncate">{name}</p>
                                </div>
                                <span className="text-sm text-gray-600">{unit}</span>
                                <span className="text-sm text-gray-500">{Number(it.currentQuantity ?? 0).toLocaleString()}</span>
                                <span className="text-sm font-semibold text-gray-900">{Number(it.requestedQuantity ?? 0).toLocaleString()}</span>
                                <span className="text-sm font-semibold text-blue-600">
                                  {approvedQty === null || approvedQty === undefined ? '—' : Number(approvedQty).toLocaleString()}
                                </span>
                                <span className="text-sm text-gray-500 italic">{safeNonEmpty(it.reason) || '—'}</span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: approval panel */}
                <div className="xl:col-span-2 space-y-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-gray-900 mb-3">Xử lý phê duyệt</h3>

                    {uiStatus === 'PENDING' ? (
                      <div className="space-y-4">
                        <div className="flex gap-3">
                          <button
                            onClick={onClickApprove}
                            disabled={actionLoading === 'approve'}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {actionLoading === 'approve' ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                            Duyệt
                          </button>
                          <button
                            onClick={onClickReject}
                            disabled={actionLoading === 'reject'}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {actionLoading === 'reject' ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                            Từ chối
                          </button>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Lý do từ chối *</label>
                          <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Bắt buộc nhập khi chọn Từ chối..."
                            rows={3}
                            className={`w-full border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 resize-none ${
                              rejectReason.length === 0 ? 'border-gray-200' : 'border-red-200'
                            }`}
                          />
                        </div>

                        <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-sm flex items-start gap-2">
                          <AlertTriangle size={16} className="mt-0.5" />
                          Chỉ yêu cầu ở trạng thái <span className="font-bold">Chờ duyệt</span> mới được thao tác.
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {uiStatus === 'APPROVED' && (
                          <div className="space-y-2">
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Người duyệt</div>
                            <div className="text-sm font-semibold text-gray-900">{approvedByName || '—'}</div>
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-3">Thời gian duyệt</div>
                            <div className="text-sm font-semibold text-gray-900">{formatDateVI(request.approvedDate)}</div>
                          </div>
                        )}

                        {uiStatus === 'REJECTED' && (
                          <div className="space-y-2">
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Người từ chối</div>
                            <div className="text-sm font-semibold text-gray-900">{rejectedByName || '—'}</div>
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-3">Thời gian từ chối</div>
                            <div className="text-sm font-semibold text-gray-900">
                              {formatDateVI((request as any).rejectedAt ?? (request as any).rejectedDate)}
                            </div>
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-3">Lý do từ chối</div>
                            <div className="text-sm text-gray-700">{rejectReasonResolved || '—'}</div>
                          </div>
                        )}

                        <div className="p-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-600">
                          Trạng thái này đã được xử lý. Bạn chỉ có thể xem thông tin.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* mini history */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-gray-900 mb-3">Lịch sử xử lý cơ bản</h3>
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái</div>
                        <div className="text-sm font-semibold text-gray-900">
                          {uiStatus === 'PENDING' ? 'Chờ duyệt' : uiStatus === 'APPROVED' ? 'Đã duyệt' : 'Đã từ chối'}
                        </div>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Người xử lý</div>
                        <div className="text-sm font-semibold text-gray-900">
                          {uiStatus === 'APPROVED' ? approvedByName : uiStatus === 'REJECTED' ? rejectedByName : '—'}
                        </div>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Thời gian</div>
                        <div className="text-sm font-semibold text-gray-900">
                          {uiStatus === 'APPROVED'
                            ? formatDateVI(request.approvedDate)
                            : uiStatus === 'REJECTED'
                              ? formatDateVI((request as any).rejectedAt ?? (request as any).rejectedDate)
                              : '—'}
                        </div>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ghi chú / Lý do</div>
                        <div className="text-sm text-gray-700 max-w-[60%] text-right break-words">
                          {uiStatus === 'APPROVED' ? (safeNonEmpty(request.notes) || '—') : uiStatus === 'REJECTED' ? (rejectReasonResolved || '—') : '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Modal */}
        <Modal
          isOpen={confirmOpen}
          onClose={() => {
            if (actionLoading) return
            setConfirmOpen(false)
          }}
          title={
            confirmAction === 'approve'
              ? 'Xác nhận duyệt yêu cầu'
              : confirmAction === 'reject'
                ? 'Xác nhận từ chối yêu cầu'
                : 'Xác nhận'
          }
          size="md"
          footer={
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  if (actionLoading) return
                  setConfirmOpen(false)
                }}
                className="px-4 py-2 text-sm rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={submitApproveReject}
                disabled={actionLoading !== null}
                className="px-4 py-2 text-sm rounded-xl text-white font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background:
                    confirmAction === 'approve'
                      ? '#059669'
                      : confirmAction === 'reject'
                        ? '#dc2626'
                        : '#3b82f6',
                }}
              >
                {actionLoading ? <Loader2 size={16} className="animate-spin inline-block mr-2" /> : null}
                {confirmAction === 'approve' ? 'Duyệt' : confirmAction === 'reject' ? 'Từ chối' : 'Xác nhận'}
              </button>
            </div>
          }
        >
          {request && confirmAction === 'approve' && (
            <div className="space-y-2 text-sm">
              <p className="text-gray-600">
                Bạn sắp <span className="font-bold text-emerald-700">Duyệt</span> yêu cầu{' '}
                <span className="font-mono font-semibold text-gray-900">{request.requestNumber || request.id}</span>.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800 flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                Contract request body của <span className="font-semibold">Approve</span> chưa được cung cấp rõ, UI chỉ gọi đúng endpoint.
              </div>
            </div>
          )}

          {request && confirmAction === 'reject' && (
            <div className="space-y-2 text-sm">
              <p className="text-gray-600">
                Bạn sắp <span className="font-bold text-red-700">Từ chối</span> yêu cầu{' '}
                <span className="font-mono font-semibold text-gray-900">{request.requestNumber || request.id}</span>.
              </p>
              {safeNonEmpty(rejectReason) ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="text-xs font-bold text-red-800 uppercase tracking-wider">Lý do từ chối</p>
                  <p className="text-sm text-red-900 mt-1">{rejectReason}</p>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800 flex items-start gap-2">
                  <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                  Vui lòng nhập lý do từ chối trước khi xác nhận.
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </div>
  )
}

