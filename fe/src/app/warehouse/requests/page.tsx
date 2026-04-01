'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Search, ChevronDown, Plus, X, AlertTriangle,
  Package, Trash2, RefreshCw, CheckCircle, XCircle, Loader2,
  ArrowRight, Truck, MapPin, User, FileText,
  ChevronLeft, ChevronRight, Inbox, Eye,
} from 'lucide-react'
import { RestockAPIService, RestockRequestFromAPI, RestockRequestItem } from '@/services/restock-api.service'
import { TransferAPIService, TransferFromAPI } from '@/services/transfer-api.service'
import { ProductAPIService, ProductFromAPI } from '@/services/product-api.service'
import { UserAPIService } from '@/services/user-api.service'
import { WarehouseLookupAPIService } from '@/services/warehouse-lookup-api.service'
import { ProductBatchAPIService, ProductBatchFromAPI } from '@/services/product-batch-api.service'
import { localApiClient } from '@/shared/api/http'
import type { AdminWarehouse } from '@/shared/types/warehouse.types'
import { useAuthStore } from '@/store/auth.store'

// ─── Types ────────────────────────────────────────────────────────────────────

// requestQty is string to allow free typing without leading-zero issues
interface ProductRow {
  id: number
  productId: string
  product: string
  unit: string
  currentQty: number
  requestQty: string   // ← string, converted to number only at submit
  reason: string
}

// requestedQuantity and receivedQuantity are strings for the same reason
interface TransferItemRow {
  id: number
  productId: string
  batchId: string
  requestedQuantity: string  // ← string
  receivedQuantity: string   // ← string
  notes: string
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
let _nextProductRowId = 10
let _nextTransferItemRowId = 100

function normalizeId(value?: string | null): string {
  return String(value ?? '').trim().toLowerCase()
}
function isWarehouseId(id: string): boolean {
  return normalizeId(id).startsWith('a')
}

// ─── Small UI helpers (all in-file) ──────────────────────────────────────────

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    URGENT: { label: 'Khẩn cấp', cls: 'text-red-600 bg-red-50 border border-red-200' },
    HIGH:   { label: 'Cao',      cls: 'text-orange-600 bg-orange-50 border border-orange-200' },
    NORMAL: { label: 'Bình thường', cls: 'text-gray-500 bg-gray-50 border border-gray-200' },
  }
  const s = map[priority] ?? { label: priority, cls: 'text-gray-500 bg-gray-50 border border-gray-200' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>
      {priority === 'URGENT' && <AlertTriangle size={10} className="mr-1" />}
      {s.label}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { dot: string; bg: string; text: string; label: string }> = {
    PENDING:    { dot: 'bg-amber-400',  bg: 'bg-amber-50 border border-amber-200',   text: 'text-amber-700',  label: 'Chờ xử lý' },
    APPROVED:   { dot: 'bg-green-500',  bg: 'bg-green-50 border border-green-200',   text: 'text-green-700',  label: 'Đã duyệt' },
    PROCESSING: { dot: 'bg-blue-500',   bg: 'bg-blue-50 border border-blue-200',     text: 'text-blue-700',   label: 'Đang xử lý' },
    COMPLETED:  { dot: 'bg-teal-500',   bg: 'bg-teal-50 border border-teal-200',     text: 'text-teal-700',   label: 'Hoàn thành' },
    REJECTED:   { dot: 'bg-red-500',    bg: 'bg-red-50 border border-red-200',       text: 'text-red-700',    label: 'Từ chối' },
    IN_TRANSIT: { dot: 'bg-indigo-500', bg: 'bg-indigo-50 border border-indigo-200', text: 'text-indigo-700', label: 'Đang vận chuyển' },
    SHIPPED:    { dot: 'bg-sky-500',    bg: 'bg-sky-50 border border-sky-200',       text: 'text-sky-700',    label: 'Đã xuất kho' },
    DELIVERED:  { dot: 'bg-cyan-500',   bg: 'bg-cyan-50 border border-cyan-200',     text: 'text-cyan-700',   label: 'Đã giao đến kho nhận' },
    CANCELLED:  { dot: 'bg-gray-400',   bg: 'bg-gray-50 border border-gray-200',     text: 'text-gray-600',   label: 'Đã hủy' },
  }
  const s = map[status] ?? { dot: 'bg-gray-400', bg: 'bg-gray-50 border border-gray-200', text: 'text-gray-600', label: status }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
      {s.label}
    </span>
  )
}

function SelectField({ label, options, value, onChange, required, colSpan }: {
  label: string; options: { value: string; label: string }[]
  value: string; onChange: (v: string) => void
  required?: boolean; colSpan?: string
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${colSpan ?? ''}`}>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <select
          value={value} onChange={e => onChange(e.target.value)} required={required}
          className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-400 pr-8 transition"
        >
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
      </div>
    </div>
  )
}

function InfoField({ label, value, icon: Icon, highlight }: {
  label: string; value?: string | null; icon?: React.ElementType; highlight?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
        {Icon && <Icon size={10} />}{label}
      </p>
      <p className={`text-sm font-medium break-all ${highlight ? 'text-blue-600' : 'text-gray-800'}`}>
        {value || '—'}
      </p>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="h-px flex-1 bg-gray-100" />
      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{children}</span>
      <div className="h-px flex-1 bg-gray-100" />
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <tr>
      <td colSpan={99} className="py-14 text-center">
        <div className="flex flex-col items-center gap-2 text-gray-300">
          <Inbox size={32} />
          <p className="text-sm">{text}</p>
        </div>
      </td>
    </tr>
  )
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-5 py-3.5">
          <div className="h-3.5 bg-gray-100 rounded animate-pulse w-3/4" />
        </td>
      ))}
    </tr>
  )
}

// ─── Number input helper ──────────────────────────────────────────────────────
// Strips leading zeros while typing, allows empty string, never coerces to 0
function sanitizeNumericInput(raw: string): string {
  if (raw === '' || raw === '-') return raw
  // Remove non-digit characters except leading minus
  const digits = raw.replace(/[^\d]/g, '')
  if (digits === '') return ''
  // Strip leading zeros (e.g. "0444" → "444"), but keep "0" alone
  return String(Number(digits))
}

// ─── Pagination helper ────────────────────────────────────────────────────────

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

function PaginationBar({
  page, totalPages, total, pageSize, setPage,
}: {
  page: number; totalPages: number; total: number; pageSize: number
  setPage: (p: number) => void
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  const pageNumbers: (number | '…')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pageNumbers.push(i)
  } else {
    pageNumbers.push(1)
    if (page > 3) pageNumbers.push('…')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pageNumbers.push(i)
    if (page < totalPages - 2) pageNumbers.push('…')
    pageNumbers.push(totalPages)
  }

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
      <span className="text-xs text-gray-500">
        Hiển thị <span className="font-semibold text-gray-700">{from}–{to}</span> trên{' '}
        <span className="font-semibold text-gray-700">{total}</span> kết quả
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setPage(page - 1)} disabled={page === 1}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-gray-600 transition"
        >
          <ChevronLeft size={13} /> Trước
        </button>
        {pageNumbers.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="px-1 text-gray-400 text-xs">…</span>
          ) : (
            <button
              key={p}
              onClick={() => setPage(p as number)}
              className={`w-7 h-7 rounded-lg text-xs font-semibold transition ${
                page === p ? 'bg-green-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => setPage(page + 1)} disabled={page === totalPages}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-gray-600 transition"
        >
          Sau <ChevronRight size={13} />
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WarehouseRequestsPage() {
  const { user, token } = useAuthStore()

  // ── Restock request state ──────────────────────────────────────────────────
  const [requests, setRequests] = useState<RestockRequestFromAPI[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [selectedRequest, setSelectedRequest] = useState<RestockRequestFromAPI | null>(null)

  // ── Transfer history state ─────────────────────────────────────────────────
  const [transfers, setTransfers] = useState<TransferFromAPI[]>([])
  const [isLoadingTransfers, setIsLoadingTransfers] = useState(false)
  const [transferError, setTransferError] = useState<string | null>(null)
  const [transferSearch, setTransferSearch] = useState('')
  const [transferStatusFilter, setTransferStatusFilter] = useState('ALL')
  const [receivingTransferId, setReceivingTransferId] = useState<string | null>(null)
  const [selectedTransfer, setSelectedTransfer] = useState<TransferFromAPI | null>(null)

  // ── Modal state ────────────────────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false)

  // ── Transfer form state ────────────────────────────────────────────────────
  const [transferFromLocationType, setTransferFromLocationType] = useState('WAREHOUSE')
  const [transferFromLocationId, setTransferFromLocationId] = useState('')
  const [transferToLocationType, setTransferToLocationType] = useState('STORE')
  const [transferToLocationId, setTransferToLocationId] = useState('')
  const [transferExpectedDelivery, setTransferExpectedDelivery] = useState('')
  const [transferShippedBy, setTransferShippedBy] = useState('')
  const [transferRestockRequestId, setTransferRestockRequestId] = useState('')
  const [transferNotes, setTransferNotes] = useState('')
  const [transferItems, setTransferItems] = useState<TransferItemRow[]>([])
  const [transferSourceRequest, setTransferSourceRequest] = useState<RestockRequestFromAPI | null>(null)

  // ── Supporting data ────────────────────────────────────────────────────────
  const [products, setProducts] = useState<ProductFromAPI[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [batches, setBatches] = useState<ProductBatchFromAPI[]>([])
  const [isLoadingBatches, setIsLoadingBatches] = useState(false)
  const [warehouses, setWarehouses] = useState<AdminWarehouse[]>([])
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false)
  const [userNameMap, setUserNameMap] = useState<Record<string, string>>({})
  const [warehouseNameMap, setWarehouseNameMap] = useState<Record<string, string>>({})

  // ── Create request form state ──────────────────────────────────────────────
  const [fromWarehouseId, setFromWarehouseId] = useState('')
  const [fromLocType, setFromLocType] = useState('WAREHOUSE')
  const [toWarehouseId, setToWarehouseId] = useState('')
  const [toLocType, setToLocType] = useState('STORE')
  const [priority, setPriority] = useState('NORMAL')
  const [notes, setNotes] = useState('')
  const [productRows, setProductRows] = useState<ProductRow[]>([
    { id: 1, productId: '', product: '', unit: '', currentQty: 0, requestQty: '', reason: '' },
  ])

  // ── Derived user/workplace info ────────────────────────────────────────────
  const normalizedRole = String(user?.role ?? '').toUpperCase().replace(/\s+/g, '_')
  const isWarehouseAdmin = normalizedRole === 'WAREHOUSE_ADMIN' || user?.roleId === 7
  const workplaceId =
    user?.workplaceId ||
    (user as any)?.workplace_id ||
    (user as any)?.workplace?.id ||
    user?.warehouseId ||
    user?.storeId ||
    ''

  const managedLocationIds = useMemo(() => {
    const root = normalizeId(workplaceId)
    if (!root || warehouses.length === 0) return new Set<string>()
    const byParent = new Map<string, string[]>()
    for (const w of warehouses as any[]) {
      const pid = normalizeId(w.parentId ?? w.parent_id)
      const id = normalizeId(w.id)
      if (!id) continue
      if (!byParent.has(pid)) byParent.set(pid, [])
      byParent.get(pid)!.push(id)
    }
    const visited = new Set<string>()
    const queue = [root]
    while (queue.length) {
      const cur = queue.shift()!
      if (visited.has(cur)) continue
      visited.add(cur)
      for (const c of byParent.get(cur) ?? []) queue.push(c)
    }
    return visited
  }, [workplaceId, warehouses])

  const warehouseSourceOptions = useMemo(() =>
    warehouses.filter(w => isWarehouseId(w.id) && managedLocationIds.has(normalizeId(w.id))),
    [warehouses, managedLocationIds]
  )
  const storeOptions = useMemo(() =>
    warehouses.filter(w => !isWarehouseId(w.id) && managedLocationIds.has(normalizeId(w.id))),
    [warehouses, managedLocationIds]
  )

  // ── Fetch restock requests ─────────────────────────────────────────────────
  const fetchRequests = useCallback(async () => {
    if (!token) return
    setIsLoading(true)
    setError(null)
    try {
      let data: RestockRequestFromAPI[] = []
      if (workplaceId) {
        data = isWarehouseAdmin
          ? await RestockAPIService.getByParentWarehouse(workplaceId)
          : await RestockAPIService.getByWarehouse(workplaceId)
        try {
          const all = await RestockAPIService.getAll()
          const wid = workplaceId.toLowerCase()
          const incoming = all.filter(r => (r.toWarehouseId || '').toLowerCase() === wid)
          const merged = [...data, ...incoming]
          data = merged.filter((r, idx, self) => idx === self.findIndex(x => x.id === r.id))
        } catch { /* ignore */ }
      }
      setRequests(data)
      setSelectedRequest((prev) => {
        if (data.length === 0) return null
        if (prev && data.some((r) => r.id === prev.id)) return prev
        return data[0]
      })
    } catch {
      setError('Không thể tải danh sách yêu cầu. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }, [token, workplaceId, isWarehouseAdmin])

  // ── Fetch transfer history ─────────────────────────────────────────────────
  const fetchTransfers = useCallback(async () => {
    if (!token || !workplaceId) return
    setIsLoadingTransfers(true)
    setTransferError(null)
    try {
      // NOTE: map to TransferAPIService.getTransfers(workplaceId) when available
      const data = await TransferAPIService.getTransfers()
      const list = Array.isArray(data) ? data : []
      const wid = normalizeId(workplaceId)
      const related = list.filter((t) => {
        const fromId = normalizeId(t.fromLocationId)
        const toId = normalizeId(t.toLocationId)
        return fromId === wid || toId === wid
      })
      setTransfers(related)
    } catch {
      setTransferError('Không thể tải lịch sử đơn vận chuyển.')
    } finally {
      setIsLoadingTransfers(false)
    }
  }, [token, workplaceId])

  useEffect(() => {
    if (!token) return
    fetchRequests()
    fetchTransfers()

    const fetchProducts = async () => {
      setIsLoadingProducts(true)
      try { setProducts(await ProductAPIService.getAllProducts()) }
      catch { /* ignore */ }
      finally { setIsLoadingProducts(false) }
    }
    const fetchWarehouses = async () => {
      setIsLoadingWarehouses(true)
      try {
        const response = await localApiClient.get('/warehouses?status=ACTIVE&is_deleted=0')
        const json = response.data
        const data: AdminWarehouse[] = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : []
        setWarehouses(data)
      } catch { /* ignore */ }
      finally { setIsLoadingWarehouses(false) }
    }
    fetchProducts()
    fetchWarehouses()
  }, [token, workplaceId, isWarehouseAdmin, fetchRequests, fetchTransfers])

  // ── Resolve user names ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!token || requests.length === 0) return
    const unresolvedIds = Array.from(new Set(
      requests.flatMap(r => [r.requestedBy, r.approvedBy].filter((id): id is string => Boolean(id)))
    )).filter(id => id !== user?.id && !userNameMap[id])
    if (!unresolvedIds.length) return
    let cancelled = false
    ;(async () => {
      const entries = await Promise.all(unresolvedIds.map(async id => {
        try {
          const info = await UserAPIService.getIamDetailsById(id)
          return [id, info?.fullName || info?.full_name || info?.name || info?.email || ''] as const
        } catch { return [id, ''] as const }
      }))
      if (cancelled) return
      setUserNameMap(prev => {
        const next = { ...prev }
        for (const [id, name] of entries) if (name) next[id] = name
        return next
      })
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- userNameMap omitted: only to skip resolved ids
  }, [token, requests, user?.id])

  // ── Resolve warehouse names ────────────────────────────────────────────────
  useEffect(() => {
    if (!token || requests.length === 0) return
    const ids = Array.from(
      new Set(
        requests
          .flatMap(r => [r.fromWarehouseId, r.toWarehouseId])
          .filter((id): id is string => Boolean(id)),
      ),
    )
      .filter(id => !warehouseNameMap[id])
    if (!ids.length) return
    let cancelled = false
    ;(async () => {
      const entries = await Promise.all(ids.map(async id => {
        try {
          const info = await WarehouseLookupAPIService.getById(id)
          return [id, info?.name || ''] as const
        } catch { return [id, ''] as const }
      }))
      if (cancelled) return
      setWarehouseNameMap(prev => {
        const next = { ...prev }
        for (const [id, name] of entries) if (name) next[id] = name
        return next
      })
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- warehouseNameMap omitted: only to skip resolved ids
  }, [token, requests])

  // ── Load batches for transfer modal ───────────────────────────────────────
  useEffect(() => {
    if (!showTransferModal || !transferFromLocationId || !token) { setBatches([]); return }
    let cancelled = false
    setIsLoadingBatches(true)
    ProductBatchAPIService.getByWarehouse(transferFromLocationId)
      .then(data => { if (!cancelled) setBatches(data) })
      .catch(() => { if (!cancelled) setBatches([]) })
      .finally(() => { if (!cancelled) setIsLoadingBatches(false) })
    return () => { cancelled = true }
  }, [transferFromLocationId, showTransferModal, token])

  // ── Auto-fill transfer form from selected request ─────────────────────────
  useEffect(() => {
    if (!showTransferModal) return
    const key = transferRestockRequestId.trim().toLowerCase()
    if (!key) { setTransferSourceRequest(null); setTransferItems([]); return }
    const matched = requests.find(r => r.id.toLowerCase() === key || r.requestNumber.toLowerCase() === key)
    if (matched) {
      setTransferSourceRequest(matched)
      setTransferFromLocationType(matched.fromLocationType || 'WAREHOUSE')
      setTransferFromLocationId(matched.fromWarehouseId || '')
      setTransferToLocationType(matched.toLocationType || 'STORE')
      setTransferToLocationId(matched.toWarehouseId || '')
      setTransferExpectedDelivery(toDateTimeLocalValue(new Date(Date.now() + 86400000)))
      setTransferShippedBy(user?.id || '')
      setTransferNotes(matched.notes || '')
      setTransferItems((matched.items || []).map((item, idx) => ({
        id: idx + 1,
        productId: item.productId,
        batchId: '',
        // Store as string, strip leading zeros
        requestedQuantity: String(item.approvedQuantity ?? item.requestedQuantity ?? 0),
        receivedQuantity: '0',
        notes: item.reason || '',
      })))
    } else {
      setTransferSourceRequest(null)
    }
  }, [transferRestockRequestId, showTransferModal, requests, user?.id])

  // ── Filters ────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return requests.filter(r => {
      const q = search.toLowerCase()
      const matchSearch = r.requestNumber.toLowerCase().includes(q) || (r.notes ?? '').toLowerCase().includes(q)
      const matchStatus = statusFilter === 'ALL' || r.status === statusFilter
      const matchPriority = priorityFilter === 'ALL' || r.priority === priorityFilter
      return matchSearch && matchStatus && matchPriority
    })
  }, [requests, search, statusFilter, priorityFilter])

  const filteredTransfers = useMemo(() => {
    const q = transferSearch.toLowerCase()
    return transfers.filter(t => {
      const matchSearch = t.transferNumber?.toLowerCase().includes(q) ||
        (t.restockRequestId || '').toLowerCase().includes(q)
      const matchStatus = transferStatusFilter === 'ALL' || t.status === transferStatusFilter
      return matchSearch && matchStatus
    })
  }, [transfers, transferSearch, transferStatusFilter])

  const receiveableTransferStatus = useMemo(() => new Set(['SHIPPED', 'IN_TRANSIT', 'DELIVERED']), [])

  const canReceiveTransfer = useCallback((transfer: TransferFromAPI) => {
    const toThisWorkplace = normalizeId(transfer.toLocationId) === normalizeId(workplaceId)
    const status = String(transfer.status || '').toUpperCase().trim()
    return toThisWorkplace && receiveableTransferStatus.has(status)
  }, [workplaceId, receiveableTransferStatus])

  // ── Pagination ─────────────────────────────────────────────────────────────
  const reqPagination = usePagination(filtered, 10)
  const trPagination = usePagination(filteredTransfers, 10)

  useEffect(() => {
    reqPagination.reset()
  }, [search, statusFilter, priorityFilter, reqPagination.reset]) // eslint-disable-line react-hooks/exhaustive-deps -- reset only on filter change

  useEffect(() => {
    trPagination.reset()
  }, [transferSearch, transferStatusFilter, trPagination.reset]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedRequest) return
    const isVisible = reqPagination.paginated.some(r => r.id === selectedRequest.id)
    if (!isVisible && reqPagination.paginated.length > 0) {
      setSelectedRequest(reqPagination.paginated[0])
    }
  }, [reqPagination.paginated, selectedRequest])

  useEffect(() => {
    if (!selectedTransfer) return
    const isVisible = trPagination.paginated.some(t => t.id === selectedTransfer.id)
    if (!isVisible && trPagination.paginated.length > 0) {
      setSelectedTransfer(trPagination.paginated[0])
    }
  }, [trPagination.paginated, selectedTransfer])

  // ── Resolve shipper names for selected transfer ─────────────────────────
  useEffect(() => {
    if (!token || !selectedTransfer?.shippedBy) return
    const shipperId = selectedTransfer.shippedBy
    if (userNameMap[shipperId]) return  // Already resolved

    let cancelled = false
    ;(async () => {
      try {
        const info = await UserAPIService.getIamDetailsById(shipperId)
        const name = info?.fullName || info?.full_name || info?.name || info?.email || ''
        if (cancelled) return
        if (name) {
          setUserNameMap(prev => ({ ...prev, [shipperId]: name }))
        }
      } catch { /* ignore */ }
    })()
    return () => { cancelled = true }
  }, [token, selectedTransfer?.shippedBy, userNameMap])

  // ── Transfer request options ───────────────────────────────────────────────
  const transferRequestOptions = useMemo(
    () => requests.filter(r => r.status === 'APPROVED' || r.status === 'PROCESSING'),
    [requests]
  )

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const fmtDate = (d: string | null | undefined) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' })
  }
  const getWarehouseLabel = (id?: string | null) => {
    if (!id) return '—'
    const key = normalizeId(id)
    const direct = warehouseNameMap[id]
    if (direct) return direct
    const fromList = warehouses.find(w => normalizeId(w.id) === key)?.name
    return fromList || warehouseNameMap[key] || id.slice(-8)
  }
  const getUserLabel = (id: string | null) => {
    if (!id) return '—'
    if (id === user?.id) return user.name
    return userNameMap[id] || `${id.slice(0, 8)}...${id.slice(-4)}`
  }
  const toDateTimeLocalValue = (date: Date) => {
    const offset = date.getTimezoneOffset()
    return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16)
  }

  // ── Product row helpers ────────────────────────────────────────────────────
  const addProductRow = () => {
    _nextProductRowId++
    setProductRows(rows => [...rows, {
      id: _nextProductRowId, productId: '', product: '', unit: '',
      currentQty: 0, requestQty: '', reason: '',
    }])
  }
  const removeProductRow = (id: number) => setProductRows(rows => rows.filter(r => r.id !== id))
  const updateRow = <K extends keyof ProductRow>(id: number, field: K, value: ProductRow[K]) => {
    setProductRows(rows => rows.map(r => {
      if (r.id !== id) return r
      if (field === 'productId') {
        const found = products.find(p => p.id === String(value))
        return { ...r, productId: String(value), product: found?.name ?? '', unit: found?.unit ?? '' }
      }
      return { ...r, [field]: value }
    }))
  }

  // ── Transfer item helpers ──────────────────────────────────────────────────
  const addTransferItemRow = () => {
    _nextTransferItemRowId++
    setTransferItems(rows => [...rows, {
      id: _nextTransferItemRowId, productId: '', batchId: '',
      requestedQuantity: '', receivedQuantity: '', notes: '',
    }])
  }
  const removeTransferItemRow = (id: number) => setTransferItems(rows => rows.filter(r => r.id !== id))
  const updateTransferItemRow = <K extends keyof TransferItemRow>(id: number, field: K, value: TransferItemRow[K]) => {
    setTransferItems(rows => rows.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  // ── Modal close / reset ────────────────────────────────────────────────────
  const closeModal = () => {
    setShowModal(false)
    setFromWarehouseId(user?.warehouseId ?? '')
    setFromLocType('WAREHOUSE'); setToWarehouseId(''); setToLocType('STORE')
    setPriority('NORMAL'); setNotes('')
    setProductRows([{ id: 1, productId: '', product: '', unit: '', currentQty: 0, requestQty: '', reason: '' }])
  }
  const closeTransferModal = () => {
    setShowTransferModal(false)
    setTransferItems([]); setTransferSourceRequest(null)
  }
  const openTransferModal = () => {
    setTransferFromLocationType('WAREHOUSE'); setTransferFromLocationId('')
    setTransferToLocationType('STORE'); setTransferToLocationId('')
    setTransferExpectedDelivery(''); setTransferShippedBy('')
    setTransferRestockRequestId(''); setTransferNotes('')
    setTransferItems([]); setTransferSourceRequest(null)
    setShowTransferModal(true)
  }

  // ── Submit handlers ────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!fromWarehouseId || !toWarehouseId) { alert('Vui lòng chọn kho nguồn và kho đích.'); return }
    // Convert string → number only at submit time
    const validItems = productRows.filter(r => r.productId && Number(r.requestQty || 0) > 0)
    if (!validItems.length) { alert('Vui lòng thêm ít nhất 1 sản phẩm.'); return }
    try {
      setIsSubmitting(true)
      await RestockAPIService.create({
        fromWarehouseId, fromLocationType: fromLocType, toWarehouseId, toLocationType: toLocType,
        priority, notes,
        items: validItems.map(r => ({
          productId: r.productId,
          requestedQuantity: Number(r.requestQty || 0),
          reason: r.reason,
        })),
      })
      alert('Tạo yêu cầu thành công!')
      closeModal(); fetchRequests()
    } catch { alert('Không thể tạo yêu cầu. Vui lòng thử lại.') }
    finally { setIsSubmitting(false) }
  }

  const handleUpdateStatus = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    if (!confirm(`Bạn có chắc muốn ${status === 'APPROVED' ? 'duyệt' : 'từ chối'} yêu cầu này?`)) return
    try {
      if (status === 'APPROVED') {
        await RestockAPIService.approve(id)
      } else {
        const reason = String(prompt('Nhập lý do từ chối:') ?? '').trim()
        if (!reason) {
          alert('Vui lòng nhập lý do từ chối.')
          return
        }
        await RestockAPIService.reject(id, reason)
      }
      await fetchRequests()
    } catch { alert('Không thể cập nhật trạng thái. Vui lòng thử lại.') }
  }

  const handleCreateTransfer = async () => {
    if (!transferFromLocationType || !transferFromLocationId || !transferToLocationType || !transferToLocationId)
      { alert('Vui lòng nhập đầy đủ điểm đi và điểm đến.'); return }
    if (!transferExpectedDelivery || !transferRestockRequestId)
      { alert('Vui lòng nhập đầy đủ thời gian giao hàng và mã yêu cầu.'); return }
    if (!transferItems.length) { alert('Vui lòng thêm ít nhất 1 sản phẩm.'); return }
    const invalid = transferItems.find(i =>
      !i.productId || !i.batchId || Number(i.requestedQuantity || 0) <= 0
    )
    if (invalid) { alert('Mỗi sản phẩm cần có productId, batchId và SL yêu cầu > 0.'); return }

    try {
      setIsSubmittingTransfer(true)
      const normalizedShippedBy = UUID_REGEX.test(transferShippedBy.trim()) ? transferShippedBy.trim() : undefined
      const transfer = await TransferAPIService.create({
        fromLocationType: transferFromLocationType, fromLocationId: transferFromLocationId,
        toLocationType: transferToLocationType, toLocationId: transferToLocationId,
        expectedDelivery: new Date(transferExpectedDelivery).toISOString(),
        ...(normalizedShippedBy ? { shippedBy: normalizedShippedBy } : {}),
        restockRequestId: transferRestockRequestId, notes: transferNotes,
        // Convert string → number only here at submit time
        items: transferItems.map(i => ({
          productId: i.productId,
          batchId: i.batchId,
          requestedQuantity: Number(i.requestedQuantity || 0),
          receivedQuantity: Number(i.receivedQuantity || 0),
          notes: i.notes,
        })),
      })
      alert(`Tạo đơn vận chuyển thành công: ${transfer.transferNumber || transfer.id}`)
      closeTransferModal(); fetchRequests(); fetchTransfers()
    } catch (err) {
      const msg = (err as any)?.response?.data?.message || (err as any)?.message || 'Không thể tạo đơn vận chuyển.'
      alert(msg)
    } finally { setIsSubmittingTransfer(false) }
  }

  const handleReceiveTransfer = async (transfer: TransferFromAPI) => {
    if (!canReceiveTransfer(transfer)) return
    const ok = confirm('Xác nhận kho đã nhận hàng cho đơn vận chuyển này?')
    if (!ok) return

    const items = Array.isArray(transfer.items) ? transfer.items : []
    if (items.length === 0) {
      alert('Đơn vận chuyển chưa có sản phẩm để xác nhận nhận hàng.')
      return
    }

    try {
      setReceivingTransferId(transfer.id)
      await TransferAPIService.receiveTransfer(transfer.id, {
        items: items.map((item) => {
          const shipped = Number(item.shippedQuantity ?? 0)
          const requested = Number(item.requestedQuantity ?? 0)
          const fallbackQty = shipped > 0 ? shipped : requested
          return {
            transferItemId: item.id,
            shippedQuantity: Math.max(0, fallbackQty),
            damagedQuantity: 0,
            notes: '',
          }
        }),
        notes: 'Kho nhận đã xác nhận nhận hàng',
      })
      alert('Xác nhận nhận hàng thành công!')
      await fetchTransfers()
    } catch (err) {
      const msg = (err as any)?.response?.data?.message || (err as any)?.message || 'Xác nhận nhận hàng thất bại.'
      alert(msg)
    } finally {
      setReceivingTransferId(null)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-10">

      {/* ══════════════════════════════════════════════════════
          TRANSFER MODAL
      ══════════════════════════════════════════════════════ */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Truck size={14} className="text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Tạo Đơn Vận Chuyển</h2>
                  {transferSourceRequest && (
                    <p className="text-xs text-blue-600 mt-0.5">Theo yêu cầu: {transferSourceRequest.requestNumber}</p>
                  )}
                </div>
              </div>
              <button onClick={closeTransferModal} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">

              {/* Section 1: Yêu cầu nguồn */}
              <div>
                <SectionLabel>Yêu cầu nguồn</SectionLabel>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Chọn yêu cầu</label>
                    <div className="relative">
                      <select
                        value={transferSourceRequest?.id || ''}
                        onChange={e => setTransferRestockRequestId(e.target.value)}
                        className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 pr-8"
                      >
                        <option value="">Chọn theo mã yêu cầu</option>
                        {transferRequestOptions.map(r => (
                          <option key={r.id} value={r.id}>{r.requestNumber}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">ID yêu cầu <span className="text-red-400">*</span></label>
                    <input
                      value={transferRestockRequestId}
                      onChange={e => setTransferRestockRequestId(e.target.value)}
                      placeholder="UUID hoặc mã yêu cầu (VD: RST-2026-001)"
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Tuyến vận chuyển */}
              <div>
                <SectionLabel>Tuyến vận chuyển</SectionLabel>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <SelectField label="Loại kho đi" required value={transferFromLocationType} onChange={setTransferFromLocationType}
                    options={[{ value: 'WAREHOUSE', label: 'WAREHOUSE' }, { value: 'STORE', label: 'STORE' }]} />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Kho đi <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <select value={transferFromLocationId} onChange={e => setTransferFromLocationId(e.target.value)}
                        className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 pr-8">
                        <option value="">Chọn kho nguồn</option>
                        {(transferFromLocationType === 'WAREHOUSE' ? warehouseSourceOptions : storeOptions).map(w => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                    </div>
                  </div>
                  <SelectField label="Loại kho đến" required value={transferToLocationType} onChange={setTransferToLocationType}
                    options={[{ value: 'STORE', label: 'STORE' }, { value: 'WAREHOUSE', label: 'WAREHOUSE' }]} />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Kho đến <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <select value={transferToLocationId} onChange={e => setTransferToLocationId(e.target.value)}
                        className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 pr-8">
                        <option value="">Chọn kho đích</option>
                        {(transferToLocationType === 'WAREHOUSE' ? warehouseSourceOptions : storeOptions).map(w => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Thông tin giao hàng */}
              <div>
                <SectionLabel>Thông tin giao hàng</SectionLabel>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Dự kiến giao <span className="text-red-400">*</span></label>
                    <input type="datetime-local" value={transferExpectedDelivery} onChange={e => setTransferExpectedDelivery(e.target.value)}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Người giao (UUID)</label>
                    <input value={transferShippedBy} onChange={e => setTransferShippedBy(e.target.value)}
                      placeholder="UUID người giao hàng"
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ghi chú</label>
                    <input value={transferNotes} onChange={e => setTransferNotes(e.target.value)}
                      placeholder="Ghi chú đơn vận chuyển"
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                  </div>
                </div>
              </div>

              {/* Section 4: Sản phẩm */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <SectionLabel>Danh sách sản phẩm</SectionLabel>
                  <button onClick={addTransferItemRow} className="flex items-center gap-1 text-blue-600 text-xs font-semibold hover:text-blue-700">
                    <Plus size={13} /> Thêm sản phẩm
                  </button>
                </div>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        {['Sản phẩm', 'Lô hàng', 'SL yêu cầu', 'SL nhận', 'Ghi chú', ''].map(h => (
                          <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {transferItems.length === 0 ? (
                        <tr><td colSpan={6} className="px-4 py-6 text-center text-xs text-gray-400">Chưa có sản phẩm</td></tr>
                      ) : transferItems.map((item, idx) => (
                        <tr key={item.id} className={idx !== transferItems.length - 1 ? 'border-b border-gray-100' : ''}>
                          <td className="px-4 py-2.5">
                            <select value={item.productId} onChange={e => updateTransferItemRow(item.id, 'productId', e.target.value)}
                              className="appearance-none border border-gray-200 rounded-md bg-white text-sm px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/40 w-full">
                              <option value="">{isLoadingProducts ? 'Đang tải...' : 'Chọn sản phẩm'}</option>
                              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                          </td>
                          <td className="px-4 py-2.5">
                            <select value={item.batchId} onChange={e => updateTransferItemRow(item.id, 'batchId', e.target.value)}
                              className="appearance-none border border-gray-200 rounded-md bg-white text-sm px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/40 w-full">
                              <option value="">{isLoadingBatches ? 'Đang tải...' : 'Chọn lô'}</option>
                              {batches
                                .filter(b => !item.productId || b.productId === item.productId)
                                .map(b => (
                                  <option key={b.id} value={b.id}>
                                    {b.batchNumber} ({b.quantity})
                                  </option>
                                ))}
                            </select>
                          </td>
                          {/* ── requestedQuantity: string state, sanitize on change ── */}
                          <td className="px-4 py-2.5">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={item.requestedQuantity}
                              onChange={e => updateTransferItemRow(
                                item.id, 'requestedQuantity',
                                sanitizeNumericInput(e.target.value)
                              )}
                              className="border border-gray-200 rounded-md px-2 py-1.5 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            />
                          </td>
                          {/* ── receivedQuantity: string state, sanitize on change ── */}
                          <td className="px-4 py-2.5">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={item.receivedQuantity}
                              onChange={e => updateTransferItemRow(
                                item.id, 'receivedQuantity',
                                sanitizeNumericInput(e.target.value)
                              )}
                              className="border border-gray-200 rounded-md px-2 py-1.5 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            />
                          </td>
                          <td className="px-4 py-2.5">
                            <input value={item.notes} onChange={e => updateTransferItemRow(item.id, 'notes', e.target.value)}
                              placeholder="Ghi chú..."
                              className="border border-gray-200 rounded-md px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                          </td>
                          <td className="px-3 py-2.5">
                            <button onClick={() => removeTransferItemRow(item.id)}
                              className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors">
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <span className="text-xs text-gray-500">{transferItems.length} sản phẩm</span>
              <div className="flex gap-3">
                <button onClick={closeTransferModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                  Hủy
                </button>
                <button onClick={handleCreateTransfer} disabled={isSubmittingTransfer}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-60">
                  {isSubmittingTransfer && <Loader2 size={13} className="animate-spin" />}
                  <Truck size={13} /> Tạo đơn vận chuyển
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          CREATE REQUEST MODAL
      ══════════════════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
                  <Package size={14} className="text-white" />
                </div>
                <h2 className="text-sm font-bold text-gray-900">Tạo Yêu Cầu Nhập Hàng</h2>
              </div>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
            </div>

            <div className="px-6 py-5 space-y-6">

              {/* Section 1: Tuyến kho */}
              <div>
                <SectionLabel>Tuyến kho</SectionLabel>
                <div className="grid grid-cols-3 gap-4">
                  <SelectField label="Kho nguồn" required value={fromWarehouseId} onChange={setFromWarehouseId}
                    options={[{ value: '', label: isLoadingWarehouses ? 'Đang tải...' : 'Chọn kho' },
                      ...warehouses.map(w => ({ value: w.id, label: w.name }))]} />
                  <SelectField label="Loại nguồn" value={fromLocType} onChange={setFromLocType}
                    options={[{ value: 'WAREHOUSE', label: 'Kho' }, { value: 'STORE', label: 'Cửa hàng' }]} />
                  <div />
                  <SelectField label="Kho đích" required value={toWarehouseId} onChange={setToWarehouseId}
                    options={[{ value: '', label: isLoadingWarehouses ? 'Đang tải...' : 'Chọn kho đích' },
                      ...warehouses.map(w => ({ value: w.id, label: w.name }))]} />
                  <SelectField label="Loại đích" value={toLocType} onChange={setToLocType}
                    options={[{ value: 'STORE', label: 'Cửa hàng' }, { value: 'WAREHOUSE', label: 'Kho' }]} />
                  <SelectField label="Mức độ ưu tiên" value={priority} onChange={setPriority}
                    options={[{ value: 'NORMAL', label: 'Bình thường' }, { value: 'HIGH', label: 'Cao' }, { value: 'URGENT', label: 'Khẩn cấp' }]} />
                </div>
              </div>

              {/* Section 2: Ghi chú */}
              <div>
                <SectionLabel>Ghi chú</SectionLabel>
                <textarea rows={2} placeholder="Lý do nhập hàng, hướng dẫn cụ thể..." value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-green-500/40" />
              </div>

              {/* Section 3: Sản phẩm */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <SectionLabel>Danh sách sản phẩm</SectionLabel>
                  <button onClick={addProductRow} className="flex items-center gap-1 text-green-600 text-xs font-semibold hover:text-green-700">
                    <Plus size={13} /> Thêm sản phẩm
                  </button>
                </div>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        {['Sản phẩm', 'ĐVT', 'Hiện tại', 'Yêu cầu', 'Lý do', ''].map(h => (
                          <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {productRows.map((row, idx) => (
                        <tr key={row.id} className={idx !== productRows.length - 1 ? 'border-b border-gray-100' : ''}>
                          <td className="px-4 py-2.5">
                            <div className="relative">
                              <select value={row.productId} onChange={e => updateRow(row.id, 'productId', e.target.value)}
                                className="appearance-none border border-gray-200 rounded-md bg-white text-sm px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500/40 pr-6 w-full">
                                <option value="">{isLoadingProducts ? 'Đang tải...' : 'Chọn sản phẩm'}</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={12} />
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-gray-500 text-xs">{row.unit || '—'}</td>
                          <td className="px-4 py-2.5 text-gray-600 text-xs">{row.currentQty}</td>
                          {/* ── requestQty: string state, sanitize on change ── */}
                          <td className="px-4 py-2.5">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={row.requestQty}
                              onChange={e => updateRow(row.id, 'requestQty', sanitizeNumericInput(e.target.value))}
                              placeholder="0"
                              className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center text-green-600 font-semibold focus:outline-none focus:ring-2 focus:ring-green-500/40"
                            />
                          </td>
                          <td className="px-4 py-2.5">
                            <input type="text" value={row.reason} onChange={e => updateRow(row.id, 'reason', e.target.value)}
                              placeholder="Lý do..."
                              className="w-full border-0 bg-transparent text-sm text-gray-500 italic focus:outline-none" />
                          </td>
                          <td className="px-3 py-2.5">
                            <button onClick={() => removeProductRow(row.id)}
                              className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors">
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="px-4 py-2.5 border-t border-gray-100">
                    <button onClick={addProductRow} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-green-600 transition-colors">
                      <Plus size={13} className="text-green-500" /> Thêm hàng mới
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <span className="text-xs text-gray-500">{productRows.filter(r => r.productId).length} sản phẩm</span>
              <div className="flex gap-3">
                <button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                  Hủy
                </button>
                <button onClick={handleSubmit} disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-60">
                  {isSubmitting && <Loader2 size={13} className="animate-spin" />}
                  Gửi yêu cầu <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          PAGE HEADER
      ══════════════════════════════════════════════════════ */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Yêu Cầu Nhập Hàng</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý yêu cầu chuyển kho và cấp phát hàng trên toàn mạng lưới.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { fetchRequests(); fetchTransfers() }}
            className="p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" title="Làm mới">
            <RefreshCw size={15} className="text-gray-500" />
          </button>
          <button onClick={openTransferModal}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors">
            <Truck size={15} /> Tạo Đơn Vận Chuyển
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          TABLE 1 — YÊU CẦU NHẬP HÀNG
      ══════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
              <FileText size={13} className="text-green-600" />
            </div>
            <h2 className="text-sm font-bold text-gray-900">Yêu Cầu Nhập Hàng</h2>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
              {filtered.length}
            </span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input type="text" placeholder="Tìm theo mã yêu cầu..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/40 w-52" />
            </div>
            <div className="relative">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="appearance-none border border-gray-200 rounded-lg pl-3 pr-7 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500/40">
                <option value="ALL">Tất cả trạng thái</option>
                <option value="PENDING">Chờ xử lý</option>
                <option value="APPROVED">Đã duyệt</option>
                <option value="PROCESSING">Đang xử lý</option>
                <option value="COMPLETED">Hoàn thành</option>
                <option value="REJECTED">Từ chối</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={13} />
            </div>
            <div className="relative">
              <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
                className="appearance-none border border-gray-200 rounded-lg pl-3 pr-7 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500/40">
                <option value="ALL">Tất cả ưu tiên</option>
                <option value="NORMAL">Bình thường</option>
                <option value="HIGH">Cao</option>
                <option value="URGENT">Khẩn cấp</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={13} />
            </div>
          </div>
        </div>

        {error && !isLoading && (
          <div className="mx-5 mt-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center justify-between text-sm">
            {error}
            <button onClick={fetchRequests} className="text-xs underline hover:no-underline">Thử lại</button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {['Số yêu cầu', 'Từ kho', 'Tới kho', 'Ưu tiên', 'Trạng thái', 'Ngày tạo'].map(col => (
                  <th key={col} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
              ) : reqPagination.paginated.length === 0 ? (
                <EmptyState text="Không có yêu cầu nào phù hợp với bộ lọc" />
              ) : reqPagination.paginated.map(req => (
                <tr key={req.id} onClick={() => setSelectedRequest(req)}
                  className={`border-b border-gray-50 cursor-pointer transition-colors ${
                    selectedRequest?.id === req.id
                      ? 'bg-green-50 border-l-2 border-l-green-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="px-5 py-3.5 font-semibold text-gray-900">{req.requestNumber}</td>
                  <td className="px-5 py-3.5 text-gray-600 text-xs">{getWarehouseLabel(req.fromWarehouseId)}</td>
                  <td className="px-5 py-3.5 text-gray-600 text-xs">{getWarehouseLabel(req.toWarehouseId)}</td>
                  <td className="px-5 py-3.5"><PriorityBadge priority={req.priority} /></td>
                  <td className="px-5 py-3.5"><StatusBadge status={req.status} /></td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">{fmtDate(req.requestedDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <PaginationBar
          page={reqPagination.page} totalPages={reqPagination.totalPages}
          total={reqPagination.total} pageSize={reqPagination.pageSize}
          setPage={reqPagination.setPage}
        />
      </div>

      {/* ══════════════════════════════════════════════════════
          DETAIL PANEL
      ══════════════════════════════════════════════════════ */}
      {selectedRequest && !isLoading && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 text-base">{selectedRequest.requestNumber}</h3>
                <StatusBadge status={selectedRequest.status} />
                <PriorityBadge priority={selectedRequest.priority} />
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Tạo: {fmtDate(selectedRequest.requestedDate)}
                {selectedRequest.approvedDate && ` · Duyệt: ${fmtDate(selectedRequest.approvedDate)}`}
              </p>
            </div>
            {selectedRequest.status === 'PENDING' && (
              <div className="flex gap-2">
                <button onClick={() => handleUpdateStatus(selectedRequest.id, 'REJECTED')}
                  className="flex items-center gap-1.5 border border-gray-200 text-gray-700 font-medium py-1.5 px-3.5 rounded-lg text-xs hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors">
                  <XCircle size={13} /> Từ chối
                </button>
                <button onClick={() => handleUpdateStatus(selectedRequest.id, 'APPROVED')}
                  className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white font-semibold py-1.5 px-3.5 rounded-lg text-xs transition-colors">
                  <CheckCircle size={13} /> Duyệt
                </button>
              </div>
            )}
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
              <div className="xl:col-span-2 space-y-5">
                <div>
                  <SectionLabel>Tuyến kho</SectionLabel>
                  <div className="grid grid-cols-2 gap-4">
                    <InfoField label="Từ kho" value={getWarehouseLabel(selectedRequest.fromWarehouseId)} icon={MapPin} />
                    <InfoField label="Tới kho" value={getWarehouseLabel(selectedRequest.toWarehouseId)} icon={MapPin} />
                    <InfoField label="Loại nguồn" value={`${selectedRequest.fromLocationType} → ${selectedRequest.toLocationType}`} />
                  </div>
                </div>
                <div>
                  <SectionLabel>Nhân sự</SectionLabel>
                  <div className="grid grid-cols-2 gap-4">
                    <InfoField label="Người yêu cầu" value={getUserLabel(selectedRequest.requestedBy)} icon={User} />
                    <InfoField label="Người duyệt" value={getUserLabel(selectedRequest.approvedBy)} icon={User} />
                  </div>
                </div>
                {selectedRequest.transferId && (
                  <div>
                    <SectionLabel>Vận chuyển</SectionLabel>
                    <InfoField label="Mã vận chuyển" value={selectedRequest.transferId} icon={Truck} highlight />
                  </div>
                )}
                {selectedRequest.notes && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Ghi chú</p>
                    <p className="text-sm text-gray-600">{selectedRequest.notes}</p>
                  </div>
                )}
              </div>

              <div className="xl:col-span-3">
                <div className="flex items-center justify-between mb-3">
                  <SectionLabel>Sản phẩm yêu cầu</SectionLabel>
                  <span className="text-xs text-gray-500">{selectedRequest.items.length} sản phẩm</span>
                </div>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        {['Sản phẩm', 'ĐVT', 'Hiện tại', 'Yêu cầu', 'Đã duyệt', 'Lý do'].map(h => (
                          <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRequest.items.length === 0 ? (
                        <tr><td colSpan={6} className="px-4 py-6 text-center text-xs text-gray-400">Không có sản phẩm</td></tr>
                      ) : selectedRequest.items.map((item: RestockRequestItem, idx: number) => {
                        const product = products.find(p => p.id === item.productId)
                        const productName = item.productName || product?.name || item.productId || '—'
                        const productUnit = item.unit || product?.unit || '—'
                        return (
                          <tr key={item.id} className={idx !== selectedRequest.items.length - 1 ? 'border-b border-gray-100' : ''}>
                            <td className="px-4 py-3 font-medium text-gray-800">{productName}</td>
                            <td className="px-4 py-3 text-gray-400 text-xs">{productUnit}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs">{item.currentQuantity}</td>
                            <td className="px-4 py-3 font-semibold text-green-600">{item.requestedQuantity}</td>
                            <td className="px-4 py-3">
                              {item.approvedQuantity !== null
                                ? <span className="font-semibold text-teal-600">{item.approvedQuantity}</span>
                                : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="px-4 py-3 text-gray-400 italic text-xs">{item.reason || '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TABLE 2 — LỊCH SỬ ĐƠN VẬN CHUYỂN
      ══════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
              <Truck size={13} className="text-blue-600" />
            </div>
            <h2 className="text-sm font-bold text-gray-900">Lịch Sử Đơn Vận Chuyển</h2>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
              {filteredTransfers.length}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input type="text" placeholder="Tìm mã đơn, mã yêu cầu..." value={transferSearch}
                onChange={e => setTransferSearch(e.target.value)}
                className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 w-52" />
            </div>
            <div className="relative">
              <select value={transferStatusFilter} onChange={e => setTransferStatusFilter(e.target.value)}
                className="appearance-none border border-gray-200 rounded-lg pl-3 pr-7 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40">
                <option value="ALL">Tất cả trạng thái</option>
                <option value="PENDING">Chờ xử lý</option>
                <option value="SHIPPED">Đã xuất kho</option>
                <option value="IN_TRANSIT">Đang vận chuyển</option>
                <option value="DELIVERED">Đã giao đến kho nhận</option>
                <option value="COMPLETED">Hoàn thành</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={13} />
            </div>
            <button onClick={fetchTransfers} title="Làm mới"
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <RefreshCw size={14} className={`text-gray-500 ${isLoadingTransfers ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {transferError && (
          <div className="mx-5 mt-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center justify-between text-sm">
            {transferError}
            <button onClick={fetchTransfers} className="text-xs underline">Thử lại</button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {['Mã đơn vận chuyển', 'Mã yêu cầu', 'Từ', 'Đến', 'Trạng thái', 'Ngày tạo', 'Giao dự kiến', 'Thao tác'].map(col => (
                  <th key={col} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoadingTransfers ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={8} />)
              ) : trPagination.paginated.length === 0 ? (
                <EmptyState text="Chưa có đơn vận chuyển nào" />
              ) : trPagination.paginated.map((t, idx) => (
                <tr key={t.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${idx === trPagination.paginated.length - 1 ? 'border-b-0' : ''}`}>
                  <td className="px-5 py-3.5 font-semibold text-blue-600 font-mono text-xs">{t.transferNumber}</td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs font-mono">
                    {/* NOTE: map restockRequestId from TransferFromAPI when field confirmed */}
                    {(t as any).restockRequestId ? String((t as any).restockRequestId).slice(0, 8) + '...' : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 text-xs">{t.fromLocationId ? getWarehouseLabel(t.fromLocationId) : '—'}</td>
                  <td className="px-5 py-3.5 text-gray-600 text-xs">{t.toLocationId ? getWarehouseLabel(t.toLocationId) : '—'}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={t.status} /></td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">{fmtDate(t.transferDate)}</td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                    {t.actualDelivery ? fmtDate(t.actualDelivery ?? null) : fmtDate(t.expectedDelivery ?? null)}
                    {t.actualDelivery && <span className="ml-1.5 text-teal-600 font-medium text-xs">✓</span>}
                  </td>
                  <td className="px-5 py-3.5 flex items-center gap-2">
                    <button
                      onClick={() => setSelectedTransfer(t)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Xem chi tiết"
                    >
                      <Eye size={12} />
                      Chi tiết
                    </button>
                    {canReceiveTransfer(t) && (
                      <button
                        onClick={() => handleReceiveTransfer(t)}
                        disabled={receivingTransferId === t.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {receivingTransferId === t.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                        Xác nhận
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <PaginationBar
          page={trPagination.page} totalPages={trPagination.totalPages}
          total={trPagination.total} pageSize={trPagination.pageSize}
          setPage={trPagination.setPage}
        />
      </div>

      {/* ══════════════════════════════════════════════════════
          TRANSFER DETAIL PANEL
      ══════════════════════════════════════════════════════ */}
      {selectedTransfer && !isLoadingTransfers && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 text-base">{selectedTransfer.transferNumber}</h3>
                <StatusBadge status={selectedTransfer.status} />
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Tạo: {fmtDate(selectedTransfer.transferDate)}
                {selectedTransfer.actualDelivery && ` · Giao: ${fmtDate(selectedTransfer.actualDelivery)}`}
              </p>
            </div>
            <button
              onClick={() => setSelectedTransfer(null)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
              <div className="xl:col-span-2 space-y-5">
                <div>
                  <SectionLabel>Tuyến vận chuyển</SectionLabel>
                  <div className="grid grid-cols-2 gap-4">
                    <InfoField
                      label="Từ kho"
                      value={getWarehouseLabel(selectedTransfer.fromLocationId)}
                      icon={MapPin}
                    />
                    <InfoField
                      label="Tới kho"
                      value={getWarehouseLabel(selectedTransfer.toLocationId)}
                      icon={MapPin}
                    />
                  </div>
                </div>
                <div>
                  <SectionLabel>Thông tin giao hàng</SectionLabel>
                  <div className="grid grid-cols-2 gap-4">
                    <InfoField
                      label="Dự kiến giao"
                      value={fmtDate(selectedTransfer.expectedDelivery)}
                    />
                    <InfoField
                      label="Thực tế giao"
                      value={selectedTransfer.actualDelivery ? fmtDate(selectedTransfer.actualDelivery) : '—'}
                    />
                  </div>
                </div>
                {selectedTransfer.shippedBy && (
                  <div>
                    <SectionLabel>Người giao</SectionLabel>
                    <InfoField label="Người giao hàng" value={getUserLabel(selectedTransfer.shippedBy)} icon={User} />
                  </div>
                )}
                {selectedTransfer.notes && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Ghi chú</p>
                    <p className="text-sm text-gray-600">{selectedTransfer.notes}</p>
                  </div>
                )}
              </div>

              <div className="xl:col-span-3">
                <div className="flex items-center justify-between mb-3">
                  <SectionLabel>Sản phẩm vận chuyển</SectionLabel>
                  <span className="text-xs text-gray-500">{selectedTransfer.items?.length ?? 0} sản phẩm</span>
                </div>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        {['Sản phẩm', 'Lô', 'SL yêu cầu', 'SL giao', 'SL nhận', 'Ghi chú'].map(h => (
                          <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {!selectedTransfer.items || selectedTransfer.items.length === 0 ? (
                        <tr><td colSpan={6} className="px-4 py-6 text-center text-xs text-gray-400">Không có sản phẩm</td></tr>
                      ) : selectedTransfer.items.map((item: any, idx: number) => {
                        const product = products.find(p => p.id === item.productId)
                        const productName = item.productName || product?.name || item.productId || '—'
                        return (
                          <tr key={item.id} className={idx !== selectedTransfer.items.length - 1 ? 'border-b border-gray-100' : ''}>
                            <td className="px-4 py-3 font-medium text-gray-800">{productName}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs font-mono">{item.batchNumber || item.batchId || '—'}</td>
                            <td className="px-4 py-3 font-semibold text-blue-600">{item.requestedQuantity ?? '—'}</td>
                            <td className="px-4 py-3 text-gray-600">{item.shippedQuantity ?? '—'}</td>
                            <td className="px-4 py-3 font-semibold text-teal-600">{item.receivedQuantity ?? '—'}</td>
                            <td className="px-4 py-3 text-gray-400 italic text-xs">{item.notes || '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}