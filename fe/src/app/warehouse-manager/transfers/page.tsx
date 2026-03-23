'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CirclePlus,
  Eye,
  Loader2,
  Search,
  Warehouse,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  X,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { TransferAPIService, type TransferFromAPI } from '@/services/transfer-api.service'
import { RestockAPIService, type RestockRequestFromAPI } from '@/services/restock-api.service'
import { ProductBatchAPIService, type ProductBatchFromAPI } from '@/services/product-batch-api.service'
import { ProductAPIService } from '@/services/product-api.service'

type TransferStatus = 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'COMPLETED'

const STATUS_META: Record<TransferStatus, { label: string; cls: string; dot: string }> = {
  PENDING: { label: 'Chờ xử lý', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400' },
  IN_TRANSIT: { label: 'Đang vận chuyển', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500' },
  DELIVERED: { label: 'Đã giao', cls: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-500' },
  COMPLETED: { label: 'Hoàn thành', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
}

function normalizeId(value?: string | null): string {
  return String(value ?? '').trim().toLowerCase()
}

function formatDateVI(value?: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('vi-VN')
}

function getStatusMeta(status: string | null | undefined) {
  const s = String(status ?? '').trim().toUpperCase() as TransferStatus
  return STATUS_META[s] ?? { label: status ?? '—', cls: 'bg-gray-50 text-gray-600 border-gray-200', dot: 'bg-gray-400' }
}

function sumExpectedQty(t: TransferFromAPI) {
  const items = Array.isArray(t.items) ? t.items : []
  return items.reduce((sum, it) => {
    const shipped = Number((it as any)?.shippedQuantity ?? 0)
    const requested = Number((it as any)?.requestedQuantity ?? 0)
    return sum + (shipped > 0 ? shipped : requested)
  }, 0)
}

function usePagination<T>(items: T[], pageSize = 10) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const safePage = Math.min(page, totalPages)

  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, safePage, pageSize])

  const reset = useCallback(() => setPage(1), [])
  return { page: safePage, setPage, totalPages, paginated, total: items.length, pageSize, reset }
}

function TransferStatusBadge({ status }: { status: string | null | undefined }) {
  const meta = getStatusMeta(status)
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${meta.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full inline-block flex-shrink-0 ${meta.dot}`} />
      {meta.label}
    </span>
  )
}

function PaginationBar({
  page,
  totalPages,
  total,
  pageSize,
  onChange,
}: {
  page: number
  totalPages: number
  total: number
  pageSize: number
  onChange: (nextPage: number) => void
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
      <p className="text-xs text-gray-500">
        Hiển thị <span className="font-semibold text-gray-700">{from}–{to}</span> trên{' '}
        <span className="font-semibold text-gray-700">{total}</span> kết quả
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="w-8 h-8 rounded-md border border-gray-200 text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4 mx-auto" />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .slice(0, 7)
          .map((p) => (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`w-8 h-8 rounded-md text-sm font-semibold ${
                page === p ? 'bg-[#f97316] text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {p}
            </button>
          ))}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="w-8 h-8 rounded-md border border-gray-200 text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4 mx-auto" />
        </button>
      </div>
    </div>
  )
}

function ModalShell({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/25 p-4 pt-20">
      <section className="w-full max-w-5xl bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </section>
    </div>
  )
}

function TransferDetailModal({
  open,
  transferId,
  onClose,
  locationsById,
}: {
  open: boolean
  transferId: string | null
  onClose: () => void
  locationsById: Record<string, string>
}) {
  const [loading, setLoading] = useState(false)
  const [transfer, setTransfer] = useState<TransferFromAPI | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !transferId) return
    setLoading(true)
    setError(null)
    setTransfer(null)

    void (async () => {
      try {
        const detail = await TransferAPIService.getById(transferId)
        setTransfer(detail)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Không thể tải chi tiết transfer.')
      } finally {
        setLoading(false)
      }
    })()
  }, [open, transferId])

  return (
    <ModalShell open={open} title="Chi tiết đơn vận chuyển" onClose={onClose}>
      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-3 text-gray-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            Đang tải chi tiết...
          </div>
        )}

        {!loading && transfer && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Mã vận chuyển</p>
                <p className="mt-1 font-bold text-gray-900">#{transfer.transferNumber || transfer.id}</p>
                <p className="text-xs text-gray-500 mt-1 font-mono">{transfer.id.slice(0, 12)}</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Kho đi</p>
                <p className="mt-1 font-semibold text-gray-900">{locationsById[normalizeId(transfer.fromLocationId)] ?? transfer.fromLocationId}</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Kho đến</p>
                <p className="mt-1 font-semibold text-gray-900">{locationsById[normalizeId(transfer.toLocationId)] ?? transfer.toLocationId}</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Trạng thái</p>
                <div className="mt-2">
                  <TransferStatusBadge status={transfer.status} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Ngày tạo</p>
                <p className="mt-1 font-medium text-gray-900">{formatDateVI(transfer.transferDate)}</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Ngày dự kiến</p>
                <p className="mt-1 font-medium text-gray-900">{formatDateVI(transfer.expectedDelivery)}</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Ngày thực nhận</p>
                <p className="mt-1 font-medium text-gray-900">{formatDateVI(transfer.actualDelivery)}</p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Người giao</p>
                  <p className="mt-1 font-medium text-gray-900">{transfer.shippedBy ?? '—'}</p>
                </div>
                <div className="min-w-[240px]">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Ghi chú</p>
                  <p className="mt-1 font-medium text-gray-900 break-all">{transfer.notes ?? '—'}</p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto bg-white border border-gray-100 rounded-xl">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
                  <tr>
                    <th className="px-5 py-3 text-left">Sản phẩm</th>
                    <th className="px-5 py-3 text-left">Lô hàng (batch)</th>
                    <th className="px-5 py-3 text-left">SL yêu cầu</th>
                    <th className="px-5 py-3 text-left">SL xuất</th>
                    <th className="px-5 py-3 text-left">Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {(transfer.items ?? []).map((it) => (
                    <tr key={it.id} className="border-t border-gray-100 hover:bg-gray-50/70 transition-colors">
                      <td className="px-5 py-3 text-gray-700">{(it as any).productName ?? it.productId}</td>
                      <td className="px-5 py-3 text-gray-500 font-mono">{it.batchId ?? '—'}</td>
                      <td className="px-5 py-3 text-gray-700 font-semibold">{Number(it.requestedQuantity ?? 0).toLocaleString()}</td>
                      <td className="px-5 py-3 text-gray-700 font-semibold">
                        {Number((it as any).shippedQuantity ?? (it as any).receivedQuantity ?? 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-gray-600 break-all">{it.notes ?? '—'}</td>
                    </tr>
                  ))}
                  {(transfer.items ?? []).length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-gray-400 text-sm">
                        Không có items
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  )
}

function CreateTransferModal({
  open,
  onClose,
  onCreated,
  currentWarehouseId,
  toStoreOptions,
  locationsById,
  userId,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => void
  currentWarehouseId: string
  toStoreOptions: { id: string; name: string }[]
  locationsById: Record<string, string>
  userId: string
}) {
  const [batches, setBatches] = useState<ProductBatchFromAPI[]>([])
  const [batchesLoading, setBatchesLoading] = useState(false)
  const [productNameById, setProductNameById] = useState<Record<string, string>>({})

  const [restockRequests, setRestockRequests] = useState<RestockRequestFromAPI[]>([])
  const [restockLoading, setRestockLoading] = useState(false)
  const [restockError, setRestockError] = useState<string | null>(null)

  type ItemRow = {
    productId: string
    productName: string
    batchId: string
    requestedQuantity: number
    shippedQuantity: number
    currentQuantity: number
    notes: string
  }

  const [toStoreId, setToStoreId] = useState('')
  const [expectedDelivery, setExpectedDelivery] = useState('')
  const [notes, setNotes] = useState('')

  const [selectedRestockId, setSelectedRestockId] = useState<string>('')
  const [itemsLoading, setItemsLoading] = useState(false)
  const [items, setItems] = useState<ItemRow[]>([])

  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const fromWarehouseDisplayName = locationsById[normalizeId(currentWarehouseId)] ?? currentWarehouseId

  const batchesByProductId = useMemo(() => {
    const m: Record<string, ProductBatchFromAPI[]> = {}
    for (const b of batches) {
      const pid = normalizeId(b.productId)
      if (!m[pid]) m[pid] = []
      m[pid].push(b)
    }
    for (const k of Object.keys(m)) {
      m[k] = m[k].sort((a, b) => Number(b.quantity ?? 0) - Number(a.quantity ?? 0))
    }
    return m
  }, [batches])

  useEffect(() => {
    if (!open) return

    setSubmitError(null)
    setSelectedRestockId('')
    setItems([])
    setItemsLoading(false)
    setSubmitError(null)
    setExpectedDelivery('')
    setNotes('')
    setToStoreId('')

    setBatchesLoading(true)
    setBatches([])
    setProductNameById({})
    void (async () => {
      try {
        const b = await ProductBatchAPIService.getByWarehouse(currentWarehouseId)
        setBatches(b)
      } catch (err) {
        setBatches([])
      } finally {
        setBatchesLoading(false)
      }
    })()

    void (async () => {
      try {
        const products = await ProductAPIService.getAllProducts()
        const nextMap: Record<string, string> = {}
        for (const p of products ?? []) {
          const id = normalizeId((p as any)?.id)
          const name = String((p as any)?.name ?? '').trim()
          if (id && name) nextMap[id] = name
        }
        setProductNameById(nextMap)
      } catch {
        setProductNameById({})
      }
    })()

    setRestockLoading(true)
    setRestockError(null)
    void (async () => {
      try {
        const rows = await RestockAPIService.getByParentWarehouse(currentWarehouseId)
        setRestockRequests(rows)
      } catch (err) {
        setRestockError(err instanceof Error ? err.message : 'Không thể tải danh sách restock requests.')
        setRestockRequests([])
      } finally {
        setRestockLoading(false)
      }
    })()
  }, [open, currentWarehouseId])

  // If restock request is selected, prefill destination and items.
  useEffect(() => {
    if (!open) return
    if (!selectedRestockId) return

    const req = restockRequests.find((r) => normalizeId(r.id) === normalizeId(selectedRestockId))
    if (!req) return

    setItemsLoading(true)

    void (async () => {
      try {
        const dest = String(req.toWarehouseId ?? '')
        if (dest) setToStoreId(dest)

        const next: ItemRow[] = (req.items ?? []).map((it) => {
          const pid = String(it.productId)
          const candidateBatches = batchesByProductId[normalizeId(pid)] ?? []
          const defaultBatch = candidateBatches.length > 0 ? String(candidateBatches[0].id) : ''
          const resolvedName =
            productNameById[normalizeId(pid)] ||
            String((it as any)?.productName ?? '').trim() ||
            pid
          return {
            productId: pid,
            productName: resolvedName,
            batchId: defaultBatch,
            requestedQuantity: Number(it.requestedQuantity ?? 0),
            shippedQuantity: Number(it.requestedQuantity ?? 0),
            currentQuantity: Number(it.currentQuantity ?? 0),
            notes: it.reason ?? '',
          }
        })

        // Small async delay to make spinner visible when selection changes.
        await new Promise((r) => setTimeout(r, 200))
        setItems(next)
      } finally {
        setItemsLoading(false)
      }
    })()
  }, [selectedRestockId, restockRequests, batchesByProductId, open, productNameById])

  const selectableRestockRequests = useMemo(() => {
    // Ensure request destination belongs to store children of currentWarehouseId.
    const storeIds = new Set(toStoreOptions.map((s) => normalizeId(s.id)))
    return restockRequests.filter((r) => {
      const toId = normalizeId(r.toWarehouseId)
      const status = String(r.status ?? '').trim().toUpperCase()
      return storeIds.has(toId) && status === 'APPROVED'
    })
  }, [restockRequests, toStoreOptions])

  const canSubmit = useMemo(() => {
    if (!currentWarehouseId) return false
    if (!toStoreId) return false
    if (!expectedDelivery) return false
    if (!userId) return false
    if (items.length === 0) return false
    for (const it of items) {
      if (!it.productId) return false
      if (!it.batchId) return false
      if (Number(it.requestedQuantity ?? 0) <= 0) return false
      if (Number(it.shippedQuantity ?? 0) <= 0) return false
      if (Number(it.shippedQuantity ?? 0) > Number(it.currentQuantity ?? 0)) return false
    }
    return true
  }, [currentWarehouseId, toStoreId, expectedDelivery, userId, items])

  const submit = async () => {
    setSubmitError(null)
    if (!currentWarehouseId) return
    if (!toStoreId) return setSubmitError('Vui lòng chọn kho đến (store).')
    if (!expectedDelivery) return setSubmitError('Vui lòng chọn ngày dự kiến giao.')
    if (!userId) return setSubmitError('Không tìm thấy người giao từ tài khoản.')
    if (!items.length) return setSubmitError('Vui lòng chọn ít nhất 1 sản phẩm.')

    const invalid = items.find((it) => Number(it.shippedQuantity) > Number(it.currentQuantity))
    if (invalid) return setSubmitError('SL xuất vượt tồn kho. Vui lòng chỉnh lại trước khi tạo phiếu.')

    try {
      setSubmitLoading(true)
      const payload = {
        fromLocationType: 'WAREHOUSE',
        fromLocationId: currentWarehouseId,
        toLocationType: 'STORE',
        toLocationId: toStoreId,
        expectedDelivery: expectedDelivery ? new Date(expectedDelivery).toISOString() : undefined,
        shippedBy: userId,
        restockRequestId: selectedRestockId || null,
        notes: notes.trim() || undefined,
        items: items.map((it) => ({
          productId: it.productId,
          batchId: it.batchId,
          requestedQuantity: Number(it.requestedQuantity),
          receivedQuantity: Number(it.shippedQuantity),
          notes: it.notes?.trim() || undefined,
        })),
      }

      await TransferAPIService.create(payload as any)
      onClose()
      onCreated()
    } catch (err: unknown) {
      const msg =
        (err as any)?.response?.data?.message ||
        (err as any)?.response?.data?.error ||
        (err instanceof Error
          ? err.message
          : 'Tạo phiếu vận chuyển thất bại.')
      setSubmitError(msg)
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <ModalShell open={open} title="Tạo phiếu vận chuyển mới" onClose={onClose}>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Kho đi</p>
            <p className="mt-1 font-semibold text-gray-900 break-all">{fromWarehouseDisplayName}</p>
            <p className="mt-1 text-xs text-gray-500 font-mono">{currentWarehouseId}</p>
            <input type="hidden" value="WAREHOUSE" />
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Kho đến <span className="text-red-400 ml-0.5">*</span>
            </label>
            <div className="mt-2 relative">
              <Warehouse className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600" />
              <select
                value={toStoreId}
                onChange={(e) => setToStoreId(e.target.value)}
                className="w-full appearance-none border border-gray-300 rounded-lg pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
              >
                <option value="">-- Chọn store con --</option>
                {toStoreOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">Chỉ hiển thị store con thuộc khu vực kho của bạn.</p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Ngày dự kiến giao <span className="text-red-400 ml-0.5">*</span>
            </label>
            <div className="mt-2">
              <input
                type="date"
                value={expectedDelivery}
                onChange={(e) => setExpectedDelivery(e.target.value)}
                className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nguồn (restock request, optional)</label>
            {restockLoading ? (
              <div className="mt-3 flex items-center gap-2 text-gray-600 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang tải restock requests...
              </div>
            ) : restockError ? (
              <div className="mt-3 text-sm text-red-600">{restockError}</div>
            ) : (
              <select
                value={selectedRestockId}
                onChange={(e) => setSelectedRestockId(e.target.value)}
                className="mt-2 w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
              >
                <option value="">-- Chọn request để auto-fill items --</option>
                {selectableRestockRequests.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.requestNumber || r.id.slice(0, 8)} ({r.status})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Người giao (shipped_by)</label>
            <input
              readOnly
              value={userId}
              className="mt-2 w-full h-10 rounded-lg border border-gray-200 px-3 text-sm bg-white text-gray-800 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="mt-5 bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-800">Sản phẩm</p>
              <p className="text-[12px] text-gray-500 mt-1">Auto-fill từ restock request (nếu chọn) và chọn batch theo kho đi.</p>
            </div>
            {itemsLoading ? (
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang nạp items...
              </div>
            ) : batchesLoading ? (
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang tải batch...
              </div>
            ) : null}
          </div>

          <div className="p-5 overflow-x-auto">
            {items.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">
                Chưa có items. Hãy chọn restock request hoặc thêm sản phẩm theo nghiệp vụ hiện có.
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((it, idx) => {
                  const batchOptions = batchesByProductId[normalizeId(it.productId)] ?? []
                  const currentQty = Number(it.currentQuantity ?? 0)
                  const shippedQty = Number(it.shippedQuantity ?? 0)
                  const isOverflow = shippedQty > currentQty
                  return (
                    <div key={`${it.productId}-${idx}`} className="border border-gray-100 rounded-xl p-3.5 bg-gray-50/50">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-gray-800 truncate">{it.productName}</p>
                        </div>
                        {isOverflow && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            SL vượt tồn kho
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-6 gap-2 mt-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-medium text-gray-500 mb-1">Lô hàng (batch)</label>
                          <select
                            value={it.batchId}
                            onChange={(e) => {
                              const v = e.target.value
                              setItems((prev) => prev.map((row, i) => (i === idx ? { ...row, batchId: v } : row)))
                            }}
                            className="w-full h-9 rounded-lg border border-gray-200 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                          >
                            <option value="">-- Chọn batch --</option>
                            {batchOptions.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.batchNumber} (SL: {Number(b.quantity ?? 0).toLocaleString()})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-gray-500 mb-1">SL yêu cầu</label>
                          <input
                            readOnly
                            value={Number(it.requestedQuantity ?? 0)}
                            className="w-full h-9 rounded-lg border border-gray-200 px-2 text-sm bg-white text-center cursor-not-allowed"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-gray-500 mb-1">SL xuất</label>
                          <input
                            type="number"
                            min={0}
                            value={Number(it.shippedQuantity ?? 0)}
                            onChange={(e) => {
                              const v = Math.max(0, Number(e.target.value ?? 0))
                              setItems((prev) => prev.map((row, i) => (i === idx ? { ...row, shippedQuantity: v } : row)))
                            }}
                            className="w-full h-9 rounded-lg border border-gray-200 px-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-200"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-gray-500 mb-1">SL hiện có</label>
                          <input
                            readOnly
                            value={currentQty}
                            className="w-full h-9 rounded-lg border border-gray-200 px-2 text-sm bg-gray-50 text-center cursor-not-allowed"
                          />
                        </div>

                        <div className="sm:col-span-1">
                          <label className="block text-[11px] font-medium text-gray-500 mb-1">Ghi chú</label>
                          <input
                            value={it.notes}
                            onChange={(e) => {
                              const v = e.target.value
                              setItems((prev) => prev.map((row, i) => (i === idx ? { ...row, notes: v } : row)))
                            }}
                            className="w-full h-9 rounded-lg border border-gray-200 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Ghi chú toàn phiếu</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
            placeholder="Ghi chú thêm (không bắt buộc)..."
          />
        </div>

        {submitError && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {submitError}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-2">
          <button onClick={onClose} type="button" className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold">
            Hủy
          </button>
          <button
            onClick={() => void submit()}
            type="button"
            disabled={submitLoading || !canSubmit}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {submitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CirclePlus className="w-4 h-4" />}
            Xác nhận tạo phiếu
          </button>
        </div>
      </div>
    </ModalShell>
  )
}

export default function WarehouseManagerTransfersPage() {
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const currentWarehouseId = String(user?.warehouseId ?? user?.workplaceId ?? user?.storeId ?? '').trim()
  const normalizedCurrentWarehouseId = normalizeId(currentWarehouseId)

  const [locationsById, setLocationsById] = useState<Record<string, string>>({})
  const [storeOptions, setStoreOptions] = useState<{ id: string; name: string }[]>([])

  const [transfers, setTransfers] = useState<TransferFromAPI[]>([])

  const [statusFilter, setStatusFilter] = useState<'ALL' | TransferStatus>('ALL')
  const [toStoreFilter, setToStoreFilter] = useState<string>('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const [search, setSearch] = useState('')

  const PAGE_SIZE = 10
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const [detailId, setDetailId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const loadLocations = useCallback(async () => {
    if (!token) return
    const res = await fetch('/api/warehouses', { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    const raw = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []

    // Map for display names
    const nextById: Record<string, string> = {}
    for (const w of raw) {
      if (!w?.id) continue
      nextById[normalizeId(w.id)] = w.name ?? w.code ?? w.id
    }
    setLocationsById(nextById)

    // Store con managed by this warehouse manager (children only)
    if (!normalizedCurrentWarehouseId) {
      setStoreOptions([])
      return
    }

    // Filter by BE relationship: store belongs to current warehouse when parentId matches.
    const childrenRaw = raw.filter((w: any) => normalizeId(w?.parentId) === normalizedCurrentWarehouseId)

    const candidates = childrenRaw.map((w: any) => ({
      id: String(w.id),
      name: w.name ?? w.code ?? String(w.id),
    }))

    // Heuristic: store IDs likely start with 'b' (warehouse IDs start with 'a')
    const storeCandidates = candidates.filter((c: { id: string; name: string }) => normalizeId(c.id).startsWith('b'))
    const finalOptions = (storeCandidates.length > 0 ? storeCandidates : candidates).sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'vi'))
    setStoreOptions(finalOptions)
  }, [token, normalizedCurrentWarehouseId, currentWarehouseId])

  const loadTransfers = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const all = await TransferAPIService.getTransfers()
      const filtered = (all ?? []).filter((t) => {
        const fromType = String(t.fromLocationType ?? '').trim().toUpperCase()
        const toType = String(t.toLocationType ?? '').trim().toUpperCase()
        const fromId = normalizeId(t.fromLocationId)
        const toId = normalizeId(t.toLocationId)

        return (
          fromType === 'WAREHOUSE' &&
          toType === 'STORE' &&
          fromId === normalizedCurrentWarehouseId &&
          // chỉ xem các transfer đi tới store con quản lý
          (storeOptions.length === 0 || storeOptions.some((s) => normalizeId(s.id) === toId))
        )
      })

      setTransfers(filtered)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không tải được danh sách transfers.')
      setTransfers([])
    } finally {
      setLoading(false)
    }
  }, [token, normalizedCurrentWarehouseId, storeOptions])

  useEffect(() => {
    void (async () => {
      if (!currentWarehouseId) {
        setError('Tài khoản chưa được gán warehouse hiện tại.')
        setLoading(false)
        return
      }
      setError(null)
      await loadLocations()
    })()
  }, [currentWarehouseId, loadLocations])

  useEffect(() => {
    if (!currentWarehouseId) return
    // Re-load transfers after we know store options
    void loadTransfers()
  }, [currentWarehouseId, loadTransfers])

  const derived = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = transfers.filter((t) => {
      if (statusFilter !== 'ALL' && String(t.status ?? '').trim().toUpperCase() !== statusFilter) return false
      if (toStoreFilter && normalizeId(t.toLocationId) !== normalizeId(toStoreFilter)) return false
      if (q) {
        const code = String(t.transferNumber ?? '').toLowerCase()
        const id = String(t.id ?? '').toLowerCase()
        if (!code.includes(q) && !id.includes(q)) return false
      }
      if (fromDate) {
        const d = new Date(t.transferDate ?? '')
        if (Number.isNaN(d.getTime())) return true
        if (d < new Date(fromDate)) return false
      }
      if (toDate) {
        const d = new Date(t.transferDate ?? '')
        if (Number.isNaN(d.getTime())) return true
        const end = new Date(toDate)
        end.setHours(23, 59, 59, 999)
        if (d > end) return false
      }
      return true
    })

    const sorted = filtered.sort((a, b) => {
      const da = new Date(a.transferDate ?? '').getTime()
      const db = new Date(b.transferDate ?? '').getTime()
      return Number.isNaN(db) ? -1 : Number.isNaN(da) ? 1 : db - da
    })

    return sorted
  }, [transfers, statusFilter, toStoreFilter, fromDate, toDate, search])

  const pagination = usePagination(derived, PAGE_SIZE)

  useEffect(() => {
    pagination.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, toStoreFilter, fromDate, toDate, search])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-[#1d4b2c]">Lịch sử phiếu vận chuyển</h1>
          <p className="text-gray-500 mt-1">Chỉ hiển thị các transfer từ kho chi nhánh của bạn tới store con.</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#f97316] text-white font-semibold hover:bg-[#ea580c] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={!currentWarehouseId}
        >
          <CirclePlus className="w-4 h-4" />
          Tạo phiếu vận chuyển
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã phiếu..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-300 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[12px] text-gray-500 font-semibold">Trạng thái</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
            >
              <option value="ALL">Tất cả</option>
              <option value="PENDING">PENDING</option>
              <option value="IN_TRANSIT">IN_TRANSIT</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[12px] text-gray-500 font-semibold">Kho đến</label>
            <select
              value={toStoreFilter}
              onChange={(e) => setToStoreFilter(e.target.value)}
              className="h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
            >
              <option value="">Tất cả store con</option>
              {storeOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-[12px] text-gray-500 font-semibold">Ngày tạo từ</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[12px] text-gray-500 font-semibold">Ngày tạo đến</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
          </div>
        </div>
      </div>

      <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-900">Danh sách phiếu vận chuyển</h2>
          <div className="text-sm text-gray-500">Total: {derived.length}</div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
              <tr>
                <th className="px-5 py-3 text-left">STT</th>
                <th className="px-5 py-3 text-left">Mã phiếu</th>
                <th className="px-5 py-3 text-left">Kho đi</th>
                <th className="px-5 py-3 text-left">Kho đến</th>
                <th className="px-5 py-3 text-left">Ngày tạo</th>
                <th className="px-5 py-3 text-left">Ngày dự kiến</th>
                <th className="px-5 py-3 text-left">Ngày thực nhận</th>
                <th className="px-5 py-3 text-left">Trạng thái</th>
                <th className="px-5 py-3 text-left">Người giao</th>
                <th className="px-5 py-3 text-left">Ghi chú</th>
                <th className="px-5 py-3 text-left">Hành động</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-5 py-16 text-center text-gray-500">
                    <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" />
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : pagination.paginated.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-5 py-16 text-center text-gray-500">
                    Không có phiếu vận chuyển phù hợp.
                  </td>
                </tr>
              ) : (
                pagination.paginated.map((t, idx) => {
                  const ui = getStatusMeta(t.status)
                  const toName = locationsById[normalizeId(t.toLocationId)] ?? t.toLocationId
                  const fromName = locationsById[normalizeId(t.fromLocationId)] ?? t.fromLocationId
                  const totalExpected = sumExpectedQty(t)
                  const skuCount = Array.isArray(t.items) ? t.items.length : 0

                  return (
                    <tr key={t.id} className="border-t border-gray-100 hover:bg-gray-50/70 transition-colors cursor-pointer">
                      <td className="px-5 py-4 text-gray-500">{(pagination.page - 1) * PAGE_SIZE + idx + 1}</td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-[#0f766e]">#{t.transferNumber || t.id}</p>
                        <p className="text-xs text-gray-500 font-mono">{t.id.slice(0, 8)}…</p>
                      </td>
                      <td className="px-5 py-4 text-gray-700">{fromName}</td>
                      <td className="px-5 py-4 text-gray-700">{toName}</td>
                      <td className="px-5 py-4 text-gray-500 whitespace-nowrap">{formatDateVI(t.transferDate)}</td>
                      <td className="px-5 py-4 text-gray-500 whitespace-nowrap">{formatDateVI(t.expectedDelivery)}</td>
                      <td className="px-5 py-4 text-gray-500 whitespace-nowrap">{formatDateVI(t.actualDelivery)}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold ${ui.cls}`}>
                          <span className={`w-1.5 h-1.5 rounded-full inline-block flex-shrink-0 ${ui.dot}`} />
                          {ui.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-700">{t.shippedBy ?? '—'}</td>
                      <td className="px-5 py-4 text-gray-600">
                        <div className="break-all">{t.notes ?? '—'}</div>
                        <div className="text-[11px] text-gray-400 mt-1">
                          Tổng SL: <span className="font-semibold">{totalExpected.toLocaleString()}</span> · SKU: <span className="font-semibold">{skuCount}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setDetailId(t.id)
                              setDetailOpen(true)
                            }}
                            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <PaginationBar
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          pageSize={PAGE_SIZE}
          onChange={(next) => {
            const clamped = Math.max(1, Math.min(pagination.totalPages, next))
            pagination.setPage(clamped)
          }}
        />
      </section>

      <TransferDetailModal
        open={detailOpen}
        transferId={detailId}
        onClose={() => {
          setDetailOpen(false)
          setDetailId(null)
        }}
        locationsById={locationsById}
      />

      <CreateTransferModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          // After create success, refresh table
          void loadTransfers()
        }}
        currentWarehouseId={currentWarehouseId}
        toStoreOptions={storeOptions}
        locationsById={locationsById}
        userId={String(user?.id ?? '')}
      />
    </div>
  )
}
