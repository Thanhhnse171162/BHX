'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  Search,
  Package,
  AlertTriangle,
  XCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
  Pencil,
  Minus,
  Plus,
  ArrowRight,
  X,
  Warehouse,
  Filter,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
type StockStatus = 'Còn hàng' | 'Sắp hết' | 'Hết hàng'

interface InventoryItem {
  id: string
  name: string
  sku: string
  category: string
  quantity: number
  minStock: number
  maxStock: number
  unit: string
  location: string
  backroomStock: number
  lastUpdated: string
  status: StockStatus
  price: number
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const INVENTORY: InventoryItem[] = [
  { id: 'SP-001', name: 'Sữa tươi Vinamilk 1L',         sku: 'VNM-STT-1L',   category: 'Sữa & Trứng',     quantity: 240, minStock: 50,  maxStock: 280, unit: 'Hộp',  location: 'A-01', backroomStock: 90,  lastUpdated: '10/03/2026', status: 'Còn hàng', price: 35000  },
  { id: 'SP-002', name: 'Nước mắm Phú Quốc 750ml',      sku: 'PQ-NMM-750',   category: 'Gia vị',          quantity: 18,  minStock: 30,  maxStock: 120, unit: 'Chai', location: 'B-03', backroomStock: 160, lastUpdated: '09/03/2026', status: 'Sắp hết',  price: 68000  },
  { id: 'SP-003', name: 'Mì gói Hảo Hảo tôm chua cay', sku: 'HH-MG-TCC',    category: 'Mì & Cháo',       quantity: 0,   minStock: 100, maxStock: 260, unit: 'Thùng',location: 'C-05', backroomStock: 400, lastUpdated: '08/03/2026', status: 'Hết hàng', price: 4000   },
  { id: 'SP-004', name: 'Trứng gà ta (vỉ 10)',          sku: 'TG-TA-10',     category: 'Sữa & Trứng',     quantity: 85,  minStock: 40,  maxStock: 200, unit: 'Vỉ',   location: 'A-02', backroomStock: 120, lastUpdated: '10/03/2026', status: 'Còn hàng', price: 42000  },
  { id: 'SP-005', name: 'Dầu ăn Neptune 1L',            sku: 'NTP-DA-1L',    category: 'Dầu ăn',          quantity: 12,  minStock: 20,  maxStock: 100, unit: 'Chai', location: 'B-01', backroomStock: 88,  lastUpdated: '09/03/2026', status: 'Sắp hết',  price: 55000  },
  { id: 'SP-006', name: 'Gạo ST25 túi 5kg',             sku: 'ST25-G-5KG',   category: 'Gạo & Nông sản',  quantity: 320, minStock: 100, maxStock: 420, unit: 'Túi',  location: 'D-01', backroomStock: 220, lastUpdated: '07/03/2026', status: 'Còn hàng', price: 115000 },
  { id: 'SP-007', name: 'Bánh mì sandwich Hải Hà',      sku: 'HH-BM-SW',     category: 'Bánh & Kẹo',      quantity: 6,   minStock: 30,  maxStock: 140, unit: 'Gói',  location: 'E-04', backroomStock: 205, lastUpdated: '10/03/2026', status: 'Sắp hết',  price: 22000  },
  { id: 'SP-008', name: 'Nước ngọt Pepsi lon 330ml',    sku: 'PEP-LON-330',  category: 'Nước uống',       quantity: 0,   minStock: 60,  maxStock: 260, unit: 'Lon',  location: 'F-02', backroomStock: 320, lastUpdated: '08/03/2026', status: 'Hết hàng', price: 11000  },
  { id: 'SP-009', name: 'Xà phòng Lifebuoy 100g',       sku: 'LBY-XP-100G',  category: 'Vệ sinh cá nhân', quantity: 150, minStock: 50,  maxStock: 260, unit: 'Bánh', location: 'G-01', backroomStock: 85,  lastUpdated: '06/03/2026', status: 'Còn hàng', price: 15000  },
  { id: 'SP-010', name: 'Bột ngọt Ajinomoto 200g',      sku: 'AJN-BN-200G',  category: 'Gia vị',          quantity: 22,  minStock: 40,  maxStock: 160, unit: 'Gói',  location: 'B-04', backroomStock: 130, lastUpdated: '09/03/2026', status: 'Sắp hết',  price: 18000  },
  { id: 'SP-011', name: 'Kem đánh răng Colgate 230g',   sku: 'CLG-KDR-230',  category: 'Vệ sinh cá nhân', quantity: 88,  minStock: 30,  maxStock: 120, unit: 'Tuýp', location: 'G-02', backroomStock: 36,  lastUpdated: '05/03/2026', status: 'Còn hàng', price: 38000  },
  { id: 'SP-012', name: 'Cá ngừ đóng hộp Bình Đà',      sku: 'BD-CN-HP',     category: 'Đồ hộp',          quantity: 0,   minStock: 40,  maxStock: 180, unit: 'Hộp',  location: 'H-01', backroomStock: 140, lastUpdated: '07/03/2026', status: 'Hết hàng', price: 28000  },
  { id: 'SP-013', name: 'Bia Heineken chai 330ml',      sku: 'HNK-BIA-330',  category: 'Bia & Rượu',      quantity: 192, minStock: 60,  maxStock: 280, unit: 'Chai', location: 'F-01', backroomStock: 160, lastUpdated: '10/03/2026', status: 'Còn hàng', price: 22000  },
  { id: 'SP-014', name: 'Snack khoai tây Pringles',     sku: 'PRG-SNK-KT',   category: 'Bánh & Kẹo',      quantity: 14,  minStock: 25,  maxStock: 90,  unit: 'Hộp',  location: 'E-01', backroomStock: 110, lastUpdated: '08/03/2026', status: 'Sắp hết',  price: 65000  },
  { id: 'SP-015', name: 'Sữa chua Vinamilk 4 hũ',       sku: 'VNM-SCH-4H',   category: 'Sữa & Trứng',     quantity: 70,  minStock: 30,  maxStock: 160, unit: 'Lốc',  location: 'A-03', backroomStock: 74,  lastUpdated: '10/03/2026', status: 'Còn hàng', price: 48000  },
]

const CATEGORIES = ['Tất cả', ...Array.from(new Set(INVENTORY.map((i) => i.category)))]
const STATUS_OPTS: StockStatus[] = ['Còn hàng', 'Sắp hết', 'Hết hàng']

const statusConfig: Record<StockStatus, { icon: React.ReactNode; cls: string }> = {
  'Còn hàng': { icon: <CheckCircle size={12} />, cls: 'bg-green-50 text-green-700' },
  'Sắp hết':  { icon: <AlertTriangle size={12} />, cls: 'bg-yellow-50 text-yellow-700' },
  'Hết hàng': { icon: <XCircle size={12} />, cls: 'bg-red-50 text-red-600' },
}

const PAGE_SIZE = 8

// ─── Detail modal ─────────────────────────────────────────────────────────────
function ItemDetailModal({ item, onClose }: { item: InventoryItem; onClose: () => void }) {
  const sc = statusConfig[item.status]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-[15px] font-bold text-gray-900">Chi tiết sản phẩm</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"><X size={18} className="text-gray-500" /></button>
        </div>
        <div className="px-6 py-5 space-y-2.5 text-[13px]">
          <Row label="Tên sản phẩm" value={<span className="font-semibold text-gray-800">{item.name}</span>} />
          <Row label="SKU" value={<span className="font-mono">{item.sku}</span>} />
          <Row label="Danh mục" value={item.category} />
          <Row label="Vị trí kho" value={item.location} />
          <Row label="Đơn vị" value={item.unit} />
          <Row label="Tồn kho" value={<span className="font-bold text-gray-800">{item.quantity} {item.unit}</span>} />
          <Row label="Mức Min/Max" value={`${item.minStock} / ${item.maxStock} ${item.unit}`} />
          <Row label="Giá bán" value={<span className="font-bold text-green-600">{item.price.toLocaleString('vi-VN')} ₫</span>} />
          <Row label="Cập nhật lần cuối" value={item.lastUpdated} />
          <Row label="Trạng thái" value={
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${sc.cls}`}>
              {sc.icon} {item.status}
            </span>
          } />
        </div>
        <div className="px-6 pb-5">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-[13px] transition-colors">Đóng</button>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  )
}

function getStatusByQty(qty: number, minStock: number): StockStatus {
  if (qty <= 0) return 'Hết hàng'
  if (qty <= minStock) return 'Sắp hết'
  return 'Còn hàng'
}

function formatNowDate(): string {
  const now = new Date()
  return `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`
}

function getBackroomPreviewClass(value: number, minStock: number): string {
  if (value <= 0) return 'text-red-500'
  if (value <= Math.max(10, Math.floor(minStock / 2))) return 'text-amber-500'
  return 'text-sky-600'
}

function RefillModal({
  item,
  onClose,
  onConfirm,
}: {
  item: InventoryItem
  onClose: () => void
  onConfirm: (qty: number) => void
}) {
  const maxTransfer = Math.max(0, Math.min(item.backroomStock, item.maxStock - item.quantity))
  const suggested = maxTransfer
  const [qty, setQty] = useState(suggested)

  useEffect(() => {
    setQty(suggested)
  }, [suggested, item.id])

  const safeQty = Math.max(0, Math.min(qty, maxTransfer))
  const nextShelf = item.quantity + safeQty
  const nextBackroom = item.backroomStock - safeQty
  const nextBackroomClass = getBackroomPreviewClass(nextBackroom, item.minStock)

  return (
    <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        <div className="px-7 py-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-[30px] leading-none font-semibold text-gray-800">Refill Shelf Stock</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="px-7 py-6 space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 flex items-center gap-4">
            <span className="w-12 h-12 rounded-xl bg-green-100 text-green-700 font-bold text-xl inline-flex items-center justify-center">
              {item.name.charAt(0).toUpperCase()}
            </span>
            <div>
              <p className="text-2xl font-bold text-gray-800">{item.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="px-2 py-0.5 rounded-md bg-gray-200 text-gray-600 text-[12px] font-mono">{item.sku}</span>
                <span className="px-2 py-0.5 rounded-md bg-gray-200 text-gray-600 text-[12px]">{item.category}</span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-[12px] font-semibold tracking-wide text-gray-400 uppercase mb-3">Stock movement</p>
            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
              <div className="rounded-2xl border border-gray-200 p-4">
                <p className="text-[12px] text-gray-400">From: Backroom</p>
                <p className="text-[42px] leading-none font-bold text-green-700 mt-2">{item.backroomStock}</p>
                <p className="text-[13px] text-gray-400 mt-1">{item.unit}</p>
              </div>
              <span className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 inline-flex items-center justify-center">
                <ArrowRight size={18} />
              </span>
              <div className="rounded-2xl border border-gray-200 p-4">
                <p className="text-[12px] text-gray-400">To: Shelf Stock</p>
                <p className="text-[42px] leading-none font-bold text-orange-500 mt-2">{item.quantity}</p>
                <p className="text-[13px] text-gray-400 mt-1">Min: {item.minStock} • Max: {item.maxStock}</p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-2xl font-bold text-gray-700">Refill Quantity</p>
              <p className="text-[22px] font-semibold text-green-600">Suggested: {suggested} units</p>
            </div>
            <div className="grid grid-cols-[58px_1fr_58px] gap-3">
              <button
                onClick={() => setQty((q) => Math.max(0, q - 1))}
                className="h-14 rounded-2xl border border-gray-300 hover:bg-gray-50 text-gray-700 inline-flex items-center justify-center"
              >
                <Minus size={20} />
              </button>
              <input
                type="number"
                min={0}
                max={maxTransfer}
                value={safeQty}
                onChange={(e) => setQty(Number(e.target.value || 0))}
                className="h-14 rounded-2xl border border-gray-300 text-center text-4xl font-bold text-gray-800 outline-none focus:border-green-500"
              />
              <button
                onClick={() => setQty((q) => Math.min(maxTransfer, q + 1))}
                className="h-14 rounded-2xl border border-gray-300 hover:bg-gray-50 text-gray-700 inline-flex items-center justify-center"
              >
                <Plus size={20} />
              </button>
            </div>
            {maxTransfer === 0 ? (
              <p className="text-[13px] text-red-500 mt-2">Không thể refill: kho phụ không còn hàng hoặc kệ đã đạt mức tối đa.</p>
            ) : (
              <p className="text-[13px] text-green-600 mt-2">Mức đề xuất đã tối ưu theo tồn kho phụ và giới hạn kệ.</p>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-3">Preview after transfer</p>
            <div className="space-y-2 text-[24px]">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Shelf Stock</span>
                <span className="font-semibold text-gray-800">{item.quantity} <span className="text-gray-300 mx-2">→</span> <span className="text-green-600">{nextShelf}</span></span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Backroom Stock</span>
                <span className="font-semibold text-gray-800">{item.backroomStock} <span className="text-gray-300 mx-2">→</span> <span className={nextBackroomClass}>{nextBackroom}</span></span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-7 py-5 border-t border-gray-100 grid grid-cols-2 gap-3">
          <button onClick={onClose} className="h-12 rounded-2xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            disabled={safeQty <= 0}
            onClick={() => onConfirm(safeQty)}
            className="h-12 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Confirm Refill
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>(INVENTORY)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('Tất cả')
  const [statusFilter, setStatusFilter] = useState('Tất cả')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<InventoryItem | null>(null)
  const [refillItem, setRefillItem] = useState<InventoryItem | null>(null)

  const filtered = useMemo(() => {
    let list = items
    if (categoryFilter !== 'Tất cả') list = list.filter((i) => i.category === categoryFilter)
    if (statusFilter !== 'Tất cả') list = list.filter((i) => i.status === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((i) => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q) || i.location.toLowerCase().includes(q))
    }
    return list
  }, [items, search, categoryFilter, statusFilter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const stats = useMemo(() => ({
    total: items.length,
    inStock: items.filter((i) => i.status === 'Còn hàng').length,
    lowStock: items.filter((i) => i.status === 'Sắp hết').length,
    outOfStock: items.filter((i) => i.status === 'Hết hàng').length,
  }), [items])

  const handleConfirmRefill = (qty: number) => {
    if (!refillItem || qty <= 0) return
    setItems((prev) => prev.map((item) => {
      if (item.id !== refillItem.id) return item
      const transferCap = Math.max(0, Math.min(item.backroomStock, item.maxStock - item.quantity))
      const moveQty = Math.min(qty, transferCap)
      const nextQty = item.quantity + moveQty
      return {
        ...item,
        quantity: nextQty,
        backroomStock: item.backroomStock - moveQty,
        status: getStatusByQty(nextQty, item.minStock),
        lastUpdated: formatNowDate(),
      }
    }))
    setRefillItem(null)
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Warehouse size={20} className="text-green-600" />
            Kho hàng
          </h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Theo dõi tình trạng tồn kho cửa hàng</p>
        </div>
        <button className="flex items-center gap-2 text-[13px] font-medium text-gray-600 border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
          <RefreshCw size={14} />
          Cập nhật
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Tổng sản phẩm', value: stats.total, cls: 'text-gray-800', bg: 'bg-gray-50', icon: <Package size={18} className="text-gray-500" /> },
          { label: 'Còn hàng',       value: stats.inStock,    cls: 'text-green-700',  bg: 'bg-green-50', icon: <CheckCircle size={18} className="text-green-500" /> },
          { label: 'Sắp hết',        value: stats.lowStock,   cls: 'text-yellow-700', bg: 'bg-yellow-50', icon: <AlertTriangle size={18} className="text-yellow-500" /> },
          { label: 'Hết hàng',       value: stats.outOfStock, cls: 'text-red-600',    bg: 'bg-red-50', icon: <XCircle size={18} className="text-red-500" /> },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border border-gray-100 p-4 shadow-sm ${s.bg}`}>
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-gray-500 uppercase tracking-wide">{s.label}</p>
              {s.icon}
            </div>
            <p className={`text-2xl font-bold mt-2 ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Tìm tên sản phẩm, SKU, vị trí..."
              className="w-full pl-9 pr-3 py-2 text-[13px] bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-green-400 focus:bg-white transition-all"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {['Tất cả', ...STATUS_OPTS].map((s) => (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${statusFilter === s ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-gray-400 flex items-center gap-1"><Filter size={11} /> Danh mục:</span>
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => { setCategoryFilter(cat); setPage(1) }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${categoryFilter === cat ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Sản phẩm', 'Danh mục', 'Vị trí kệ', 'Tồn kệ', 'Min/Max', 'Trạng thái', 'Cập nhật', 'Thao tác'].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-gray-400">Không có sản phẩm</td></tr>
              ) : paged.map((item, idx) => {
                const sc = statusConfig[item.status]
                const isLow = item.quantity > 0 && item.quantity <= item.minStock
                const itemInitial = item.name.charAt(0).toUpperCase()
                return (
                  <tr key={item.id} className={`border-t border-gray-50 hover:bg-green-50/30 transition-colors ${idx % 2 === 1 ? 'bg-gray-50/20' : ''}`}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3 min-w-[240px]">
                        <span className="w-9 h-9 rounded-lg bg-green-100 text-green-700 text-[13px] font-bold inline-flex items-center justify-center">{itemInitial}</span>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 truncate">{item.name}</p>
                          <p className="text-[11px] text-gray-400 font-mono">SKU: {item.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">{item.category}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md font-mono text-[11px] font-semibold">{item.location}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-bold ${item.quantity === 0 ? 'text-red-500' : isLow ? 'text-yellow-600' : 'text-gray-800'}`}>
                        {item.quantity}
                      </span>
                      <span className="text-gray-400 ml-1 text-[11px]">{item.unit}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-[12px]">
                      <span className="font-medium">Min:</span> {item.minStock}
                      <span className="mx-1 text-gray-300">|</span>
                      <span className="font-medium">Max:</span> {item.maxStock}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${sc.cls}`}>
                        {sc.icon} {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap">{item.lastUpdated}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setRefillItem(item)}
                          className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-[11px] font-semibold transition-colors"
                        >
                          Refill
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Chỉnh sửa">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setSelected(item)} className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors" title="Xem chi tiết">
                          <Eye size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-[12px] text-gray-500">{Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length} sản phẩm</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30"><ChevronLeft size={16} /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-[12px] font-medium transition-colors ${p === page ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{p}</button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      {selected && <ItemDetailModal item={selected} onClose={() => setSelected(null)} />}
      {refillItem && (
        <RefillModal
          item={refillItem}
          onClose={() => setRefillItem(null)}
          onConfirm={handleConfirmRefill}
        />
      )}
    </div>
  )
}
