'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Plus, Search, Eye,
  ChevronLeft, ChevronRight, X, ChevronDown,
  Package, ArrowRight, Trash2
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { RestockAPIService, type CreateRestockRequestDTO, type RestockRequestFromAPI } from '@/services/restock-api.service'
import { WarehouseAPIService } from '@/services/warehouse-api.service'
import { ReplenishmentProductAPIService, type CatalogProductFromAPI } from '@/services/replenishment-product-api.service'
import { supplierService } from '@/services/supplier.service'
import { localApiClient } from '@/shared/api/http'
import { ToastContainer, type ToastItem } from '@/shared/ui/Toast'

type UiStatus = 'Tất cả' | 'Chờ duyệt' | 'Đã duyệt' | 'Đã từ chối' | 'Đang xử lý' | 'Hoàn tất'
type UiPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

type CreateItem = {
  productId: string
  sku: string
  productName: string
  unit: string
  currentQuantity: number
  requestedQuantity: number
  reason: string
}

type ReceiveItemForm = {
  productId: string
  productName: string
  quantity: number
  batchNumber: string
  unitPrice: number
  supplierName: string
  supplierId: string
  manufacturingDate: string
  expiryDate: string
}

type SupplierOption = {
  id: string
  name: string
}

const TABS: UiStatus[] = ['Tất cả', 'Chờ duyệt', 'Đã duyệt', 'Đã từ chối', 'Đang xử lý', 'Hoàn tất']
const PAGE_SIZE = 10
const DEFAULT_RECEIVED_BY = '88888888-8888-8888-8888-888888888881'

const looksLikeUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || '').trim())

const extractApiErrorMessage = (error: any): string => {
  const data = error?.response?.data

  const direct = data?.message || data?.error || error?.message
  if (typeof direct === 'string' && direct.trim() && direct !== 'Request failed with status code 400') {
    return direct
  }

  const errors = data?.errors
  if (errors && typeof errors === 'object') {
    const parts: string[] = []
    for (const key of Object.keys(errors)) {
      const val = errors[key]
      if (Array.isArray(val) && val.length > 0) {
        parts.push(String(val[0]))
      } else if (typeof val === 'string' && val.trim()) {
        parts.push(val)
      }
    }
    if (parts.length > 0) return parts.join(' | ')
  }

  return 'Nhận hàng thất bại (400). Vui lòng kiểm tra lại mã phiếu, kho, người nhận và dữ liệu dòng hàng.'
}

const shortId = (value: string) => {
  const v = String(value || '').trim()
  if (!v) return '—'
  return v.length > 16 ? `${v.slice(0, 8)}...${v.slice(-4)}` : v
}

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

function statusFromApiToUi(status?: string | null): Exclude<UiStatus, 'Tất cả'> {
  const s = String(status ?? '').trim().toUpperCase()
  if (s === 'APPROVED') return 'Đã duyệt'
  if (s === 'REJECTED') return 'Đã từ chối'
  if (s === 'PROCESSING') return 'Đang xử lý'
  if (s === 'COMPLETED') return 'Hoàn tất'
  return 'Chờ duyệt'
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

function sumRequestedQty(req: RestockRequestFromAPI) {
  const items = Array.isArray(req.items) ? req.items : []
  return items.reduce((sum, it) => sum + Number(it.requestedQuantity ?? 0), 0)
}

function extractRejectReason(req: RestockRequestFromAPI | null): string {
  if (!req) return ''
  const anyReq = req as any
  const candidates = [
    anyReq?.rejectReason,
    anyReq?.rejectionReason,
    anyReq?.reason,
    anyReq?.rejectNote,
    anyReq?.notes,
  ]
  for (const val of candidates) {
    const text = String(val ?? '').trim()
    if (text) {
      return text
        .replace(/^rejection\s*reason\s*:\s*/i, '')
        .replace(/^reject\s*reason\s*:\s*/i, '')
        .trim()
    }
  }
  return ''
}

// ─── Add Product Dropdown ─────────────────────────────────────────────────────

function AddProductDropdown({
  existing,
  onAdd,
  onClose,
  products,
  loading,
}: {
  existing: string[]
  onAdd: (p: CatalogProductFromAPI) => void
  onClose: () => void
  products: CatalogProductFromAPI[]
  loading: boolean
}) {
  const available = products.filter((p) => !existing.includes(String(p.id)))
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const filtered = available.filter((p) => {
    const q = search.toLowerCase()
    return String(p.name ?? '').toLowerCase().includes(q) || String(p.sku ?? '').toLowerCase().includes(q)
  })

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const handleSelect = (p: CatalogProductFromAPI) => {
    onAdd(p)
    onClose()
  }

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
      style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
    >
      {/* Dropdown header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Chọn sản phẩm từ Kho Tổng</p>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 transition-colors">
            <X size={14} />
          </button>
        </div>
        <div className="relative">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc mã SP..."
            className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 placeholder:text-gray-300 transition-all"
          />
        </div>
      </div>

      {/* Product list */}
      <div className="max-h-64 overflow-y-auto">
        {loading ? (
          <div className="py-8 text-center">
            <Package size={20} className="mx-auto text-gray-300 mb-2" />
            <p className="text-xs text-gray-400">Đang tải danh mục sản phẩm...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center">
            <Package size={20} className="mx-auto text-gray-300 mb-2" />
            <p className="text-xs text-gray-400">
              {available.length === 0 ? 'Đã thêm tất cả sản phẩm' : 'Không tìm thấy sản phẩm'}
            </p>
          </div>
        ) : filtered.map((p) => (
          <button
            key={p.id}
            onClick={() => handleSelect(p)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50/60 transition-colors text-left group border-b border-gray-50 last:border-0"
          >
            {/* Icon */}
            <div className="w-8 h-8 rounded-xl bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center flex-shrink-0 transition-colors">
              <Package size={13} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{p.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-gray-400 font-mono">{p.sku}</span>
                <span className="text-gray-200">·</span>
                <span className="text-[10px] text-gray-400 truncate">{p.categoryName ?? ''}</span>
              </div>
            </div>
            {/* Stock + priority */}
            <div className="text-right flex-shrink-0">
              <p className="text-[10px] font-bold text-gray-600">—</p>
              <p className="text-[9px] text-gray-400">tồn (TODO)</p>
            </div>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500 border border-gray-200 flex-shrink-0">
              SP
            </span>
          </button>
        ))}
      </div>

      {/* Footer hint */}
      {available.length > 0 && (
        <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 text-center">
            {available.length} sản phẩm có sẵn
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Create Request Modal ─────────────────────────────────────────────────────

function CreateRequestModal({
  onClose,
  fromWarehouseId,
  fromWarehouseName,
  inventoryLocationType,
  inventoryLocationId,
  onCreated,
}: {
  onClose: () => void
  fromWarehouseId: string
  fromWarehouseName: string
  inventoryLocationType: string
  inventoryLocationId: string
  onCreated: () => void
}) {
  const [items, setItems] = useState<CreateItem[]>([])
  const [priority, setPriority] = useState<UiPriority>('NORMAL')
  const [notes, setNotes] = useState('')
  const [showAddDropdown, setShowAddDropdown] = useState(false)
  const [products, setProducts] = useState<CatalogProductFromAPI[]>([])
  const [productsLoading, setProductsLoading] = useState(false)

  const [inventoryLoading, setInventoryLoading] = useState(false)
  const [inventoryByProductId, setInventoryByProductId] = useState<Record<string, number>>({})

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!inventoryLocationType || !inventoryLocationId) {
      setInventoryByProductId({})
      return
    }
    setInventoryLoading(true)
    const invTypeNormalized = String(inventoryLocationType ?? '')
      .trim()
      .toLowerCase()
      .includes('store')
      ? 'Store'
      : 'Warehouse'

    localApiClient
      .get(`/inventory/location/${encodeURIComponent(invTypeNormalized)}/${encodeURIComponent(inventoryLocationId)}`)
      .then((res) => {
        const payload = res.data
        const list: any[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : []

        const map: Record<string, number> = {}
        for (const row of list) {
          const pid = String(row?.productId ?? row?.product?.id ?? '').trim()
          if (!pid) continue
          const available = Number(row?.availableQuantity ?? row?.quantity ?? 0)
          map[pid] = Number.isFinite(available) ? Math.max(0, available) : 0
        }

        if (!cancelled) setInventoryByProductId(map)
      })
      .catch(() => {
        if (!cancelled) setInventoryByProductId({})
      })
      .finally(() => {
        if (!cancelled) setInventoryLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [inventoryLocationType, inventoryLocationId])

  // Nếu inventory load xong sau khi người dùng đã chọn sản phẩm, cập nhật tồn hiện có.
  useEffect(() => {
    if (Object.keys(inventoryByProductId).length === 0) return
    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        currentQuantity: inventoryByProductId[String(it.productId)] ?? it.currentQuantity ?? 0,
      })),
    )
  }, [inventoryByProductId])

  useEffect(() => {
    let cancelled = false
    setProductsLoading(true)
    ReplenishmentProductAPIService.getAllProducts()
      .then((list) => {
        if (!cancelled) setProducts(Array.isArray(list) ? list : [])
      })
      .catch(() => {
        if (!cancelled) setProducts([])
      })
      .finally(() => {
        if (!cancelled) setProductsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const updateItem = (productId: string, field: keyof CreateItem, val: string | number) => {
    setItems((prev) => prev.map((p) => (p.productId === productId ? { ...p, [field]: val as any } : p)))
  }
  const removeItem = (productId: string) => setItems((prev) => prev.filter((p) => p.productId !== productId))

  const onAddProduct = async (p: CatalogProductFromAPI) => {
    const pid = String(p.id || '').trim()
    if (!pid) return
    if (items.some((x) => String(x.productId) === pid)) return

    setItems((prev) => [
      ...prev,
      {
        productId: pid,
        sku: String(p.sku || ''),
        productName: String(p.name || ''),
        unit: String(p.unit || ''),
        currentQuantity: inventoryByProductId[pid] ?? 0,
        requestedQuantity: 1,
        reason: '',
      },
    ])

    // Best-effort enrich from details-batch in case picker data is incomplete.
    const enrich = (await ReplenishmentProductAPIService.detailsBatch([pid]).catch(() => ({}))) as Record<
      string,
      Partial<CatalogProductFromAPI>
    >
    const e = enrich[String(pid)]
    if (e?.sku || e?.name || e?.unit) {
      setItems((prev) =>
        prev.map((it) =>
          it.productId !== pid
            ? it
            : {
                ...it,
                sku: it.sku || String(e?.sku || ''),
                productName: it.productName || String(e?.name || ''),
                unit: it.unit || String(e?.unit || ''),
              }
        )
      )
    }
  }

  const submit = async () => {
    setSubmitError(null)
    if (!priority) {
      setSubmitError('Vui lòng chọn mức độ ưu tiên.')
      return
    }
    if (items.length === 0) {
      setSubmitError('Vui lòng thêm ít nhất 1 sản phẩm.')
      return
    }
    for (const it of items) {
      if (!it.productId) {
        setSubmitError('Có dòng sản phẩm thiếu productId.')
        return
      }
      if (!Number.isFinite(Number(it.requestedQuantity)) || Number(it.requestedQuantity) <= 0) {
        setSubmitError(`Số lượng yêu cầu của "${it.productName || it.sku || it.productId}" phải > 0.`)
        return
      }
    }

    const toRestockLocationType: string =
      String(inventoryLocationType ?? '')
        .toLowerCase()
        .includes('store')
        ? 'STORE'
        : 'WAREHOUSE'

    const normalizedFromWarehouseId = String(fromWarehouseId ?? '').trim()
    const normalizedToWarehouseId = String(inventoryLocationId ?? '').trim()

    const dto: CreateRestockRequestDTO = {
      toWarehouseId: normalizedToWarehouseId,
      toLocationType: toRestockLocationType,
      priority,
      notes: notes.trim() || undefined,
      items: items.map((it) => ({
        productId: it.productId,
        requestedQuantity: Number(it.requestedQuantity),
        currentQuantity: Number(it.currentQuantity ?? 0),
        reason: it.reason?.trim() || undefined,
      })),
    }

    // Backend accepts omitted source fields and defaults source routing to parent/admin flow.
    if (
      normalizedFromWarehouseId &&
      normalizedFromWarehouseId.toLowerCase() !== normalizedToWarehouseId.toLowerCase()
    ) {
      dto.fromWarehouseId = normalizedFromWarehouseId
      dto.fromLocationType = 'WAREHOUSE'
    }

    try {
      setSubmitting(true)
      await RestockAPIService.create(dto)
      onCreated()
      onClose()
    } catch (e: any) {
      const message =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        'Tạo yêu cầu thất bại. Vui lòng thử lại.'
      setSubmitError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div className="px-8 pt-7 pb-5 flex items-start justify-between border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Tạo phiếu yêu cầu nhập hàng</h2>
            <p className="text-xs text-gray-400 mt-1">Tạo phiếu theo đúng flow duyệt/từ chối (Restock Requests)</p>
          </div>
          <div className="flex items-center gap-4"> 
            <button onClick={onClose} className="text-gray-300 hover:text-gray-500 transition-colors p-1 rounded-lg hover:bg-gray-100">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6 flex-1">

          {/* ── Form Fields: 4 cols top row + textarea spanning right ── */}
          <div className="grid grid-cols-[1fr_1fr_1fr_1fr] grid-rows-[auto_auto] gap-4">

            {/* Row 1 */}
            {/* Kho gửi */}
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Kho gửi
              </label>
              <div className="relative">
                <input
                  readOnly
                  value={fromWarehouseName || fromWarehouseId}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-600 bg-gray-50 cursor-not-allowed focus:outline-none pr-14"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-md px-1.5 py-0.5 tracking-wide">
                  AUTO
                </span>
              </div>
            </div>

            {/* toWarehouseId/toLocationType (hidden for now) */}
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Kho đích / Nơi nhận
              </label>
              <input
                readOnly
                value="Admin"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-600 bg-gray-50 cursor-not-allowed"
              />
            </div>

            {/* Mức độ ưu tiên — spans col 3–4 */}
            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Mức độ ưu tiên
              </label>
              <div className="flex gap-2 h-[42px]">
                {([
                  { val: 'NORMAL', icon: '●', active: 'bg-gray-800 text-white border-gray-800 shadow-sm' },
                  { val: 'HIGH', icon: '▲', active: 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200' },
                  { val: 'URGENT', icon: '⚠', active: 'bg-red-500 text-white border-red-500 shadow-sm shadow-red-100' },
                ] as const).map(opt => (
                  <button
                    key={opt.val}
                    onClick={() => setPriority(opt.val)}
                    className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-bold rounded-xl border transition-all ${
                      priority === opt.val
                        ? opt.active
                        : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-600'
                    }`}
                  >
                    <span className="text-[10px]">{opt.icon}</span>
                    {opt.val}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 2 */}
            {/* Ghi chú — spans full width */}
            <div className="col-span-4">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Ghi chú chung
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Nhập nội dung ghi chú cho phiếu yêu cầu (lý do nhập hàng, ghi chú quan trọng...)"
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 placeholder:text-gray-300 transition-all"
              />
            </div>
          </div>

          {/* ── Line Items Table ── */}
          <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">

            {/* Table top bar — dark */}
            <div className="bg-[#0f1f3d] px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-white font-bold text-sm">Chi tiết mặt hàng yêu cầu</span>
                <span className="text-[10px] font-bold text-blue-300 bg-blue-400/15 border border-blue-400/25 rounded-full px-2 py-0.5">
                  {items.length} sản phẩm
                </span>
              </div>

              {/* Add product button with dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowAddDropdown(v => !v)}
                  className={`flex items-center gap-1.5 text-[11px] font-bold border rounded-lg px-3 py-1.5 transition-all ${
                    showAddDropdown
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'text-blue-400 hover:text-blue-300 border-blue-400/30 hover:border-blue-400/60 hover:bg-blue-400/5'
                  }`}
                >
                  <Plus size={11} />
                  THÊM SẢN PHẨM
                  <ChevronDown size={10} className={`transition-transform ${showAddDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showAddDropdown && (
                  <AddProductDropdown
                    products={products}
                    existing={items.map(i => i.productId)}
                    onAdd={onAddProduct}
                    onClose={() => setShowAddDropdown(false)}
                    loading={productsLoading}
                  />
                )}
              </div>
            </div>

            {/* Column headers — light gray */}
            <div className="bg-gray-50 border-b border-gray-200 grid grid-cols-[90px_1fr_90px_110px_110px_1fr_36px] gap-3 px-5 py-2.5">
              {['SKU', 'TÊN SẢN PHẨM', 'ĐƠN VỊ', 'TỒN HIỆN CÓ', 'SL YÊU CẦU', 'LÝ DO DÒNG', ''].map(h => (
                <span key={h} className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{h}</span>
              ))}
            </div>

            {/* Rows — white background */}
            <div className="bg-white divide-y divide-gray-100">
              {items.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <Package size={20} className="text-gray-400" />
                  </div>
                  <p className="text-sm font-semibold text-gray-500">Chưa có sản phẩm</p>
                  <p className="text-xs text-gray-400 mt-1">Nhấn &quot;Thêm sản phẩm&quot; để chọn từ Kho Tổng</p>
                </div>
              ) : items.map(item => (
                <div
                  key={item.productId}
                  className="grid grid-cols-[90px_1fr_90px_110px_110px_1fr_36px] gap-3 px-5 py-3.5 items-center group hover:bg-blue-50/30 transition-colors"
                >
                  {/* SKU */}
                  <span className="text-[10px] text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded-md leading-tight inline-block">
                    {item.sku || '—'}
                  </span>

                  {/* Product */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
                      <Package size={13} className="text-gray-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-800 truncate">{item.productName || '—'}</p>
                      <p className="text-[10px] text-gray-400 truncate">{item.productId.slice(0, 8)}…</p>
                    </div>
                  </div>

                  {/* Unit */}
                  <span className="text-xs text-gray-600 font-semibold">{item.unit || '—'}</span>

                  {/* Tồn hiện có */}
                  <div>
                    <span className="text-sm font-bold text-gray-800">{Number(item.currentQuantity ?? 0).toLocaleString()}</span>
                    <span className="text-[10px] text-gray-400 ml-1">sp</span>
                  </div>

                  {/* SL yêu cầu — editable */}
                  <input
                    type="number"
                    min={1}
                    value={item.requestedQuantity}
                    onChange={e => updateItem(item.productId, 'requestedQuantity', Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-800 text-center focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition-all bg-white hover:border-gray-300"
                  />

                  {/* Reason */}
                  <input
                    value={item.reason}
                    onChange={(e) => updateItem(item.productId, 'reason', e.target.value)}
                    placeholder="Nhập lý do (tuỳ chọn)"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition-all bg-white hover:border-gray-300"
                  />

                  {/* Remove */}
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all flex items-center justify-center w-7 h-7 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            {/* Table footer */}
            <div className="bg-gray-50 border-t border-gray-200 px-5 py-3 flex items-center justify-between">
              <p className="text-[10px] text-gray-400 italic">
                {inventoryLoading ? 'Đang tải tồn hiện có...' : 'Tồn hiện có lấy theo tồn kho tại vị trí được cấu hình.'}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Tổng mặt hàng:</span>
                <span className="text-sm font-bold text-gray-800">
                  {String(items.length).padStart(2, '0')}
                  <span className="text-gray-400 font-normal text-xs ml-1">sản phẩm</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer Actions ── */}
        <div className="px-8 py-4 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between rounded-b-2xl flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-gray-400 font-bold tracking-widest uppercase">System Status: Online</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-700 border border-gray-200 hover:border-gray-300 rounded-xl transition-all bg-white"
            >
              Huỷ bỏ
            </button>
            <button
              onClick={submit}
              disabled={submitting}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <ArrowRight size={15} />
              {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </button>
          </div>
        </div>
        {submitError && (
          <div className="px-8 pb-6">
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReplenishmentPage() {
  const { token, user } = useAuthStore()
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const pushToast = (t: Omit<ToastItem, 'id' | 'onClose'>) => {
    setToasts((prev) => [{ ...t, id: `${Date.now()}-${Math.random()}`, onClose: () => {} }, ...prev].slice(0, 3))
  }
  const removeToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id))

  const [activeTab, setActiveTab] = useState<UiStatus>('Tất cả')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [page, setPage] = useState(1)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [requests, setRequests] = useState<RestockRequestFromAPI[]>([])
  const [warehouseName, setWarehouseName] = useState<string>('')
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [detailRequest, setDetailRequest] = useState<RestockRequestFromAPI | null>(null)

  const [receiveOpen, setReceiveOpen] = useState(false)
  const [receiveRequest, setReceiveRequest] = useState<RestockRequestFromAPI | null>(null)
  const [receiveItems, setReceiveItems] = useState<ReceiveItemForm[]>([])
  const [receiveNotes, setReceiveNotes] = useState('')
  const [receiveSubmitting, setReceiveSubmitting] = useState(false)
  const [receiveError, setReceiveError] = useState<string | null>(null)
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([])
  const [suppliersLoading, setSuppliersLoading] = useState(false)
  const [productNameMap, setProductNameMap] = useState<Record<string, string>>({})

  const warehouseId = String(user?.warehouseId ?? user?.workplaceId ?? '').trim()

  const reload = useMemo(() => {
    return async () => {
      if (!token) return
      if (!warehouseId) {
        setRequests([])
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const [reqs, wh] = await Promise.all([
          RestockAPIService.getByWarehouse(warehouseId),
          WarehouseAPIService.getById(warehouseId).catch(() => null),
        ])
        setRequests(Array.isArray(reqs) ? reqs : [])
        setWarehouseName(String(wh?.name ?? ''))
      } catch {
        setError('Không thể tải danh sách phiếu. Vui lòng thử lại.')
        setRequests([])
      } finally {
        setLoading(false)
      }
    }
  }, [token, warehouseId])

  useEffect(() => {
    reload()
  }, [reload])

  useEffect(() => {
    let cancelled = false
    ReplenishmentProductAPIService.getAllProducts()
      .then((list) => {
        if (cancelled) return
        const map: Record<string, string> = {}
        for (const p of Array.isArray(list) ? list : []) {
          const id = String((p as any)?.id || '').trim()
          const name = String((p as any)?.name || '').trim()
          if (id && name) map[id] = name
        }
        setProductNameMap(map)
      })
      .catch(() => {
        if (!cancelled) setProductNameMap({})
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setSuppliersLoading(true)
    supplierService
      .getSuppliers()
      .then((list) => {
        if (cancelled) return
        const normalized = (Array.isArray(list) ? list : [])
          .filter((s) => !s.isDeleted && String(s.status || '').toUpperCase() === 'ACTIVE')
          .map((s) => ({ id: String(s.id), name: String(s.name) }))
        setSuppliers(normalized)
      })
      .catch(() => {
        if (!cancelled) setSuppliers([])
      })
      .finally(() => {
        if (!cancelled) setSuppliersLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return requests.filter((r) => {
      const uiStatus = statusFromApiToUi(r.status)
      if (activeTab !== 'Tất cả' && uiStatus !== activeTab) return false
      if (!q) return true
      const code = String(r.requestNumber || r.id).toLowerCase()
      return code.includes(q)
    })
  }, [requests, search, activeTab])

  useEffect(() => {
    setPage(1)
  }, [activeTab, search])

  const openDetail = async (id: string) => {
    if (!id) return
    setDetailOpen(true)
    setDetailLoading(true)
    setDetailError(null)
    try {
      const detail = await RestockAPIService.getById(id)
      if (!detail) {
        setDetailRequest(null)
        setDetailError('Không tìm thấy chi tiết phiếu yêu cầu.')
        return
      }
      setDetailRequest(detail)
    } catch {
      setDetailRequest(null)
      setDetailError('Không thể tải chi tiết phiếu yêu cầu.')
    } finally {
      setDetailLoading(false)
    }
  }

  const toDateInput = (d: Date) => d.toISOString().slice(0, 10)

  const openReceiveModal = async (req: RestockRequestFromAPI) => {
    const lines = Array.isArray(req.items) ? req.items : []
    if (lines.length === 0) {
      pushToast({ type: 'error', message: 'Phiếu không có dòng sản phẩm để nhận hàng.' })
      return
    }

    const now = new Date()
    const oneYear = new Date(now)
    oneYear.setFullYear(oneYear.getFullYear() + 1)

    setReceiveRequest(req)
    const initialRows: ReceiveItemForm[] = lines.map((it) => {
      const pid = String(it.productId || '').trim()
      const fromReq = String(it.productName || '').trim()
      const fromMap = productNameMap[pid] || ''
      const displayName = fromReq && !looksLikeUuid(fromReq) ? fromReq : fromMap

      return {
        productId: pid,
        productName: displayName,
        quantity: Math.max(1, Number(it.approvedQuantity ?? it.requestedQuantity ?? 1)),
        batchNumber: '',
        unitPrice: 0,
        supplierName: '',
        supplierId: '',
        manufacturingDate: toDateInput(now),
        expiryDate: toDateInput(oneYear),
      }
    })

    setReceiveItems(initialRows)
    setReceiveNotes('')
    setReceiveError(null)
    setReceiveOpen(true)

    try {
      const ids = initialRows.map((x) => x.productId).filter(Boolean)
      if (ids.length === 0) return
      const detailMap = await ReplenishmentProductAPIService.detailsBatch(ids)
      
      // Map product supplier ID to supplier name
      const supplierMap: Record<string, { id: string; name: string }> = {}
      for (const supplier of suppliers) {
        supplierMap[supplier.id] = { id: supplier.id, name: supplier.name }
      }
      
      setReceiveItems((prev) =>
        prev.map((row) => {
          const detail = detailMap[row.productId]
          const nameFromApi = String(detail?.name || '').trim()
          const existing = String(row.productName || '').trim()
          const nameFromMap = String(productNameMap[row.productId] || '').trim()
          const shouldReplace = !existing || existing === row.productId || looksLikeUuid(existing)
          
          // Get supplier from product details
          const productSupplierId = String(detail?.supplierId || '').trim()
          const supplierInfo = productSupplierId && supplierMap[productSupplierId] 
            ? supplierMap[productSupplierId] 
            : (row.supplierId ? supplierMap[row.supplierId] : null)
          
          return {
            ...row,
            productName: shouldReplace ? (nameFromApi || nameFromMap || row.productId) : existing,
            supplierId: productSupplierId || row.supplierId,
            supplierName: supplierInfo?.name || row.supplierName,
          }
        })
      )

      const unresolved = initialRows
        .map((x) => x.productId)
        .filter((pid) => {
          const d = String(detailMap?.[pid]?.name || '').trim()
          return !d
        })

      if (unresolved.length > 0) {
        const fetched = await Promise.all(
          unresolved.map(async (pid) => {
            const p = await ReplenishmentProductAPIService.getProductById(pid).catch(() => null)
            return { id: pid, name: String(p?.name || '').trim(), supplierId: String(p?.supplierId || '').trim() }
          })
        )

        const fallbackMap: Record<string, string> = {}
        const fallbackSupplierMap: Record<string, { id: string; name: string }> = {}
        for (const f of fetched) {
          if (f.id && f.name) fallbackMap[f.id] = f.name
          if (f.id && f.supplierId && supplierMap[f.supplierId]) {
            fallbackSupplierMap[f.id] = supplierMap[f.supplierId]
          }
        }

        if (Object.keys(fallbackMap).length > 0 || Object.keys(fallbackSupplierMap).length > 0) {
          setReceiveItems((prev) =>
            prev.map((row) => {
              const existing = String(row.productName || '').trim()
              const shouldReplace = !existing || existing === row.productId || looksLikeUuid(existing)
              const supplierInfo = fallbackSupplierMap[row.productId]
              return {
                ...row,
                productName: shouldReplace ? (fallbackMap[row.productId] || row.productName || row.productId) : row.productName,
                supplierId: supplierInfo?.id || row.supplierId,
                supplierName: supplierInfo?.name || row.supplierName,
              }
            })
          )
        }
      }
    } catch {
      // Keep existing labels when details API fails.
    }
  }

  const updateReceiveItem = (idx: number, field: keyof ReceiveItemForm, value: string | number) => {
    setReceiveItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value as any } : it)))
  }

  const updateReceiveItemSupplier = (idx: number, supplierId: string) => {
    const selected = suppliers.find((s) => s.id === supplierId)
    setReceiveItems((prev) =>
      prev.map((it, i) =>
        i === idx
          ? {
              ...it,
              supplierId: supplierId,
              supplierName: selected?.name || '',
            }
          : it
      )
    )
  }

  useEffect(() => {
    if (!receiveOpen) return
    if (suppliers.length === 0) return
    const defaultSupplier = suppliers[0]
    setReceiveItems((prev) =>
      prev.map((it) =>
        it.supplierId
          ? it
          : {
              ...it,
              supplierId: defaultSupplier.id,
              supplierName: defaultSupplier.name,
            }
      )
    )
  }, [receiveOpen, suppliers])

  const submitReceive = async () => {
    if (!receiveRequest) return
    if (!warehouseId) {
      setReceiveError('Thiếu warehouseId để nhận hàng.')
      return
    }
    if (receiveItems.length === 0) {
      setReceiveError('Không có dòng sản phẩm để nhận.')
      return
    }

    for (const it of receiveItems) {
      if (!it.productId) return setReceiveError('Thiếu productId ở một dòng sản phẩm.')
      if (!it.batchNumber.trim()) return setReceiveError(`Thiếu batchNumber cho sản phẩm ${it.productName}.`)
      if (!it.supplierName.trim()) return setReceiveError(`Thiếu supplierName cho sản phẩm ${it.productName}.`)
      if (!it.supplierId.trim()) return setReceiveError(`Thiếu supplierId cho sản phẩm ${it.productName}.`)
      if (!Number.isFinite(it.quantity) || it.quantity <= 0) return setReceiveError(`Số lượng nhận của ${it.productName} phải > 0.`)
      if (!it.manufacturingDate || !it.expiryDate) return setReceiveError(`Thiếu ngày NSX/HSD cho sản phẩm ${it.productName}.`)
    }

    const restockRequestId = String(receiveRequest.id || '').trim()
    const normalizedWarehouseId = String(warehouseId || '').trim()

    const rawReceivedBy = String(user?.id || '').trim()
    const receivedBy = looksLikeUuid(rawReceivedBy) ? rawReceivedBy : DEFAULT_RECEIVED_BY

    if (!looksLikeUuid(restockRequestId)) {
      setReceiveError('restockRequestId không hợp lệ (phải là UUID).')
      return
    }
    if (!looksLikeUuid(normalizedWarehouseId)) {
      setReceiveError('warehouseId không hợp lệ (phải là UUID).')
      return
    }
    if (!looksLikeUuid(receivedBy)) {
      setReceiveError('receivedBy không hợp lệ (phải là UUID).')
      return
    }

    const payload = {
      restockRequestId,
      warehouseId: normalizedWarehouseId,
      receivedBy,
      notes: receiveNotes.trim() || 'Nhận hàng từ nhà cung cấp',
      items: receiveItems.map((it) => ({
        productId: it.productId,
        quantity: Number(it.quantity),
        batchNumber: it.batchNumber.trim(),
        unitPrice: Number(it.unitPrice),
        supplierName: it.supplierName.trim(),
        supplierId: it.supplierId.trim(),
        manufacturingDate: new Date(`${it.manufacturingDate}T00:00:00.000Z`).toISOString(),
        expiryDate: new Date(`${it.expiryDate}T00:00:00.000Z`).toISOString(),
      })),
    }

    setReceiveSubmitting(true)
    setReceiveError(null)
    try {
      await localApiClient.post('/product-batch/receive-from-supplier', payload)
      pushToast({ type: 'success', message: 'Nhận hàng thành công.' })
      setReceiveOpen(false)
      await reload()
    } catch (e: any) {
      setReceiveError(extractApiErrorMessage(e))
    } finally {
      setReceiveSubmitting(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const paged = useMemo(() => {
    return filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  }, [filtered, safePage])

  const tabCount = (tab: UiStatus) =>
    tab === 'Tất cả' ? requests.length : requests.filter((r) => statusFromApiToUi(r.status) === tab).length

  return (
    <div className="min-h-screen bg-gray-50/80 p-6">
      {toasts.length > 0 && <ToastContainer toasts={toasts} onRemove={removeToast} />}

      {showModal && (
        <CreateRequestModal
          fromWarehouseId={warehouseId}
          fromWarehouseName={warehouseName || warehouseId}
          inventoryLocationType="Warehouse"
          inventoryLocationId={warehouseId}
          onClose={() => setShowModal(false)}
          onCreated={() => {
            pushToast({ type: 'success', message: 'Tạo phiếu yêu cầu nhập hàng thành công!' })
            reload()
          }}
        />
      )}

      {detailOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm p-4 flex items-center justify-center" onClick={() => setDetailOpen(false)}>
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Chi tiết yêu cầu nhập hàng</h3>
                <p className="text-xs text-gray-400 mt-1">
                  {detailRequest?.requestNumber || detailRequest?.id || '—'}
                </p>
              </div>
              <button
                onClick={() => setDetailOpen(false)}
                className="text-gray-300 hover:text-gray-500 transition-colors p-1 rounded-lg hover:bg-gray-100"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {detailLoading ? (
                <div className="py-10 text-center text-sm text-gray-400">Đang tải chi tiết...</div>
              ) : detailError ? (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{detailError}</div>
              ) : detailRequest ? (
                <>
                  {statusFromApiToUi(detailRequest.status) === 'Đã từ chối' && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                      <p className="text-[10px] text-red-500 uppercase tracking-wider font-bold">Lý do từ chối</p>
                      <p className="text-sm text-red-700 mt-1">{extractRejectReason(detailRequest) || 'Không có lý do từ chối.'}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Trạng thái</p>
                      <p className="text-sm font-semibold text-gray-800 mt-1">{statusFromApiToUi(detailRequest.status)}</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Ưu tiên</p>
                      <p className="text-sm font-semibold text-gray-800 mt-1">{toUiPriority(detailRequest.priority)}</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Ngày tạo</p>
                      <p className="text-sm font-semibold text-gray-800 mt-1">{formatDateVI(detailRequest.requestedDate)}</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Tổng SL</p>
                      <p className="text-sm font-semibold text-gray-800 mt-1">{sumRequestedQty(detailRequest).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 border-b border-gray-200 grid grid-cols-[1fr_100px_120px_1fr] gap-2 px-4 py-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sản phẩm</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">SL YC</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tồn hiện có</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Lý do</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {(Array.isArray(detailRequest.items) ? detailRequest.items : []).length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-gray-400">Không có dòng sản phẩm</div>
                      ) : (
                        (detailRequest.items || []).map((it) => (
                          <div key={it.id} className="grid grid-cols-[1fr_100px_120px_1fr] gap-2 px-4 py-3 items-center">
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{it.productName || it.productId}</p>
                              <p className="text-[11px] text-gray-400">{it.unit || '—'}</p>
                            </div>
                            <p className="text-sm font-bold text-gray-800">{Number(it.requestedQuantity || 0).toLocaleString()}</p>
                            <p className="text-sm text-gray-600">{Number(it.currentQuantity || 0).toLocaleString()}</p>
                            <p className="text-sm text-gray-600">{it.reason || '—'}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {receiveOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm p-4 flex items-center justify-center" onClick={() => setReceiveOpen(false)}>
          <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Nhận hàng từ nhà cung cấp</h3>
                <p className="text-xs text-gray-400 mt-1">Phiếu: {receiveRequest?.requestNumber || receiveRequest?.id || '—'}</p>
              </div>
              <button
                onClick={() => setReceiveOpen(false)}
                className="text-gray-300 hover:text-gray-500 transition-colors p-1 rounded-lg hover:bg-gray-100"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Ghi chú nhận hàng</label>
                <input
                  value={receiveNotes}
                  onChange={(e) => setReceiveNotes(e.target.value)}
                  placeholder="Nhập ghi chú nhận hàng..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>

              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <div className="min-w-[1060px] bg-gray-50 border-b border-gray-200 grid grid-cols-[minmax(300px,1.4fr)_90px_110px_220px_140px_140px] gap-2 px-4 py-2">
                    {['Sản phẩm', 'SL nhận', 'Batch', 'Nhà cung cấp', 'NSX', 'HSD'].map((h) => (
                      <span key={h} className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{h}</span>
                    ))}
                  </div>
                  <div className="min-w-[1060px] divide-y divide-gray-100">
                    {receiveItems.map((it, idx) => (
                      <div key={`${it.productId}-${idx}`} className="grid grid-cols-[minmax(300px,1.4fr)_90px_110px_220px_140px_140px] gap-2 px-4 py-3 items-center">
                      <div>
                        <p className="text-sm font-semibold text-gray-800 truncate">{it.productName || 'Sản phẩm'}</p>
                        <p className="text-[11px] text-gray-400 truncate">{shortId(it.productId)}</p>
                      </div>
                      <input
                        type="number"
                        min={1}
                        value={it.quantity}
                        onChange={(e) => updateReceiveItem(idx, 'quantity', Number(e.target.value))}
                        className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm text-center"
                      />
                      <input
                        value={it.batchNumber}
                        onChange={(e) => updateReceiveItem(idx, 'batchNumber', e.target.value)}
                        placeholder="VD: 12345"
                        className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs"
                      />
                      <div className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs bg-gray-50 flex items-center">
                        <span className="text-gray-700 font-medium">{it.supplierName || '—'}</span>
                      </div>
                      <input
                        type="date"
                        value={it.manufacturingDate}
                        onChange={(e) => updateReceiveItem(idx, 'manufacturingDate', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs min-w-[130px]"
                      />
                      <input
                        type="date"
                        value={it.expiryDate}
                        onChange={(e) => updateReceiveItem(idx, 'expiryDate', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs min-w-[130px]"
                      />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {receiveError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{receiveError}</div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
              <button
                onClick={() => setReceiveOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 bg-white rounded-xl hover:bg-gray-50"
              >
                Đóng
              </button>
              <button
                onClick={submitReceive}
                disabled={receiveSubmitting}
                className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {receiveSubmitting ? 'Đang nhận...' : 'Xác nhận nhận hàng'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-5">

        {/* Page Header */}
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <p className="text-[11px] text-blue-600 font-bold uppercase tracking-widest">
                {warehouseName || (warehouseId ? 'Kho tổng' : 'Chưa gán kho')}
              </p>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Yêu cầu nhập hàng</h1>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowModal(true)}
              disabled={user?.roleId !== 7 || !warehouseId}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/20"
            >
              <Plus size={15} />
              Tạo yêu cầu nhập hàng
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
          <div className="flex items-end gap-5">
            <div className="w-64 flex-shrink-0">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Tìm kiếm
              </label>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Tìm theo mã phiếu..."
                  className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 placeholder:text-gray-300 transition-all"
                />
              </div>
            </div>

            <div className="w-px h-8 bg-gray-100 flex-shrink-0" />

            <div className="flex-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Trạng thái yêu cầu
              </p>
              <div className="flex items-center gap-1">
                {TABS.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === tab
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {tab}
                    <span className={`text-[10px] rounded-full px-1.5 py-0.5 font-bold leading-none ${
                      activeTab === tab ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {tabCount(tab)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {user?.roleId !== 7 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
            Bạn không có quyền tạo/xem phiếu ở màn này. (Yêu cầu roleId = 7)
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-[#0f1f3d]">
            <div className="grid grid-cols-[140px_140px_120px_140px_120px_140px_180px] gap-2 px-6 py-3.5">
              {[
                'Mã phiếu', 'Ngày tạo', 'Số mặt hàng', 'Tổng SL yêu cầu', 'Ưu tiên', 'Trạng thái', 'Thao tác',
              ].map(h => (
                <span key={h} className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-tight">{h}</span>
              ))}
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="grid grid-cols-[140px_140px_120px_140px_120px_140px_180px] gap-2 px-6 py-4 items-center">
                  {Array.from({ length: 7 }).map((__, j) => (
                    <div key={j} className="h-4 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <Package size={32} className="mx-auto text-gray-200 mb-3" />
                <p className="text-gray-400 text-sm font-medium">Không tìm thấy kết quả</p>
              </div>
            ) : paged.map((r) => {
              const uiStatus = statusFromApiToUi(r.status)
              const pr = toUiPriority(r.priority)
              const totalItems = Array.isArray(r.items) ? r.items.length : 0
              const totalQty = sumRequestedQty(r)
              const code = String(r.requestNumber || r.id)
              return (
              <div
                key={r.id}
                className="grid grid-cols-[140px_140px_120px_140px_120px_140px_180px] gap-2 px-6 py-4 items-center hover:bg-blue-50/20 transition-colors"
              >
                <span className="text-[11px] font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">{code}</span>
                <span className="text-sm text-gray-500 whitespace-nowrap">{formatDateVI(r.requestedDate)}</span>
                <span className="text-sm font-bold text-gray-900">{totalItems}</span>
                <span className="text-sm font-bold text-gray-900">{totalQty.toLocaleString()}</span>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${priorityDotClass(pr)}`} />
                  <span className={`text-xs ${priorityTextClass(pr)}`}>{pr}</span>
                </div>
                <span className={`text-[11px] font-semibold px-2 py-1 rounded-lg inline-flex items-center ${statusBadgeClass(uiStatus)}`}>
                  {uiStatus}
                </span>
                <div className="flex items-center gap-2">
                  {(uiStatus === 'Đã duyệt' || uiStatus === 'Đang xử lý') && (
                    <button
                      onClick={() => openReceiveModal(r)}
                      className="px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                      title="Nhận hàng"
                    >
                      Nhận hàng
                    </button>
                  )}
                  <button
                    onClick={() => openDetail(String(r.id))}
                    className="flex items-center justify-center text-gray-300 hover:text-blue-500 transition-colors w-8 h-8 rounded-lg hover:bg-blue-50"
                    title="Xem chi tiết"
                  >
                    <Eye size={15} />
                  </button>
                </div>
              </div>
            )})}
          </div>

          <div className="px-6 py-3.5 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <p className="text-xs text-gray-400">
              Hiển thị{' '}
              <span className="font-bold text-gray-600">
                {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}-
                {Math.min(safePage * PAGE_SIZE, filtered.length)}
              </span>{' '}
              của <span className="font-bold text-gray-600">{filtered.length}</span> phiếu
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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