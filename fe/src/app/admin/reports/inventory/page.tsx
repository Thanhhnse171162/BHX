'use client'

import { useMemo, useState, useEffect, useCallback, useRef } from 'react'

// ---------------------------------------------------------------------------
// API Imports — adjust paths to match your project structure
// ---------------------------------------------------------------------------
import { InventoryAPIService, InventoryItem } from '@/services/inventory-api.service'
import { ProductAPIService, ProductFromAPI }                   from '@/services/product-api.service'
import { WarehouseLookupAPIService, InventoryWarehouseFromAPI } from '@/services/warehouse-lookup-api.service'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK'

export interface InventoryReportRow {
  id: string
  productCode: string
  productName: string
  category: string
  storeName: string
  warehouseName: string
  currentStock: number
  minStock: number
  maxStock: number
  inTransit: number
  reserved: number
  available: number
  stockValue: number
  lastRestocked: string
  status: StockStatus
  _raw: InventoryItem
}

interface CreateInventoryForm {
  productId: string
  sku: string
  locationType: 'WAREHOUSE' | 'STORE'
  locationId: string
  quantity: number
  minStockLevel: number
  maxStockLevel: number
  reservedQuantity: number
}

const EMPTY_FORM: CreateInventoryForm = {
  productId: '', sku: '', locationType: 'WAREHOUSE', locationId: '',
  quantity: 0, minStockLevel: 0, maxStockLevel: 0, reservedQuantity: 0,
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function deriveStatus(item: InventoryItem): StockStatus {
  const { quantity: qty, minStockLevel: min, maxStockLevel: max } = item
  if (qty === 0)           return 'OUT_OF_STOCK'
  if (qty < min)           return 'LOW_STOCK'
  if (max > 0 && qty > max) return 'OVERSTOCK'
  return 'IN_STOCK'
}

function mapApiToRow(item: InventoryItem): InventoryReportRow {
  const p         = item.product
  const name      = p?.name        ?? item.productName ?? item.name       ?? '—'
  const sku       = p?.sku         ?? item.sku         ?? item.id
  const category  = p?.categoryName ?? item.categoryName ?? '—'
  const costPrice = p?.costPrice   ?? item.costPrice   ?? p?.price        ?? item.price ?? 0
  return {
    id:            item.id,
    productCode:   sku,
    productName:   name,
    category,
    storeName:     item.locationType === 'STORE'     ? item.locationId : '—',
    warehouseName: item.locationType === 'WAREHOUSE' ? item.locationId : '—',
    currentStock:  item.quantity,
    minStock:      item.minStockLevel,
    maxStock:      item.maxStockLevel,
    inTransit:     0,
    reserved:      item.reservedQuantity,
    available:     item.availableQuantity,
    stockValue:    costPrice * item.quantity,
    lastRestocked: item.lastStockCheck ?? item.updatedAt,
    status:        deriveStatus(item),
    _raw:          item,
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

const STATUS_CFG: Record<StockStatus, { label: string; bg: string; text: string; dot: string; border: string; chip: string }> = {
  IN_STOCK:     { label: 'Còn hàng', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200', chip: 'bg-emerald-600 text-white border-emerald-600' },
  LOW_STOCK:    { label: 'Sắp hết',  bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500',   border: 'border-amber-200',   chip: 'bg-amber-500  text-white border-amber-500'   },
  OUT_OF_STOCK: { label: 'Hết hàng', bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-500',     border: 'border-red-200',     chip: 'bg-red-500    text-white border-red-500'     },
  OVERSTOCK:    { label: 'Tồn cao',  bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500',    border: 'border-blue-200',    chip: 'bg-blue-500   text-white border-blue-500'    },
}

// ---------------------------------------------------------------------------
// Micro UI helpers
// ---------------------------------------------------------------------------

function StockBar({ current, min, max }: { current: number; min: number; max: number }) {
  const pct   = max > 0 ? Math.min((current / max) * 100, 100) : 0
  const color = current === 0 ? 'bg-red-400' : current < min ? 'bg-amber-400' : current > max ? 'bg-blue-400' : 'bg-emerald-400'
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
      <div className={`${color} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function StatusBadge({ status }: { status: StockStatus }) {
  const c = STATUS_CFG[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} flex-shrink-0`} />{c.label}
    </span>
  )
}

function FilterChip({ label, active, count, onClick, color }: { label: string; active: boolean; count?: number; onClick: () => void; color?: string }) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border whitespace-nowrap ${
        active ? (color ?? 'bg-green-600 text-white border-green-600 shadow-sm') : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:shadow-sm'
      }`}>
      {label}
      {count !== undefined && (
        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${active ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>{count}</span>
      )}
    </button>
  )
}

function KpiCard({ icon, label, value, sub, subColor, accent, isLoading }: { icon: string; label: string; value: string; sub: string; subColor?: string; accent: string; isLoading: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{label}</span>
        <span className={`w-9 h-9 rounded-xl ${accent} flex items-center justify-center text-lg`}>{icon}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900 tabular-nums leading-none">
        {isLoading ? <span className="inline-block w-24 h-7 bg-gray-100 rounded animate-pulse" /> : value}
      </div>
      <div className={`text-xs font-medium ${subColor ?? 'text-gray-400'}`}>{sub}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

function PagBtn({ onClick, disabled, active, children }: { onClick: () => void; disabled?: boolean; active?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-all border ${
        active ? 'bg-green-600 text-white border-green-600 shadow-sm'
               : 'border-gray-200 bg-white text-gray-600 hover:bg-green-50 hover:border-green-300 hover:text-green-700 disabled:opacity-30 disabled:cursor-not-allowed'
      }`}>
      {children}
    </button>
  )
}

function Pagination({ page, totalPages, pageSize, total, onPage, onPageSize }: {
  page: number; totalPages: number; pageSize: number; total: number
  onPage: (p: number) => void; onPageSize: (s: number) => void
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to   = Math.min(page * pageSize, total)
  const pages: (number | '...')[] = []
  if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i) }
  else {
    pages.push(1)
    if (page > 3) pages.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push('...')
    pages.push(totalPages)
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span>Hiển thị</span>
        <select value={pageSize} onChange={(e) => { onPageSize(Number(e.target.value)); onPage(1) }}
          className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
          {PAGE_SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <span>/ trang · <strong className="text-gray-700">{from}–{to}</strong> trong <strong className="text-gray-700">{total}</strong> kết quả</span>
      </div>
      <div className="flex items-center gap-1">
        <PagBtn onClick={() => onPage(page - 1)} disabled={page === 1}>‹</PagBtn>
        {pages.map((p, i) =>
          p === '...'
            ? <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-gray-400">…</span>
            : <PagBtn key={p} onClick={() => onPage(p as number)} active={page === p}>{p}</PagBtn>
        )}
        <PagBtn onClick={() => onPage(page + 1)} disabled={page === totalPages || totalPages === 0}>›</PagBtn>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Form field helpers
// ---------------------------------------------------------------------------

const inputCls = 'w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white disabled:bg-gray-50 disabled:text-gray-400'

function FormLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function FieldError({ msg }: { msg?: string }) {
  return msg ? <p className="text-[11px] text-red-500 mt-1 font-medium flex items-center gap-1"><span>⚠</span>{msg}</p> : null
}

// ---------------------------------------------------------------------------
// Create / Edit Modal
// ---------------------------------------------------------------------------

interface ModalProps {
  open:       boolean
  onClose:    () => void
  onSuccess:  () => void
  editRow?:   InventoryReportRow | null
}

function InventoryFormModal({ open, onClose, onSuccess, editRow }: ModalProps) {
  const [form, setForm]     = useState<CreateInventoryForm>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof CreateInventoryForm, string>>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // --- Remote data for dropdowns ---
  const [products,    setProducts]    = useState<ProductFromAPI[]>([])
  const [warehouses,  setWarehouses]  = useState<InventoryWarehouseFromAPI[]>([])
  const [loadingProd, setLoadingProd] = useState(false)
  const [loadingLoc,  setLoadingLoc]  = useState(false)

  const overlayRef = useRef<HTMLDivElement>(null)
  const isEdit = !!editRow

  // --- Load products once on open ---
  useEffect(() => {
    if (!open) return
    setLoadingProd(true)
    ProductAPIService.getAllProducts()
      .then(setProducts)
      .catch((e) => console.error('Load products failed', e))
      .finally(() => setLoadingProd(false))
  }, [open])

  // --- Load warehouses when WAREHOUSE tab is active ---
  useEffect(() => {
    if (!open || form.locationType !== 'WAREHOUSE') return
    setLoadingLoc(true)
    // WarehouseLookupAPIService.getAllWarehouses() — add this method to the service if needed.
    // Graceful fallback: if method doesn't exist, fall through to text input.
    const svc = WarehouseLookupAPIService as any
    if (typeof svc.getAllWarehouses === 'function') {
      svc.getAllWarehouses()
        .then((list: InventoryWarehouseFromAPI[]) => setWarehouses(list))
        .catch((e: unknown) => { console.error('Load warehouses failed', e); setWarehouses([]) })
        .finally(() => setLoadingLoc(false))
    } else {
      setWarehouses([])
      setLoadingLoc(false)
    }
  }, [open, form.locationType])

  // --- Populate form in edit mode / reset on close ---
  useEffect(() => {
    if (!open) { setForm(EMPTY_FORM); setErrors({}); setSaveError(null); return }
    if (editRow) {
      setForm({
        productId:        editRow._raw.productId,
        sku:              editRow.productCode,
        locationType:     editRow._raw.locationType,
        locationId:       editRow._raw.locationId,
        quantity:         editRow.currentStock,
        minStockLevel:    editRow.minStock,
        maxStockLevel:    editRow.maxStock,
        reservedQuantity: editRow.reserved,
      })
    } else {
      setForm(EMPTY_FORM)
    }
  }, [open, editRow])

  function set<K extends keyof CreateInventoryForm>(key: K, val: CreateInventoryForm[K]) {
    setForm((prev) => ({ ...prev, [key]: val }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
    setSaveError(null)
  }

  // Auto-fill SKU when product is selected
  function handleProductChange(productId: string) {
    const product = products.find((p) => p.id === productId) ?? null
    set('productId', productId)
    set('sku', product?.sku ?? '')
  }

  function validate(): boolean {
    const e: typeof errors = {}
    if (!form.productId)                                   e.productId      = 'Vui lòng chọn sản phẩm'
    if (!form.locationId.trim())                           e.locationId     = 'Vui lòng chọn hoặc nhập địa điểm'
    if (form.quantity < 0)                                 e.quantity       = 'Số lượng không được âm'
    if (form.minStockLevel < 0)                            e.minStockLevel  = 'Không được âm'
    if (form.maxStockLevel < form.minStockLevel)           e.maxStockLevel  = 'Tối đa phải ≥ tối thiểu'
    if (form.reservedQuantity > form.quantity)             e.reservedQuantity = 'Đặt trước không vượt quá tồn kho'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setSaving(true); setSaveError(null)
    try {
      const payload: Omit<InventoryItem, 'id' | 'updatedAt'> = {
        productId:         form.productId,
        locationType:      form.locationType,
        locationId:        form.locationId.trim(),
        quantity:          form.quantity,
        reservedQuantity:  form.reservedQuantity,
        availableQuantity: Math.max(0, form.quantity - form.reservedQuantity),
        minStockLevel:     form.minStockLevel,
        maxStockLevel:     form.maxStockLevel,
        isLowStock:        form.quantity < form.minStockLevel,
        lastStockCheck:    null,
      }
      if (isEdit && editRow) {
        await InventoryAPIService.updateInventory(editRow.id, payload)
      } else {
        await InventoryAPIService.createInventory(payload)
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      setSaveError(err?.response?.data?.message ?? err?.message ?? 'Đã có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setSaving(false)
    }
  }

  // Live preview status
  const previewStatus: StockStatus =
    form.quantity === 0                                      ? 'OUT_OF_STOCK'
    : form.quantity < form.minStockLevel                    ? 'LOW_STOCK'
    : form.maxStockLevel > 0 && form.quantity > form.maxStockLevel ? 'OVERSTOCK'
    : 'IN_STOCK'

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm ${isEdit ? 'bg-blue-600' : 'bg-green-600'}`}>
              {isEdit ? '✏️' : '📦'}
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 leading-tight">
                {isEdit ? 'Cập nhật tồn kho' : 'Thêm bản ghi tồn kho'}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {isEdit ? `Đang sửa ID: ${editRow?.id?.slice(0, 8)}…` : 'Điền thông tin để tạo bản ghi mới'}
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
          {/* API error */}
          {saveError && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              <span className="text-base flex-shrink-0">⚠️</span>
              <span className="flex-1">{saveError}</span>
            </div>
          )}

          {/* ─── Section 1: Sản phẩm ─── */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-md bg-green-100 flex items-center justify-center text-xs">🛒</span>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Sản phẩm</span>
            </div>

            {/* Product dropdown */}
            <div className="mb-4">
              <FormLabel required>Tên sản phẩm</FormLabel>
              {loadingProd ? (
                <div className={`${inputCls} flex items-center gap-2 text-gray-400 cursor-not-allowed`}>
                  <span className="w-3.5 h-3.5 border-2 border-green-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  Đang tải danh sách sản phẩm...
                </div>
              ) : (
                <select value={form.productId} onChange={(e) => handleProductChange(e.target.value)}
                  className={`${inputCls} ${errors.productId ? 'border-red-300 ring-1 ring-red-200' : ''}`}>
                  <option value="">— Chọn sản phẩm —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ''}</option>
                  ))}
                </select>
              )}
              <FieldError msg={errors.productId} />
            </div>

            {/* SKU (readonly, auto-filled) */}
            <div>
              <FormLabel>Mã SKU <span className="text-gray-400 font-normal">(tự động từ sản phẩm)</span></FormLabel>
              <div className="relative">
                <input type="text" readOnly value={form.sku} placeholder="Chọn sản phẩm để hiện SKU"
                  className={`${inputCls} font-mono bg-gray-50 text-gray-500 cursor-not-allowed pr-16`} />
                {form.sku && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-green-600 bg-green-50 border border-green-100 px-1.5 py-0.5 rounded-md">
                    AUTO
                  </span>
                )}
              </div>
            </div>
          </section>

          <div className="border-t border-dashed border-gray-200" />

          {/* ─── Section 2: Địa điểm ─── */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-md bg-blue-100 flex items-center justify-center text-xs">📍</span>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Địa điểm lưu kho</span>
            </div>

            {/* Location type toggle */}
            <div className="mb-4">
              <FormLabel required>Loại địa điểm</FormLabel>
              <div className="grid grid-cols-2 gap-2">
                {(['WAREHOUSE', 'STORE'] as const).map((t) => (
                  <button key={t} type="button"
                    onClick={() => { set('locationType', t); set('locationId', '') }}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                      form.locationType === t
                        ? 'bg-green-600 text-white border-green-600 shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-green-300 hover:bg-green-50'
                    }`}>
                    <span className="text-base">{t === 'WAREHOUSE' ? '🏭' : '🏪'}</span>
                    <span>{t === 'WAREHOUSE' ? 'Kho hàng' : 'Cửa hàng'}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Location selector */}
            <div>
              <FormLabel required>{form.locationType === 'WAREHOUSE' ? 'Chọn kho hàng' : 'ID cửa hàng'}</FormLabel>
              {form.locationType === 'WAREHOUSE' && warehouses.length > 0 ? (
                /* Dropdown from API */
                <select value={form.locationId} onChange={(e) => set('locationId', e.target.value)}
                  className={`${inputCls} ${errors.locationId ? 'border-red-300 ring-1 ring-red-200' : ''}`}>
                  <option value="">— Chọn kho —</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}{w.location ? ` · ${w.location}` : ''}
                      {w.status ? ` [${w.status}]` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                /* Free-text input (fallback or STORE) */
                <div className="relative">
                  {loadingLoc && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                  )}
                  <input type="text" value={form.locationId}
                    onChange={(e) => set('locationId', e.target.value)}
                    placeholder={form.locationType === 'WAREHOUSE' ? 'Nhập Warehouse ID...' : 'Nhập Store ID...'}
                    className={`${inputCls} ${errors.locationId ? 'border-red-300 ring-1 ring-red-200' : ''}`}
                  />
                </div>
              )}
              <FieldError msg={errors.locationId} />
              <p className="text-[11px] text-gray-400 mt-1">
                {form.locationType === 'WAREHOUSE'
                  ? warehouses.length > 0 ? `${warehouses.length} kho khả dụng từ API` : 'getAllWarehouses() chưa được implement — nhập ID trực tiếp'
                  : 'Nhập Store ID từ hệ thống quản lý cửa hàng'}
              </p>
            </div>
          </section>

          <div className="border-t border-dashed border-gray-200" />

          {/* ─── Section 3: Số lượng ─── */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-md bg-purple-100 flex items-center justify-center text-xs">📦</span>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Thông số tồn kho</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FormLabel required>Số lượng hiện tại</FormLabel>
                <input type="number" min={0} value={form.quantity}
                  onChange={(e) => set('quantity', Math.max(0, Number(e.target.value)))}
                  className={`${inputCls} ${errors.quantity ? 'border-red-300 ring-1 ring-red-200' : ''}`} />
                <FieldError msg={errors.quantity} />
              </div>

              <div>
                <FormLabel>Đặt trước</FormLabel>
                <input type="number" min={0} value={form.reservedQuantity}
                  onChange={(e) => set('reservedQuantity', Math.max(0, Number(e.target.value)))}
                  className={`${inputCls} ${errors.reservedQuantity ? 'border-red-300 ring-1 ring-red-200' : ''}`} />
                <FieldError msg={errors.reservedQuantity} />
                <p className="text-[11px] text-emerald-600 mt-1 font-semibold">
                  Khả dụng: {Math.max(0, form.quantity - form.reservedQuantity).toLocaleString('vi-VN')}
                </p>
              </div>

              <div>
                <FormLabel>Tồn tối thiểu</FormLabel>
                <input type="number" min={0} value={form.minStockLevel}
                  onChange={(e) => set('minStockLevel', Math.max(0, Number(e.target.value)))}
                  className={`${inputCls} ${errors.minStockLevel ? 'border-red-300 ring-1 ring-red-200' : ''}`} />
                <FieldError msg={errors.minStockLevel} />
              </div>

              <div>
                <FormLabel>Tồn tối đa</FormLabel>
                <input type="number" min={0} value={form.maxStockLevel}
                  onChange={(e) => set('maxStockLevel', Math.max(0, Number(e.target.value)))}
                  className={`${inputCls} ${errors.maxStockLevel ? 'border-red-300 ring-1 ring-red-200' : ''}`} />
                <FieldError msg={errors.maxStockLevel} />
              </div>
            </div>

            {/* Live status preview */}
            {form.productId && (
              <div className="mt-4 p-4 bg-gray-50 border border-gray-100 rounded-xl">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Xem trước trạng thái</p>
                <div className="flex items-center gap-3">
                  <StatusBadge status={previewStatus} />
                  <div className="flex-1">
                    <StockBar current={form.quantity} min={form.minStockLevel} max={form.maxStockLevel} />
                  </div>
                  <span className="text-xs font-bold text-gray-500 tabular-nums">
                    {form.quantity.toLocaleString()}/{form.maxStockLevel > 0 ? form.maxStockLevel.toLocaleString() : '∞'}
                  </span>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/60 flex-shrink-0">
          <button onClick={onClose} disabled={saving}
            className="px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-all disabled:opacity-50">
            Hủy
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
              isEdit ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
            }`}>
            {saving
              ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Đang lưu...</span></>
              : <><span>{isEdit ? '💾' : '➕'}</span><span>{isEdit ? 'Cập nhật' : 'Tạo mới'}</span></>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

interface InventoryReportsPageProps {
  onExportPdf?:   () => void
  onExportExcel?: () => void
}

export default function InventoryReportsPage({ onExportPdf, onExportExcel }: InventoryReportsPageProps) {
  // --- Data ---
  const [rawData,       setRawData]       = useState<InventoryReportRow[]>([])
  const [isLoading,     setIsLoading]     = useState(true)
  const [error,         setError]         = useState<string | null>(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null)

  // --- Modal ---
  const [modalOpen, setModalOpen] = useState(false)
  const [editRow,   setEditRow]   = useState<InventoryReportRow | null>(null)

  // --- Filters ---
  const [statusFilter,   setStatusFilter]   = useState<'all' | StockStatus>('all')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [searchQuery,    setSearchQuery]    = useState('')

  // --- Pagination ---
  const [page,     setPage]     = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // --- Sort ---
  const [sortKey, setSortKey] = useState<keyof InventoryReportRow>('productName')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  // --- Fetch all inventory ---
  const fetchData = useCallback(async () => {
    setIsLoading(true); setError(null)
    try {
      const items = await InventoryAPIService.getAllInventory()
      setRawData(items.map(mapApiToRow))
      setLastUpdatedAt(new Date().toISOString())
    } catch {
      setError('Không thể tải dữ liệu tồn kho. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // --- Filter logic ---
  const hasFilters = !!(statusFilter !== 'all' || categoryFilter || locationFilter || searchQuery)

  function clearFilters() {
    setStatusFilter('all'); setCategoryFilter(''); setLocationFilter(''); setSearchQuery(''); setPage(1)
  }

  const categories = useMemo(() => Array.from(new Set(rawData.map((r) => r.category))).sort(), [rawData])

  const filtered = useMemo(() => rawData.filter((row) => {
    if (statusFilter !== 'all' && row.status !== statusFilter) return false
    if (categoryFilter && !row.category.toLowerCase().includes(categoryFilter.toLowerCase())) return false
    if (locationFilter && !row.storeName.toLowerCase().includes(locationFilter.toLowerCase()) && !row.warehouseName.toLowerCase().includes(locationFilter.toLowerCase())) return false
    if (searchQuery && !row.productName.toLowerCase().includes(searchQuery.toLowerCase()) && !row.productCode.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  }), [rawData, statusFilter, categoryFilter, locationFilter, searchQuery])

  // --- Sort ---
  function toggleSort(key: keyof InventoryReportRow) {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
    setPage(1)
  }

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    const av = a[sortKey]; const bv = b[sortKey]
    if (av == null) return 1; if (bv == null) return -1
    const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv), 'vi')
    return sortDir === 'asc' ? cmp : -cmp
  }), [filtered, sortKey, sortDir])

  // --- Pagination ---
  const totalPages = Math.ceil(sorted.length / pageSize)
  const paginated  = sorted.slice((page - 1) * pageSize, page * pageSize)

  // --- KPIs (from filtered) ---
  const totalValue    = filtered.reduce((s, r) => s + r.stockValue, 0)
  const totalItems    = filtered.reduce((s, r) => s + r.currentStock, 0)
  const lowStockCount = filtered.filter((r) => r.status === 'LOW_STOCK').length
  const outCount      = filtered.filter((r) => r.status === 'OUT_OF_STOCK').length

  const statusCounts = useMemo(() => ({
    IN_STOCK:     rawData.filter((r) => r.status === 'IN_STOCK').length,
    LOW_STOCK:    rawData.filter((r) => r.status === 'LOW_STOCK').length,
    OUT_OF_STOCK: rawData.filter((r) => r.status === 'OUT_OF_STOCK').length,
    OVERSTOCK:    rawData.filter((r) => r.status === 'OVERSTOCK').length,
  }), [rawData])

  const statusBreakdown = (['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'OVERSTOCK'] as StockStatus[]).map((s) => ({
    status: s,
    count: rawData.filter((r) => r.status === s).length,
    pct: rawData.length > 0 ? Math.round((rawData.filter((r) => r.status === s).length / rawData.length) * 100) : 0,
  }))

  const topByValue = useMemo(() => [...rawData].sort((a, b) => b.stockValue - a.stockValue).slice(0, 5), [rawData])

  const formattedLastUpdated = lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleString('vi-VN') : null

  function SortIcon({ col }: { col: keyof InventoryReportRow }) {
    return <span className={`ml-1 text-[10px] ${sortKey === col ? 'text-green-600' : 'text-gray-300'}`}>{sortKey === col ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
  }

  return (
    <div className="min-h-screen bg-[#f4f6f9]" style={{ fontFamily: "'Be Vietnam Pro', 'Nunito', sans-serif" }}>

      {/* ── Modal ── */}
      <InventoryFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditRow(null) }}
        onSuccess={fetchData}
        editRow={editRow}
      />

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-20">
        <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center shadow-sm">
              <span className="text-white text-xl">🏪</span>
            </div>
            <div>
              <nav className="flex items-center gap-1 text-[11px] text-gray-400 mb-0.5">
                <span>Admin</span><span className="mx-1 text-gray-300">/</span>
                <span>Báo cáo</span><span className="mx-1 text-gray-300">/</span>
                <span className="text-green-700 font-semibold">Tồn kho</span>
              </nav>
              <h1 className="text-lg font-bold text-gray-900 leading-tight tracking-tight">Báo cáo tồn kho</h1>
            </div>
            {formattedLastUpdated && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg ml-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Cập nhật: {formattedLastUpdated}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchData} disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-all disabled:opacity-50">
              <span className={`text-base ${isLoading ? 'animate-spin' : ''}`}>🔄</span>
              <span className="hidden sm:inline">Làm mới</span>
            </button>
            <button onClick={onExportPdf} disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-all disabled:opacity-50">
              <span>📄</span><span className="hidden sm:inline">Xuất PDF</span>
            </button>
            <button onClick={onExportExcel} disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-all disabled:opacity-50">
              <span>📊</span><span className="hidden sm:inline">Xuất Excel</span>
            </button>
            {/* ← Primary CTA: mở modal tạo mới */}
            <button
              onClick={() => { setEditRow(null); setModalOpen(true) }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-green-600 rounded-xl hover:bg-green-700 transition-all shadow-sm">
              <span>➕</span><span>Thêm tồn kho</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-5 space-y-5 max-w-screen-2xl mx-auto">

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-3.5 rounded-2xl text-sm font-medium">
            <span>⚠️</span><span className="flex-1">{error}</span>
            <button onClick={fetchData} className="underline font-semibold">Thử lại</button>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon="💰" label="Giá trị tồn kho" accent="bg-blue-50"    value={`${(totalValue / 1_000_000).toFixed(1)} tr ₫`} sub={`${filtered.length} SKU`}    isLoading={isLoading} />
          <KpiCard icon="📦" label="Tổng số lượng"   accent="bg-emerald-50" value={totalItems.toLocaleString('vi-VN')}            sub="Đơn vị tồn"                  isLoading={isLoading} />
          <KpiCard icon="⚠️" label="Sắp hết hàng"   accent="bg-amber-50"   value={`${lowStockCount} SKU`}                        sub="Cần bổ sung" subColor="text-amber-500 font-semibold" isLoading={isLoading} />
          <KpiCard icon="🚨" label="Hết hàng"        accent="bg-red-50"     value={`${outCount} SKU`}                             sub="Cần nhập khẩn" subColor="text-red-500 font-semibold" isLoading={isLoading} />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🔍</span>
              <input type="text" placeholder="Tìm tên sản phẩm, mã SKU..." value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all" />
            </div>
            <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 min-w-[160px]">
              <option value="">Tất cả danh mục</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="relative min-w-[180px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">📍</span>
              <input type="text" placeholder="Tìm địa điểm..." value={locationFilter}
                onChange={(e) => { setLocationFilter(e.target.value); setPage(1) }}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all" />
            </div>
            {hasFilters && (
              <button onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 border border-dashed border-gray-300 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all">
                ✕ Xóa lọc
              </button>
            )}
          </div>
          <div className="px-4 py-3 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 font-medium mr-1">Trạng thái:</span>
            <FilterChip label="Tất cả" active={statusFilter === 'all'} count={rawData.length} onClick={() => { setStatusFilter('all'); setPage(1) }} />
            {(['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'OVERSTOCK'] as StockStatus[]).map((s) => (
              <FilterChip key={s} label={STATUS_CFG[s].label} active={statusFilter === s} count={statusCounts[s]}
                onClick={() => { setStatusFilter(s); setPage(1) }} color={STATUS_CFG[s].chip} />
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-800">Danh sách sản phẩm</span>
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">{filtered.length.toLocaleString()}</span>
            </div>
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="w-3 h-3 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />Đang tải...
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 border-[3px] border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="text-sm font-semibold text-gray-500 mt-4">Đang tải dữ liệu...</div>
              <div className="text-xs text-gray-400 mt-1">Vui lòng chờ trong giây lát</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-gray-400">
              <div className="text-4xl mb-3">📭</div>
              <div className="text-sm font-semibold text-gray-500">Không tìm thấy sản phẩm</div>
              {hasFilters && <button onClick={clearFilters} className="mt-3 text-xs text-green-600 underline font-semibold">Xóa tất cả bộ lọc</button>}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/80 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                      {([
                        ['productName',  'Sản phẩm',   'text-left px-5 py-3'],
                        ['storeName',    'Địa điểm',   'text-left px-4 py-3'],
                        ['currentStock', 'Tồn kho',    'text-center px-4 py-3'],
                        ['available',    'Khả dụng',   'text-center px-4 py-3'],
                        ['stockValue',   'Giá trị',    'text-right px-4 py-3'],
                        ['lastRestocked','Nhập cuối',  'text-center px-4 py-3'],
                        ['status',       'Trạng thái', 'text-center px-4 py-3'],
                      ] as [keyof InventoryReportRow, string, string][]).map(([key, label, cls]) => (
                        <th key={key} className={cls}>
                          <button onClick={() => toggleSort(key)} className="inline-flex items-center hover:text-gray-700 transition-colors">
                            {label}<SortIcon col={key} />
                          </button>
                        </th>
                      ))}
                      <th className="text-center px-4 py-3">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginated.map((row) => (
                      <tr key={row.id} className="hover:bg-green-50/30 transition-colors group">
                        {/* Product */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-green-50 group-hover:bg-green-100 flex items-center justify-center flex-shrink-0 transition-colors border border-green-100">🛒</div>
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-900 leading-tight truncate max-w-[200px]" title={row.productName}>{row.productName}</div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-mono text-[11px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{row.productCode}</span>
                                <span className="text-[11px] text-gray-400">{row.category}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        {/* Location */}
                        <td className="px-4 py-3.5">
                          <div className="text-sm font-semibold text-gray-700">{row.storeName !== '—' ? row.storeName : row.warehouseName}</div>
                          <div className="text-[10px] font-bold uppercase tracking-wide text-gray-300 mt-0.5">{row.storeName !== '—' ? 'Cửa hàng' : 'Kho hàng'}</div>
                        </td>
                        {/* Stock */}
                        <td className="px-4 py-3.5 text-center">
                          <div className="font-bold text-gray-900 tabular-nums">{row.currentStock.toLocaleString('vi-VN')}</div>
                          <StockBar current={row.currentStock} min={row.minStock} max={row.maxStock} />
                          <div className="text-[10px] text-gray-400 mt-0.5">{row.minStock.toLocaleString()}–{row.maxStock.toLocaleString()}</div>
                        </td>
                        {/* Available */}
                        <td className="px-4 py-3.5 text-center">
                          <div className="font-bold text-emerald-700 tabular-nums">{row.available.toLocaleString('vi-VN')}</div>
                          <div className="text-[10px] text-gray-400 mt-0.5">Đặt <strong className="text-gray-600">{row.reserved}</strong></div>
                        </td>
                        {/* Value */}
                        <td className="px-4 py-3.5 text-right">
                          <div className="font-bold text-gray-900 tabular-nums whitespace-nowrap">
                            {row.stockValue >= 1_000_000 ? `${(row.stockValue / 1_000_000).toFixed(1)}tr ₫` : `${row.stockValue.toLocaleString('vi-VN')} ₫`}
                          </div>
                        </td>
                        {/* Date */}
                        <td className="px-4 py-3.5 text-center">
                          <span className="text-xs text-gray-500">{new Date(row.lastRestocked).toLocaleDateString('vi-VN')}</span>
                        </td>
                        {/* Status */}
                        <td className="px-4 py-3.5 text-center"><StatusBadge status={row.status} /></td>
                        {/* Actions */}
                        <td className="px-4 py-3.5 text-center">
                          <button
                            onClick={() => { setEditRow(row); setModalOpen(true) }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-all">
                            ✏️ Sửa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} totalPages={totalPages} pageSize={pageSize} total={filtered.length}
                onPage={setPage} onPageSize={(s) => { setPageSize(s); setPage(1) }} />
            </>
          )}
        </div>

        {/* Analysis panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">📊</span>Phân tích theo trạng thái
            </h3>
            <div className="space-y-3.5">
              {statusBreakdown.map(({ status, count, pct }) => {
                const c = STATUS_CFG[status]
                return (
                  <div key={status} className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${c.bg} ${c.text} ${c.border} min-w-[90px]`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />{c.label}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className={`h-2 rounded-full transition-all duration-700 ${c.dot}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex items-center gap-1.5 min-w-[60px] justify-end">
                      <span className="text-sm font-bold text-gray-800">{count}</span>
                      <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">🏆</span>Top 5 theo giá trị tồn
            </h3>
            {topByValue.length === 0
              ? <div className="text-sm text-gray-400 text-center py-8">Chưa có dữ liệu</div>
              : (
                <div className="space-y-3">
                  {topByValue.map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black flex-shrink-0 border ${
                        idx === 0 ? 'bg-amber-100 text-amber-700 border-amber-200'
                        : idx === 1 ? 'bg-gray-100 text-gray-600 border-gray-200'
                        : idx === 2 ? 'bg-orange-50 text-orange-500 border-orange-100'
                        : 'bg-gray-50 text-gray-400 border-gray-100'
                      }`}>
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-800 truncate">{item.productName}</div>
                        <div className="text-[11px] text-gray-400">{item.currentStock.toLocaleString()} đvt · {item.storeName !== '—' ? item.storeName : item.warehouseName}</div>
                      </div>
                      <div className="text-sm font-bold text-blue-600 whitespace-nowrap">
                        {item.stockValue >= 1_000_000 ? `${(item.stockValue / 1_000_000).toFixed(1)}tr ₫` : `${item.stockValue.toLocaleString('vi-VN')} ₫`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  )
}