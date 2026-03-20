'use client'

import { useState, useEffect, useRef } from 'react'
import {
  X,
  Plus,
  Trash2,
  Search,
  Package,
  Warehouse,
  AlertCircle,
  Loader2,
  ChevronDown,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import type { User } from '@/shared/types'
import { RestockAPIService, CreateRestockRequestDTO } from '@/services/restock-api.service'
import { InventoryAPIService } from '@/services/inventory-api.service'

// ─── Types ────────────────────────────────────────────────────────────────────
interface WarehouseOption {
  id: string
  name: string
  location?: string
  parentId?: string | null
  parent_id?: string | null
}

interface ProductOption {
  id: string
  sku: string
  name: string
  unit: string
  categoryName?: string
}

type InventoryLoadStatus = 'loading' | 'ready' | 'error'

interface FormItem {
  productId: string
  productName: string
  productSku: string
  productUnit: string
  requestedQuantity: number
  /** SL hiện có tại cửa hàng (STORE + storeLocationId), lấy từ API */
  currentQuantity: number
  reason: string
  inventoryStatus: InventoryLoadStatus
  inventoryError?: string
}

function normalizeId(value?: string | null): string {
  return String(value || '').trim().toLowerCase()
}

/** Khớp BE: storeLocationId hoặc workplaceId/storeId đã gán cho store manager */
function getStoreLocationId(user: User | null | undefined): string {
  if (!user) return ''
  const u = user as User & { store_location_id?: string }
  const raw =
    u.storeLocationId ??
    u.store_location_id ??
    u.workplaceId ??
    u.storeId ??
    ''
  return String(raw).trim()
}

const PRIORITY_OPTIONS = [
  { value: 'NORMAL', label: 'Bình thường', cls: 'text-gray-700' },
  { value: 'HIGH',   label: 'Cao',          cls: 'text-amber-600' },
  { value: 'URGENT', label: 'Khẩn cấp',    cls: 'text-red-600' },
]

const REASON_SUGGESTIONS = ['Hết hàng', 'Sắp hết', 'Bổ sung định kỳ', 'Tăng nhu cầu']

// ─── Product search dropdown ──────────────────────────────────────────────────
function ProductSearchInput({
  products,
  onSelect,
  loading,
}: {
  products: ProductOption[]
  onSelect: (p: ProductOption) => void
  loading: boolean
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.sku.toLowerCase().includes(query.toLowerCase()),
  )

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSelect(p: ProductOption) {
    onSelect(p)
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          placeholder="Tìm theo tên hoặc SKU sản phẩm..."
          className="w-full pl-8 pr-3 py-2 text-[13px] border border-gray-200 rounded-lg outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 bg-gray-50 focus:bg-white transition-all"
        />
        {loading && <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />}
      </div>
      {open && (
        <div className="absolute z-20 top-full mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-lg max-h-52 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="py-3 px-4 text-[12px] text-gray-400 text-center">Không tìm thấy sản phẩm</p>
          ) : (
            filtered.slice(0, 30).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelect(p)}
                className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-emerald-50 transition-colors text-left"
              >
                <Package size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[13px] font-medium text-gray-800">{p.name}</p>
                  <p className="text-[11px] text-gray-400">{p.sku} · {p.unit}{p.categoryName ? ` · ${p.categoryName}` : ''}</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main form modal ──────────────────────────────────────────────────────────
interface CreateFormProps {
  onClose: () => void
  onCreated: () => void
}

export default function CreateRestockRequestForm({ onClose, onCreated }: CreateFormProps) {
  const user = useAuthStore((s) => s.user)

  // Form state
  const [fromWarehouseId, setFromWarehouseId] = useState('')
  const [priority, setPriority]               = useState<'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL')
  const [notes, setNotes]                     = useState('')
  const [items, setItems]                     = useState<FormItem[]>([])

  // Data loading
  const [allLocations, setAllLocations] = useState<WarehouseOption[]>([])
  const [products, setProducts]       = useState<ProductOption[]>([])
  const [loadingWH, setLoadingWH]     = useState(false)
  const [loadingProd, setLoadingProd] = useState(false)

  // Submit
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)

  // Store manager location can come from workplaceId or storeId depending on login payload.
  const toWarehouseId = user?.workplaceId ?? user?.storeId ?? user?.warehouseId ?? ''
  const toWarehouseKey = normalizeId(toWarehouseId)

  // Resolved display name for the destination store
  const toLocationName = allLocations.find(
    (w) => normalizeId(w.id) === toWarehouseKey,
  )?.name ?? null

  // Source warehouse is the parent warehouse managed for current store.
  const fromWarehouseResolved = allLocations.find(
    (w) => normalizeId(w.id) === toWarehouseKey,
  )
  const resolvedFromWarehouseId =
    fromWarehouseResolved?.parentId ??
    fromWarehouseResolved?.parent_id ??
    ''
  const fromWarehouseName = allLocations.find(
    (w) => normalizeId(w.id) === normalizeId(resolvedFromWarehouseId),
  )?.name ?? null

  useEffect(() => {
    setFromWarehouseId(resolvedFromWarehouseId)
  }, [resolvedFromWarehouseId])

  // Load warehouses / locations
  useEffect(() => {
    setLoadingWH(true)
    fetch('/api/warehouses', {
      headers: { Authorization: `Bearer ${useAuthStore.getState().token ?? ''}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const list: WarehouseOption[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : []
        setAllLocations(list)
      })
      .catch(() => setAllLocations([]))
      .finally(() => setLoadingWH(false))
  }, [toWarehouseId])

  // Load products
  useEffect(() => {
    setLoadingProd(true)
    fetch('/api/products', {
      headers: { Authorization: `Bearer ${useAuthStore.getState().token ?? ''}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const list: ProductOption[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : []
        setProducts(
          list.map((p: any) => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            unit: p.unit ?? 'cái',
            categoryName: p.categoryName,
          })),
        )
      })
      .catch(() => setProducts([]))
      .finally(() => setLoadingProd(false))
  }, [])

  // ── Item helpers ─────────────────────────────────────────────
  function addProduct(p: ProductOption) {
    // Prevent duplicate
    if (items.some((i) => i.productId === p.id)) return

    const storeLocationId = getStoreLocationId(user)

    setItems((prev) => [
      ...prev,
      {
        productId: p.id,
        productName: p.name,
        productSku: p.sku,
        productUnit: p.unit,
        requestedQuantity: 1,
        currentQuantity: 0,
        reason: '',
        inventoryStatus: 'loading',
      },
    ])

    if (!storeLocationId) {
      setItems((prev) =>
        prev.map((i) =>
          i.productId === p.id
            ? {
                ...i,
                inventoryStatus: 'error',
                inventoryError: 'Chưa xác định được cửa hàng (storeLocationId / workplaceId).',
                currentQuantity: 0,
              }
            : i,
        ),
      )
      return
    }

    void (async () => {
      try {
        const rows = await InventoryAPIService.getInventoryByProduct(p.id)
        const match = rows.find(
          (row) =>
            String(row.locationType).toUpperCase() === 'STORE' &&
            normalizeId(row.locationId) === normalizeId(storeLocationId),
        )
        const qty = match != null ? Number(match.availableQuantity) || 0 : 0
        setItems((prev) =>
          prev.map((i) =>
            i.productId === p.id
              ? {
                  ...i,
                  currentQuantity: qty,
                  inventoryStatus: 'ready',
                  inventoryError: undefined,
                }
              : i,
          ),
        )
      } catch (err: unknown) {
        const msg =
          (err as any)?.response?.data?.message ||
          (err as any)?.response?.data?.error ||
          (err instanceof Error ? err.message : null) ||
          'Không tải được tồn kho'
        setItems((prev) =>
          prev.map((i) =>
            i.productId === p.id
              ? {
                  ...i,
                  currentQuantity: 0,
                  inventoryStatus: 'error',
                  inventoryError: typeof msg === 'string' ? msg : 'Lỗi tải tồn kho',
                }
              : i,
          ),
        )
      }
    })()
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateItem<K extends keyof FormItem>(idx: number, key: K, value: FormItem[K]) {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [key]: value } : item)))
  }

  // ── Submit ────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!fromWarehouseId) { setError('Không xác định được kho nguồn quản lý cho cửa hàng này.'); return }
    if (!toWarehouseId)   { setError('Không xác định được kho đích (chưa gán kho cho tài khoản).'); return }
    if (items.length === 0) { setError('Vui lòng thêm ít nhất 1 sản phẩm.'); return }
    for (const item of items) {
      if (item.requestedQuantity <= 0) { setError(`Số lượng yêu cầu cho "${item.productName}" phải lớn hơn 0.`); return }
    }

    const dto: CreateRestockRequestDTO = {
      fromWarehouseId: toWarehouseId,  // Store (where request comes FROM)
      fromLocationType: 'STORE',
      toWarehouseId: fromWarehouseId,  // Warehouse (where request goes TO)
      toLocationType: 'WAREHOUSE',
      priority,
      notes: notes.trim() || undefined,
      items: items.map((i) => ({
        productId:         i.productId,
        requestedQuantity: i.requestedQuantity,
        currentQuantity:   i.currentQuantity,
        reason:            i.reason.trim() || undefined,
      })),
    }

    try {
      setSubmitting(true)
      await RestockAPIService.create(dto)
      onCreated()
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Tạo yêu cầu thất bại. Vui lòng thử lại.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Package size={16} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-gray-900">Tạo yêu cầu nhập hàng</h2>
              <p className="text-[11px] text-gray-400">Điền đầy đủ thông tin để gửi yêu cầu</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

            {/* Section: Thông tin chung */}
            <section>
              <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Thông tin chung
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                {/* Kho nguồn (auto theo cửa hàng đang đăng nhập) */}
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 mb-1">
                    Kho nguồn <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Warehouse size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      readOnly
                      value={
                        loadingWH
                          ? 'Đang tải...'
                          : fromWarehouseName
                          ? fromWarehouseName
                          : fromWarehouseId
                          ? fromWarehouseId
                          : '(không xác định kho nguồn)'
                      }
                      className="w-full pl-8 pr-3 py-2 text-[13px] border border-gray-100 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed font-medium truncate"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">Tự động theo kho tổng quản lý cửa hàng hiện tại</p>
                </div>

                {/* Kho đích (auto) */}
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 mb-1">
                    cửa hàng
                  </label>
                  <div className="relative">
                    <Warehouse size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                    <input
                      readOnly
                      value={
                        loadingWH
                          ? 'Đang tải...'
                          : toLocationName
                          ? toLocationName
                          : toWarehouseId
                          ? toWarehouseId
                          : '(chưa gán kho)'
                      }
                      className="w-full pl-8 pr-3 py-2 text-[13px] border border-gray-100 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed font-medium truncate"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">Tự động từ tài khoản đăng nhập (STORE)</p>
                </div>

                {/* Độ ưu tiên */}
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 mb-1">
                    Độ ưu tiên <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    {PRIORITY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setPriority(opt.value as typeof priority)}
                        className={`flex-1 py-2 rounded-lg text-[12px] font-semibold border transition-all ${
                          priority === opt.value
                            ? opt.value === 'URGENT'
                              ? 'bg-red-600 text-white border-red-600'
                              : opt.value === 'HIGH'
                              ? 'bg-amber-500 text-white border-amber-500'
                              : 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ghi chú */}
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 mb-1">Ghi chú</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Ghi chú thêm (không bắt buộc)..."
                    className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 bg-gray-50 focus:bg-white transition-all resize-none"
                  />
                </div>
              </div>
            </section>

            {/* Section: Danh sách sản phẩm */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">
                  Sản phẩm yêu cầu <span className="text-red-500">*</span>
                  {items.length > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold normal-case">
                      {items.length}
                    </span>
                  )}
                </h3>
              </div>

              {/* Product search */}
              <ProductSearchInput
                products={products}
                onSelect={addProduct}
                loading={loadingProd}
              />

              {/* Item list */}
              {items.length > 0 && (
                <div className="mt-3 space-y-3">
                  {items.map((item, idx) => (
                    <div
                      key={item.productId}
                      className="border border-gray-100 rounded-xl p-3.5 bg-gray-50/50 space-y-3"
                    >
                      {/* Product header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[13px] font-semibold text-gray-800">{item.productName}</p>
                          <p className="text-[11px] text-gray-400 font-mono">{item.productSku} · {item.productUnit}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Item fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[11px] font-medium text-gray-500 mb-1">
                            SL yêu cầu <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={item.requestedQuantity}
                            onChange={(e) => updateItem(idx, 'requestedQuantity', Math.max(1, Number(e.target.value)))}
                            className="w-full px-2.5 py-1.5 text-[13px] border border-gray-200 rounded-lg outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 bg-white text-center font-semibold"
                          />
                          {item.inventoryStatus === 'ready' && item.requestedQuantity > item.currentQuantity && (
                            <p className="text-[11px] text-amber-600 font-semibold mt-1">SL vượt tồn kho</p>
                          )}
                        </div>
                        <div className="relative">
                          <label className="block text-[11px] font-medium text-gray-500 mb-1 flex items-center gap-1.5">
                            SL hiện có
                            {item.inventoryStatus === 'loading' && (
                              <Loader2 size={12} className="animate-spin text-emerald-500" aria-hidden />
                            )}
                          </label>
                          <input
                            type="text"
                            readOnly
                            value={
                              item.inventoryStatus === 'loading'
                                ? ''
                                : item.inventoryStatus === 'error'
                                  ? '—'
                                  : String(item.currentQuantity)
                            }
                            placeholder={item.inventoryStatus === 'loading' ? 'Đang tải...' : ''}
                            title={item.inventoryError || 'Tồn kho tại cửa hàng hiện tại'}
                            className="w-full px-2.5 py-1.5 text-[13px] border border-gray-100 rounded-lg bg-gray-100 text-center text-gray-700 cursor-not-allowed"
                          />
                          {item.inventoryStatus === 'error' && item.inventoryError && (
                            <p className="text-[10px] text-red-500 mt-0.5 leading-tight">{item.inventoryError}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-gray-500 mb-1">Lý do</label>
                          <div className="relative">
                            <select
                              value={item.reason}
                              onChange={(e) => updateItem(idx, 'reason', e.target.value)}
                              className="w-full px-2.5 py-1.5 text-[13px] border border-gray-200 rounded-lg outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 bg-white appearance-none pr-6"
                            >
                              <option value="">-- Chọn --</option>
                              {REASON_SUGGESTIONS.map((r) => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {items.length === 0 && (
                <div className="mt-3 flex flex-col items-center justify-center py-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
                  <Package size={28} className="mb-2 opacity-40" />
                  <p className="text-[13px]">Tìm và chọn sản phẩm ở trên để thêm</p>
                </div>
              )}
            </section>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 shrink-0 space-y-3">
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-[12px]">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-[13px] transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[13px] transition-colors disabled:opacity-60 shadow-sm"
              >
                {submitting ? (
                  <><Loader2 size={14} className="animate-spin" /> Đang gửi...</>
                ) : (
                  <><Plus size={14} /> Tạo yêu cầu</>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
