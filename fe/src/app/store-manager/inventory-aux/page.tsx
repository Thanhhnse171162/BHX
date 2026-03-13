'use client'

import { useState, useMemo } from 'react'
import {
  AlertTriangle,
  XCircle,
  CheckCircle,
  Clock3,
  RotateCcw,
  SlidersHorizontal,
  History,
  MapPin,
  EllipsisVertical,
  ChevronLeft,
  ChevronRight,
  Warehouse,
  PackagePlus,
  Sliders,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
type StockStatus = 'Bình thường' | 'Kệ thấp' | 'Hết hàng' | 'Cận date'

interface InventoryItem {
  id: string
  name: string
  sku: string
  category: string
  backroomStock: number
  shelfStock: number
  minimumShelfLevel: number
  unit: string
  zone: string
  lastUpdated: string
  nearExpiry: boolean
  price: number
  movementHistory: string[]
}

type RefillTaskStatus = 'REQUESTED' | 'APPROVED' | 'COMPLETED'

interface RefillTask {
  itemId: string
  quantity: number
  status: RefillTaskStatus
  createdAt: string
  completedAt?: string
}

// ─── Mock data ─────────────────────────────────────────────────────────────────
const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'PH-001', name: 'Gạo Jasmine túi 10kg',            sku: 'JAS-G-10KG',   category: 'Gạo & Nông sản',  backroomStock: 58, shelfStock: 27, minimumShelfLevel: 24, unit: 'Túi',   zone: 'KP-A1', lastUpdated: '10/03/2026', nearExpiry: false, price: 220000, movementHistory: [] },
  { id: 'PH-002', name: 'Dầu ăn Tường An 5L',              sku: 'TA-DA-5L',     category: 'Dầu ăn',          backroomStock: 18, shelfStock: 8,  minimumShelfLevel: 12, unit: 'Can',   zone: 'KP-B2', lastUpdated: '09/03/2026', nearExpiry: false, price: 135000, movementHistory: [] },
  { id: 'PH-003', name: 'Nước mắm Nam Ngư 1L',             sku: 'NN-NMM-1L',    category: 'Gia vị',          backroomStock: 42, shelfStock: 0,  minimumShelfLevel: 18, unit: 'Chai',  zone: 'KP-B1', lastUpdated: '08/03/2026', nearExpiry: false, price: 42000, movementHistory: [] },
  { id: 'PH-004', name: 'Đường tinh luyện Biên Hòa 2kg',   sku: 'BH-DG-2KG',    category: 'Gia vị',          backroomStock: 35, shelfStock: 25, minimumShelfLevel: 18, unit: 'Túi',   zone: 'KP-B3', lastUpdated: '10/03/2026', nearExpiry: true,  price: 46000, movementHistory: [] },
  { id: 'PH-005', name: 'Mì Hảo Hảo thùng 30 gói',         sku: 'HH-MG-30',     category: 'Mì & Cháo',       backroomStock: 26, shelfStock: 6,  minimumShelfLevel: 10, unit: 'Thùng', zone: 'KP-C2', lastUpdated: '09/03/2026', nearExpiry: false, price: 120000, movementHistory: [] },
  { id: 'PH-006', name: 'Muối i-ốt trắng 1kg',             sku: 'IOT-M-1KG',    category: 'Gia vị',          backroomStock: 77, shelfStock: 33, minimumShelfLevel: 20, unit: 'Gói',   zone: 'KP-B4', lastUpdated: '07/03/2026', nearExpiry: false, price: 9000, movementHistory: [] },
  { id: 'PH-007', name: 'Nước suối Aquafina 24 chai',      sku: 'AQF-NS-24',    category: 'Nước uống',       backroomStock: 15, shelfStock: 5,  minimumShelfLevel: 9,  unit: 'Thùng', zone: 'KP-D1', lastUpdated: '10/03/2026', nearExpiry: false, price: 108000, movementHistory: [] },
  { id: 'PH-008', name: 'Sữa đặc Ông Thọ (thùng 48)',      sku: 'OT-SD-48',     category: 'Sữa & Trứng',     backroomStock: 9,  shelfStock: 0,  minimumShelfLevel: 6,  unit: 'Thùng', zone: 'KP-A3', lastUpdated: '08/03/2026', nearExpiry: false, price: 1320000, movementHistory: [] },
  { id: 'PH-009', name: 'Bột giặt Omo 4.5kg',              sku: 'OMO-BG-4K5',   category: 'Vệ sinh',         backroomStock: 22, shelfStock: 11, minimumShelfLevel: 10, unit: 'Túi',   zone: 'KP-E1', lastUpdated: '06/03/2026', nearExpiry: false, price: 175000, movementHistory: [] },
  { id: 'PH-010', name: 'Nước rửa chén Sunlight 1L',       sku: 'SL-NRC-1L',    category: 'Vệ sinh',         backroomStock: 14, shelfStock: 21, minimumShelfLevel: 16, unit: 'Chai',  zone: 'KP-E2', lastUpdated: '09/03/2026', nearExpiry: false, price: 38000, movementHistory: [] },
  { id: 'PH-011', name: 'Cà phê G7 3in1 (thùng 100)',      sku: 'G7-CF-100',    category: 'Cà phê & Trà',    backroomStock: 20, shelfStock: 5,  minimumShelfLevel: 8,  unit: 'Thùng', zone: 'KP-F1', lastUpdated: '08/03/2026', nearExpiry: false, price: 420000, movementHistory: [] },
  { id: 'PH-012', name: 'Bia Sài Gòn thùng 24 chai',       sku: 'SG-BIA-24',    category: 'Bia & Rượu',      backroomStock: 30, shelfStock: 10, minimumShelfLevel: 8,  unit: 'Thùng', zone: 'KP-D2', lastUpdated: '10/03/2026', nearExpiry: false, price: 480000, movementHistory: [] },
  { id: 'PH-013', name: 'Snack Oishi tôm chua cay',        sku: 'OIS-SNK-TCC',  category: 'Bánh & Kẹo',      backroomStock: 44, shelfStock: 0,  minimumShelfLevel: 20, unit: 'Thùng', zone: 'KP-C1', lastUpdated: '07/03/2026', nearExpiry: false, price: 180000, movementHistory: [] },
  { id: 'PH-014', name: 'Dầu gội Clear Men 650ml (lốc 6)', sku: 'CLR-DG-650-6', category: 'Vệ sinh cá nhân', backroomStock: 19, shelfStock: 7,  minimumShelfLevel: 6,  unit: 'Lốc',   zone: 'KP-E3', lastUpdated: '05/03/2026', nearExpiry: true,  price: 320000, movementHistory: [] },
  { id: 'PH-015', name: 'Bánh tráng Tây Ninh 200g',        sku: 'TN-BT-200G',   category: 'Bánh & Kẹo',      backroomStock: 12, shelfStock: 9,  minimumShelfLevel: 12, unit: 'Gói',   zone: 'KP-C3', lastUpdated: '09/03/2026', nearExpiry: false, price: 18000, movementHistory: [] },
]

const CATEGORIES = ['Tất cả', ...Array.from(new Set(INITIAL_INVENTORY.map((i) => i.category)))]
const getItemStatus = (item: InventoryItem): StockStatus => {
  if (item.shelfStock === 0) return 'Hết hàng'
  if (item.nearExpiry) return 'Cận date'
  if (item.shelfStock < item.minimumShelfLevel) return 'Kệ thấp'
  return 'Bình thường'
}

const getRefillSuggestion = (item: InventoryItem) => Math.max(0, item.minimumShelfLevel - item.shelfStock)

const STATUS_OPTS: StockStatus[] = ['Bình thường', 'Kệ thấp', 'Hết hàng', 'Cận date']

const statusConfig: Record<StockStatus, { icon: React.ReactNode; cls: string }> = {
  'Bình thường': { icon: <CheckCircle size={12} />, cls: 'text-green-700' },
  'Kệ thấp':     { icon: <AlertTriangle size={12} />, cls: 'text-yellow-700' },
  'Hết hàng':    { icon: <XCircle size={12} />, cls: 'text-red-600' },
  'Cận date':    { icon: <Clock3 size={12} />, cls: 'text-orange-700' },
}

const PAGE_SIZE = 10

export default function InventoryAuxPage() {
  const [items, setItems] = useState<InventoryItem[]>(INITIAL_INVENTORY)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Tất cả')
  const [statusFilter, setStatus] = useState<string>('Tất cả')
  const [page, setPage] = useState(1)
  const [refillTasks, setRefillTasks] = useState<Record<string, RefillTask>>(() => {
    const now = new Date().toLocaleString('vi-VN', { hour12: false })
    return INITIAL_INVENTORY.reduce<Record<string, RefillTask>>((acc, item) => {
      const quantity = getRefillSuggestion(item)
      if (quantity > 0) {
        acc[item.id] = {
          itemId: item.id,
          quantity,
          status: 'REQUESTED',
          createdAt: now,
        }
      }
      return acc
    }, {})
  })
  const [adjustOpenId, setAdjustOpenId] = useState<string | null>(null)
  const [adjustDraft, setAdjustDraft] = useState<Record<string, { backroom: number; shelf: number }>>({})
  const [message, setMessage] = useState<{ type: 'success' | 'warning'; text: string } | null>(null)
  const [historyItemId, setHistoryItemId] = useState<string | null>(null)

  const today = () => new Date().toLocaleDateString('vi-VN')

  const addHistory = (item: InventoryItem, note: string) => {
    const ts = new Date().toLocaleString('vi-VN', { hour12: false })
    return [`${ts} - ${note}`, ...item.movementHistory].slice(0, 8)
  }

  const handleAcceptRefill = (itemId: string) => {
    const item = items.find((i) => i.id === itemId)
    if (!item) return

    const refillQuantity = getRefillSuggestion(item)
    if (refillQuantity <= 0) {
      setMessage({ type: 'warning', text: `${item.name} chưa cần refill.` })
      return
    }

    const now = new Date().toLocaleString('vi-VN', { hour12: false })
    setRefillTasks((prev) => ({
      ...prev,
      [itemId]: {
        itemId,
        quantity: refillQuantity,
        status: 'APPROVED',
        createdAt: now,
      },
    }))

    setItems((prev) => prev.map((entry) => {
      if (entry.id !== itemId) return entry
      return {
        ...entry,
        movementHistory: addHistory(entry, `Refill request được duyệt: ${refillQuantity} ${entry.unit} (APPROVED)`),
      }
    }))

    setMessage({ type: 'success', text: `${item.name}: đã tạo refill task ${refillQuantity} ${item.unit}.` })
  }

  const handleMoveToShelf = (itemId: string) => {
    const task = refillTasks[itemId]
    const item = items.find((i) => i.id === itemId)
    if (!task || task.status !== 'APPROVED' || !item) return

    if (item.backroomStock < task.quantity) {
      setMessage({
        type: 'warning',
        text: `${item.name}: kho phụ không đủ để chuyển ${task.quantity} ${item.unit}.`,
      })
      return
    }

    const doneAt = new Date().toLocaleString('vi-VN', { hour12: false })

    setItems((prev) => prev.map((entry) => {
      if (entry.id !== itemId) return entry
      return {
        ...entry,
        backroomStock: entry.backroomStock - task.quantity,
        shelfStock: entry.shelfStock + task.quantity,
        lastUpdated: today(),
        movementHistory: addHistory(entry, `Hoàn tất refill task: chuyển ${task.quantity} ${entry.unit} từ kho phụ ra kệ`),
      }
    }))

    setRefillTasks((prev) => ({
      ...prev,
      [itemId]: {
        ...task,
        status: 'COMPLETED',
        completedAt: doneAt,
      },
    }))

    setMessage({ type: 'success', text: `${item.name}: đã chuyển hàng ra kệ thành công.` })
  }

  const handleOpenAdjust = (item: InventoryItem) => {
    setAdjustOpenId((prev) => prev === item.id ? null : item.id)
    setAdjustDraft((prev) => ({
      ...prev,
      [item.id]: prev[item.id] ?? { backroom: item.backroomStock, shelf: item.shelfStock },
    }))
  }

  const handleAdjustStock = (itemId: string) => {
    const draft = adjustDraft[itemId]
    if (!draft) return
    if (draft.backroom < 0 || draft.shelf < 0) {
      setMessage({ type: 'warning', text: 'Tồn kho không được nhỏ hơn 0.' })
      return
    }

    setItems((prev) => prev.map((item) => {
      if (item.id !== itemId) return item
      setMessage({ type: 'success', text: `${item.name}: cập nhật tồn kho thành công.` })
      return {
        ...item,
        backroomStock: draft.backroom,
        shelfStock: draft.shelf,
        lastUpdated: today(),
        movementHistory: addHistory(item, `Điều chỉnh tồn kho: kho phụ ${draft.backroom}, kệ ${draft.shelf}`),
      }
    }))

    setAdjustOpenId(null)
  }

  const inventoryWithStatus = useMemo(
    () => items.map((item) => ({ ...item, status: getItemStatus(item), refillSuggestion: getRefillSuggestion(item) })),
    [items],
  )

  const filtered = useMemo(() => {
    let list = [...inventoryWithStatus]
    if (category !== 'Tất cả') list = list.filter((i) => i.category === category)
    if (statusFilter !== 'Tất cả') list = list.filter((i) => i.status === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (i) => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q) || i.id.toLowerCase().includes(q),
      )
    }

    // Prioritize refill operations for faster staff scanning.
    const priority: Record<StockStatus, number> = {
      'Hết hàng': 0,
      'Kệ thấp': 1,
      'Cận date': 2,
      'Bình thường': 3,
    }
    list.sort((a, b) => {
      if (priority[a.status] !== priority[b.status]) return priority[a.status] - priority[b.status]
      return b.refillSuggestion - a.refillSuggestion
    })

    return list
  }, [search, category, statusFilter, inventoryWithStatus])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const stats = useMemo(() => ({
    totalSku: inventoryWithStatus.length,
    totalStockUnits: inventoryWithStatus.reduce((sum, i) => sum + i.backroomStock + i.shelfStock, 0),
    needRefillNow: inventoryWithStatus.filter((i) => i.refillSuggestion > 0).length,
    pendingBackroomTransfer: inventoryWithStatus.filter((i) => i.refillSuggestion > 0 && i.backroomStock > 0).length,
  }), [inventoryWithStatus])

  const formatNumber = (value: number) => new Intl.NumberFormat('vi-VN').format(value)

  return (
    <div className="p-6 space-y-4 bg-[#f5f7fb] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[30px] leading-[32px] font-extrabold text-slate-900">Quản lý Kho Lưu Trữ</h1>
          <p className="text-[13px] text-slate-500">Quản lý hàng dự trữ trong kho lưu trữ trước khi chuyển ra quầy kệ.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-[13px] font-semibold hover:bg-slate-50">
            <Sliders size={14} />
            Điều chỉnh kho
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-[13px] font-semibold hover:bg-green-700">
            <PackagePlus size={14} />
            Nhập hàng
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Tổng số SKU', value: formatNumber(stats.totalSku), sub: 'Mặt hàng trong kho lưu trữ', cls: 'text-slate-900', icon: <Warehouse size={16} className="text-slate-500" /> },
          { label: 'Tổng số lượng kho', value: formatNumber(stats.totalStockUnits), sub: 'Kho phụ + kệ hiện tại', cls: 'text-slate-900', icon: <Warehouse size={16} className="text-slate-500" /> },
          { label: 'Sản phẩm sắp hết', value: formatNumber(stats.needRefillNow), sub: 'Yêu cầu bổ sung lên kệ ngay', cls: 'text-red-600', icon: <AlertTriangle size={16} className="text-red-500" /> },
          { label: 'Đang chờ bổ sung', value: formatNumber(stats.pendingBackroomTransfer), sub: 'Yêu cầu nhập từ tổng kho', cls: 'text-amber-600', icon: <PackagePlus size={16} className="text-amber-500" /> },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-[12px] text-slate-500 font-semibold">{s.label}</p>
              <span>{s.icon}</span>
            </div>
            <p className={`text-[34px] leading-[36px] font-extrabold mt-1 ${s.cls}`}>{s.value}</p>
            <p className="text-[11px] text-slate-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide">
              Danh mục
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(1) }}
                className="block mt-1 min-w-[180px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-700 outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide">
              Trạng thái
              <select
                value={statusFilter}
                onChange={(e) => { setStatus(e.target.value); setPage(1) }}
                className="block mt-1 min-w-[170px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-700 outline-none"
              >
                {['Tất cả', ...STATUS_OPTS].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide">
              Tìm kiếm
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="Tên sản phẩm hoặc SKU"
                className="block mt-1 min-w-[240px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-700 outline-none"
              />
            </label>
          </div>
          <p className="text-[12px] text-slate-500">Đang hiển thị {Math.min(filtered.length, PAGE_SIZE)} trong tổng số {filtered.length} sản phẩm</p>
        </div>
      </div>

      {message && (
        <div className={`rounded-xl border px-4 py-3 text-[13px] ${message.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
          {message.text}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Sản phẩm', 'Danh mục', 'Kho lưu trữ', 'Vị trí kệ', 'Mức tối thiểu', 'Trạng thái', 'Cập nhật lần cuối', 'Thao tác'].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400 text-[13px]">
                    Không tìm thấy sản phẩm nào
                  </td>
                </tr>
              ) : (
                paged.map((item, idx) => {
                  const sc = statusConfig[item.status]
                  const taskStatus = refillTasks[item.id]?.status
                  const refillTaskStatus: RefillTaskStatus | null = taskStatus ?? (item.refillSuggestion > 0 ? 'REQUESTED' : null)
                  const canAcceptRefill = refillTaskStatus === 'REQUESTED'
                  const canMoveToShelf = refillTaskStatus === 'APPROVED'
                  return (
                    <tr
                      key={item.id}
                      className={`border-t border-slate-100 hover:bg-slate-50/60 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/20' : ''}`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3 min-w-[280px]">
                          <div className="w-9 h-9 rounded-md border border-slate-200 bg-gradient-to-b from-slate-100 to-slate-200" />
                          <div>
                            <div className="font-semibold text-slate-800">{item.name}</div>
                            <div className="text-[11px] text-slate-400">SKU: {item.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-[12px]">{item.category}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">{formatNumber(item.backroomStock)}</span>
                        <span className="text-slate-400 text-[11px] ml-1">{item.unit}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                          <MapPin size={12} />
                          {item.zone}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-[12px] text-slate-700 font-semibold">
                          {item.minimumShelfLevel} {item.unit}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Kệ hiện tại: {item.shelfStock}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-semibold ${
                          item.status === 'Bình thường' ? 'bg-green-100 text-green-700'
                          : item.status === 'Kệ thấp' ? 'bg-yellow-100 text-yellow-700'
                          : item.status === 'Hết hàng' ? 'bg-red-100 text-red-600'
                          : 'bg-orange-100 text-orange-700'
                        }`}>
                          {sc.icon} {item.status}
                        </span>
                        {item.refillSuggestion > 0 && refillTaskStatus !== 'COMPLETED' && (
                          <div className="text-[11px] text-green-700 font-semibold mt-1">Cần refill +{item.refillSuggestion}</div>
                        )}
                        {refillTaskStatus === 'REQUESTED' && (
                          <div className="text-[11px] text-amber-700 font-semibold mt-1">Refill requested</div>
                        )}
                        {refillTaskStatus === 'APPROVED' && (
                          <div className="text-[11px] text-indigo-700 font-semibold mt-1">Refill approved</div>
                        )}
                        {refillTaskStatus === 'COMPLETED' && (
                          <div className="text-[11px] text-slate-500 font-semibold mt-1">Refill completed</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[12px] text-slate-500 whitespace-nowrap">{item.lastUpdated}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 min-w-[240px]">
                          {canAcceptRefill && (
                            <button
                              onClick={() => handleAcceptRefill(item.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-600 text-white text-[11px] font-semibold hover:bg-green-700 transition-colors"
                            >
                              <RotateCcw size={12} />
                              Chấp nhận refill
                            </button>
                          )}
                          {canMoveToShelf && (
                            <button
                              onClick={() => handleMoveToShelf(item.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 text-[11px] font-semibold hover:bg-indigo-100 transition-colors"
                            >
                              Chuyển ra kệ
                            </button>
                          )}
                          <details className="relative">
                            <summary className="list-none cursor-pointer inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                              <EllipsisVertical size={14} />
                            </summary>
                            <div className="absolute right-0 top-9 z-20 w-44 rounded-lg border border-slate-200 bg-white shadow-lg py-1">
                              <button
                                onClick={() => handleOpenAdjust(item)}
                                className="w-full px-3 py-2 text-left text-[12px] text-slate-700 hover:bg-slate-50 inline-flex items-center gap-2"
                              >
                                <SlidersHorizontal size={12} />
                                Adjust stock
                              </button>
                              <button
                                onClick={() => setHistoryItemId(item.id)}
                                className="w-full px-3 py-2 text-left text-[12px] text-slate-700 hover:bg-slate-50 inline-flex items-center gap-2"
                              >
                                <History size={12} />
                                View movement history
                              </button>
                            </div>
                          </details>
                        </div>

                        {adjustOpenId === item.id && (
                          <div className="mt-2 p-2 rounded-lg border border-gray-200 bg-gray-50/70 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <label className="text-[11px] text-gray-600">
                                Kho phụ
                                <input
                                  type="number"
                                  min={0}
                                  value={adjustDraft[item.id]?.backroom ?? item.backroomStock}
                                  onChange={(e) => {
                                    const parsed = Number(e.target.value)
                                    setAdjustDraft((prev) => ({
                                      ...prev,
                                      [item.id]: {
                                        backroom: Number.isFinite(parsed) ? Math.max(0, parsed) : 0,
                                        shelf: prev[item.id]?.shelf ?? item.shelfStock,
                                      },
                                    }))
                                  }}
                                  className="mt-1 w-full px-2 py-1 rounded-md border border-gray-200 text-[12px]"
                                />
                              </label>
                              <label className="text-[11px] text-gray-600">
                                Kệ
                                <input
                                  type="number"
                                  min={0}
                                  value={adjustDraft[item.id]?.shelf ?? item.shelfStock}
                                  onChange={(e) => {
                                    const parsed = Number(e.target.value)
                                    setAdjustDraft((prev) => ({
                                      ...prev,
                                      [item.id]: {
                                        backroom: prev[item.id]?.backroom ?? item.backroomStock,
                                        shelf: Number.isFinite(parsed) ? Math.max(0, parsed) : 0,
                                      },
                                    }))
                                  }}
                                  className="mt-1 w-full px-2 py-1 rounded-md border border-gray-200 text-[12px]"
                                />
                              </label>
                            </div>
                            <div className="flex justify-end">
                              <button
                                onClick={() => handleAdjustStock(item.id)}
                                className="px-2.5 py-1 rounded-md bg-gray-900 text-white text-[11px] font-semibold hover:bg-black"
                              >
                                Lưu điều chỉnh
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
          <p className="text-[12px] text-slate-500">
            Hiển thị {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length} sản phẩm
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-[12px] font-medium transition-colors ${
                  p === page ? 'bg-green-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {historyItemId && (
        <div className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">Lịch sử chuyển hàng</h3>
              <button
                onClick={() => setHistoryItemId(null)}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Đóng
              </button>
            </div>
            <div className="p-4 space-y-2 max-h-[360px] overflow-y-auto">
              {(items.find((i) => i.id === historyItemId)?.movementHistory ?? []).length === 0 ? (
                <p className="text-[13px] text-gray-500">Chưa có lịch sử chuyển hàng.</p>
              ) : (
                (items.find((i) => i.id === historyItemId)?.movementHistory ?? []).map((log, idx) => (
                  <div key={`${log}-${idx}`} className="text-[12px] text-gray-700 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
