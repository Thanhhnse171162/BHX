'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Plus, FileDown, Search, SlidersHorizontal, Eye,
  ChevronLeft, ChevronRight, X, ChevronDown,
  Package, ArrowRight, Trash2, CheckCircle2
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type Priority = 'HIGH' | 'NORMAL' | 'URGENT'
type Status = 'Chờ duyệt' | 'Đã duyệt' | 'Đã từ chối'

interface LineItem {
  sku: string
  name: string
  category: string
  tonHienCo: number
  minMax: string
  soLuongYeuCau: number
  supplier: string
  priority: Priority
}

interface Product {
  sku: string
  name: string
  category: string
  quantityRequested: number
  quantityCurrent: number
  quantitySuggested: number
  supplier: string
  priority: Priority
  status: Status
  tonDich: number
  minMax: string
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const PRODUCTS: Product[] = [
  {
    sku: 'SKU-98210', name: 'Nike Air Max 270', category: 'Footwear / Athletics',
    quantityRequested: 150, quantityCurrent: 2450, quantitySuggested: 50,
    supplier: 'Nike Suppliers', priority: 'HIGH', status: 'Chờ duyệt',
    tonDich: 20, minMax: '50 / 500',
  },
  {
    sku: 'SKU-44122', name: 'Smart Watch Pro G3', category: 'Electronics / Gadgets',
    quantityRequested: 45, quantityCurrent: 112, quantitySuggested: 30,
    supplier: 'Samsung', priority: 'NORMAL', status: 'Đã duyệt',
    tonDich: 5, minMax: '10 / 100',
  },
  {
    sku: 'SKU-77215', name: 'Adidas Ultraboost', category: 'Footwear / Athletics',
    quantityRequested: 80, quantityCurrent: 12, quantitySuggested: 100,
    supplier: 'Adidas Logistics', priority: 'URGENT', status: 'Đã từ chối',
    tonDich: 3, minMax: '20 / 200',
  },
  {
    sku: 'SKU-33401', name: 'Sony WH-1000XM5', category: 'Electronics / Audio',
    quantityRequested: 60, quantityCurrent: 34, quantitySuggested: 40,
    supplier: 'Sony VN', priority: 'HIGH', status: 'Chờ duyệt',
    tonDich: 8, minMax: '15 / 150',
  },
  {
    sku: 'SKU-55678', name: 'Levi\'s 501 Jeans', category: 'Apparel / Denim',
    quantityRequested: 200, quantityCurrent: 430, quantitySuggested: 120,
    supplier: 'Levi Strauss Asia', priority: 'NORMAL', status: 'Đã duyệt',
    tonDich: 50, minMax: '100 / 600',
  },
]

const SUPPLIER_OPTIONS: Record<string, string[]> = {
  'SKU-98210': ['Nike Suppliers', 'Sport Direct VN', 'Foot Locker Asia'],
  'SKU-44122': ['Samsung', 'Tech World VN', 'Điện Máy Xanh'],
  'SKU-77215': ['Adidas Logistics', 'Sport 2000', 'Joma VN'],
  'SKU-33401': ['Sony VN', 'FPT Shop', 'Thế Giới Di Động'],
  'SKU-55678': ['Levi Strauss Asia', 'Fashion World VN', 'Canifa'],
}

const DEFAULT_LINE_ITEMS: LineItem[] = [
  {
    sku: 'SKU-98210', name: 'Nike Air Max 270', category: 'Footwear / Athletics',
    tonHienCo: 2450, minMax: '50 / 500', soLuongYeuCau: 150,
    supplier: 'Foot Locker Asia', priority: 'HIGH',
  },
  {
    sku: 'SKU-44122', name: 'Smart Watch Pro G3', category: 'Electronics / Gadgets',
    tonHienCo: 112, minMax: '10 / 100', soLuongYeuCau: 45,
    supplier: 'Tech World VN', priority: 'NORMAL',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const priorityStyle: Record<Priority, string> = {
  HIGH:   'text-blue-600 font-semibold',
  NORMAL: 'text-gray-500 font-medium',
  URGENT: 'text-red-500 font-semibold',
}

const priorityDot: Record<Priority, string> = {
  HIGH:   'bg-blue-500',
  NORMAL: 'bg-gray-400',
  URGENT: 'bg-red-500',
}

const priorityBadge: Record<Priority, string> = {
  HIGH:   'bg-blue-50 text-blue-600 border border-blue-200',
  NORMAL: 'bg-gray-100 text-gray-500 border border-gray-200',
  URGENT: 'bg-red-50 text-red-500 border border-red-200',
}

const statusStyle: Record<Status, string> = {
  'Chờ duyệt':  'text-amber-600 bg-amber-50 border border-amber-200',
  'Đã duyệt':   'text-green-600 bg-green-50 border border-green-200',
  'Đã từ chối': 'text-red-500 bg-red-50 border border-red-200',
}

type TabFilter = 'Tất cả' | 'Chờ duyệt' | 'Đã duyệt' | 'Đã từ chối'
const TABS: TabFilter[] = ['Tất cả', 'Chờ duyệt', 'Đã duyệt', 'Đã từ chối']

// ─── Add Product Dropdown ─────────────────────────────────────────────────────

function AddProductDropdown({
  existing,
  onAdd,
  onClose,
}: {
  existing: string[]
  onAdd: (p: LineItem) => void
  onClose: () => void
}) {
  const available = PRODUCTS.filter(p => !existing.includes(p.sku))
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const filtered = available.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const handleSelect = (p: Product) => {
    onAdd({
      sku: p.sku, name: p.name, category: p.category,
      tonHienCo: p.quantityCurrent, minMax: p.minMax,
      soLuongYeuCau: p.quantityRequested,
      supplier: p.supplier, priority: p.priority,
    })
    onClose()
  }

  const priorityColor: Record<Priority, string> = {
    HIGH: 'text-blue-500',
    NORMAL: 'text-gray-400',
    URGENT: 'text-red-500',
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
        {filtered.length === 0 ? (
          <div className="py-8 text-center">
            <Package size={20} className="mx-auto text-gray-300 mb-2" />
            <p className="text-xs text-gray-400">
              {available.length === 0 ? 'Đã thêm tất cả sản phẩm' : 'Không tìm thấy sản phẩm'}
            </p>
          </div>
        ) : filtered.map((p, i) => (
          <button
            key={p.sku}
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
                <span className="text-[10px] text-gray-400 truncate">{p.category}</span>
              </div>
            </div>
            {/* Stock + priority */}
            <div className="text-right flex-shrink-0">
              <p className="text-[10px] font-bold text-gray-600">{p.quantityCurrent.toLocaleString()}</p>
              <p className="text-[9px] text-gray-400">tồn kho</p>
            </div>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${priorityBadge[p.priority]} flex-shrink-0`}>
              {p.priority}
            </span>
          </button>
        ))}
      </div>

      {/* Footer hint */}
      {available.length > 0 && (
        <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 text-center">
            {available.length} sản phẩm có sẵn trong Kho Tổng
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Create Request Modal ─────────────────────────────────────────────────────

function CreateRequestModal({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<LineItem[]>(DEFAULT_LINE_ITEMS)
  const [ngayCan, setNgayCan] = useState('')
  const [mucDoUuTien, setMucDoUuTien] = useState<'Normal' | 'High' | 'Urgent'>('Normal')
  const [ghiChu, setGhiChu] = useState('')
  const [showAddDropdown, setShowAddDropdown] = useState(false)

  const updateItem = (sku: string, field: keyof LineItem, val: string | number) => {
    setItems(prev => prev.map(p => p.sku === sku ? { ...p, [field]: val } : p))
  }
  const removeItem = (sku: string) => setItems(prev => prev.filter(p => p.sku !== sku))

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
            <p className="text-xs text-gray-400 mt-1">Khởi tạo quy trình cung ứng hàng hóa cho hệ thống kho bãi</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Mã phiếu (ID)</p>
              <p className="text-base font-bold text-blue-600">PR-2024-001</p>
            </div>
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
                  value="Kho Tổng"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-600 bg-gray-50 cursor-not-allowed focus:outline-none pr-14"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-md px-1.5 py-0.5 tracking-wide">
                  AUTO
                </span>
              </div>
            </div>

            {/* Ngày cần hàng */}
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Ngày cần hàng <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={ngayCan}
                onChange={e => setNgayCan(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              />
            </div>

            {/* Mức độ ưu tiên — spans col 3–4 */}
            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Mức độ ưu tiên
              </label>
              <div className="flex gap-2 h-[42px]">
                {([
                  { val: 'Normal', icon: '●', active: 'bg-gray-800 text-white border-gray-800 shadow-sm' },
                  { val: 'High',   icon: '▲', active: 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200' },
                  { val: 'Urgent', icon: '⚠', active: 'bg-red-500 text-white border-red-500 shadow-sm shadow-red-100' },
                ] as const).map(opt => (
                  <button
                    key={opt.val}
                    onClick={() => setMucDoUuTien(opt.val)}
                    className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-bold rounded-xl border transition-all ${
                      mucDoUuTien === opt.val
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
                value={ghiChu}
                onChange={e => setGhiChu(e.target.value)}
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
                    existing={items.map(i => i.sku)}
                    onAdd={p => setItems(prev => [...prev, p])}
                    onClose={() => setShowAddDropdown(false)}
                  />
                )}
              </div>
            </div>

            {/* Column headers — light gray */}
            <div className="bg-gray-50 border-b border-gray-200 grid grid-cols-[80px_1fr_100px_100px_110px_1fr_36px] gap-3 px-5 py-2.5">
              {['SKU', 'TÊN SẢN PHẨM', 'TỒN HIỆN CÓ', 'MIN / MAX', 'SL YÊU CẦU', 'NHÀ CUNG CẤP ƯU TIÊN', ''].map(h => (
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
                  <p className="text-xs text-gray-400 mt-1">Nhấn "Thêm sản phẩm" để chọn từ Kho Tổng</p>
                </div>
              ) : items.map(item => (
                <div
                  key={item.sku}
                  className="grid grid-cols-[80px_1fr_100px_100px_110px_1fr_36px] gap-3 px-5 py-3.5 items-center group hover:bg-blue-50/30 transition-colors"
                >
                  {/* SKU */}
                  <span className="text-[10px] text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded-md leading-tight inline-block">
                    {item.sku}
                  </span>

                  {/* Product */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
                      <Package size={13} className="text-gray-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-800 truncate">{item.name}</p>
                      <p className="text-[10px] text-gray-400 truncate">{item.category}</p>
                    </div>
                  </div>

                  {/* Tồn hiện có */}
                  <div>
                    <span className="text-sm font-bold text-gray-800">{item.tonHienCo.toLocaleString()}</span>
                    <span className="text-[10px] text-gray-400 ml-1">sp</span>
                  </div>

                  {/* Min/Max */}
                  <span className="text-xs text-gray-500 font-medium">{item.minMax}</span>

                  {/* SL yêu cầu — editable */}
                  <input
                    type="number"
                    min={0}
                    value={item.soLuongYeuCau}
                    onChange={e => updateItem(item.sku, 'soLuongYeuCau', +e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-800 text-center focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition-all bg-white hover:border-gray-300"
                  />

                  {/* Nhà cung cấp — styled select */}
                  <div className="relative">
                    <select
                      value={item.supplier}
                      onChange={e => updateItem(item.sku, 'supplier', e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition-all bg-white hover:border-gray-300 pr-7 cursor-pointer"
                    >
                      {(SUPPLIER_OPTIONS[item.sku] || [item.supplier]).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeItem(item.sku)}
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
                Gợi ý: Nhà cung cấp được gợi ý tự động dựa trên lịch sử giao dịch của hệ thống.
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
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20">
              <ArrowRight size={15} />
              Gửi yêu cầu
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReplenishmentPage() {
  const [activeTab, setActiveTab] = useState<TabFilter>('Tất cả')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)

  const filtered = PRODUCTS.filter(p => {
    const matchTab = activeTab === 'Tất cả' || p.status === activeTab
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  const tabCount = (tab: TabFilter) =>
    tab === 'Tất cả' ? PRODUCTS.length : PRODUCTS.filter(p => p.status === tab).length

  return (
    <div className="min-h-screen bg-gray-50/80 p-6">
      {showModal && <CreateRequestModal onClose={() => setShowModal(false)} />}

      <div className="max-w-6xl mx-auto space-y-5">

        {/* Page Header */}
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <p className="text-[11px] text-blue-600 font-bold uppercase tracking-widest">Kho HCM</p>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Danh sách đề xuất bổ sung</h1>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/20"
            >
              <Plus size={15} />
              Tạo yêu cầu nhập hàng
            </button>
            <button className="flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
              <FileDown size={15} />
              Excel
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
          <div className="flex items-end gap-5">
            <div className="w-64 flex-shrink-0">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Tìm kiếm sản phẩm
              </label>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Mã SP, Tên SP hoặc Lý do..."
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

            <button className="flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors flex-shrink-0">
              <SlidersHorizontal size={13} />
              Lọc nâng cao
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-[#0f1f3d]">
            <div className="grid grid-cols-[110px_1fr_90px_105px_120px_140px_80px_110px_52px] gap-2 px-6 py-3.5">
              {[
                'Mã sản phẩm (SKU)', 'Tên sản phẩm', 'SL yêu cầu',
                'SL hiện có', 'SL đề xuất mua', 'Nhà cung cấp ưu tiên',
                'Ưu tiên', 'Trạng thái', 'Thao tác',
              ].map(h => (
                <span key={h} className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-tight">{h}</span>
              ))}
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <Package size={32} className="mx-auto text-gray-200 mb-3" />
                <p className="text-gray-400 text-sm font-medium">Không tìm thấy kết quả</p>
              </div>
            ) : filtered.map(p => (
              <div
                key={p.sku}
                className="grid grid-cols-[110px_1fr_90px_105px_120px_140px_80px_110px_52px] gap-2 px-6 py-4 items-center hover:bg-blue-50/20 transition-colors"
              >
                <span className="text-[11px] font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">{p.sku}</span>
                <span className="text-sm font-semibold text-gray-800">{p.name}</span>
                <span className="text-sm font-bold text-gray-900">{p.quantityRequested}</span>
                <span className="text-sm text-gray-500">{p.quantityCurrent.toLocaleString()}</span>
                <span className="text-sm font-bold text-blue-600">{p.quantitySuggested}</span>
                <span className="text-xs text-gray-600">{p.supplier}</span>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${priorityDot[p.priority]}`} />
                  <span className={`text-xs ${priorityStyle[p.priority]}`}>{p.priority}</span>
                </div>
                <span className={`text-[11px] font-semibold px-2 py-1 rounded-lg ${statusStyle[p.status]}`}>
                  {p.status}
                </span>
                <button className="flex items-center justify-center text-gray-300 hover:text-blue-500 transition-colors w-8 h-8 rounded-lg hover:bg-blue-50">
                  <Eye size={15} />
                </button>
              </div>
            ))}
          </div>

          <div className="px-6 py-3.5 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <p className="text-xs text-gray-400">
              Hiển thị <span className="font-bold text-gray-600">1–{filtered.length}</span> của{' '}
              <span className="font-bold text-gray-600">24</span> đề xuất
            </p>
            <div className="flex items-center gap-1">
              <button className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-100 transition-colors">
                <ChevronLeft size={13} />
              </button>
              {[1, 2].map(n => (
                <button key={n} className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                  n === 1 ? 'bg-blue-600 text-white shadow-sm' : 'border border-gray-200 text-gray-500 hover:bg-gray-100'
                }`}>
                  {n}
                </button>
              ))}
              <button className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-100 transition-colors">
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}