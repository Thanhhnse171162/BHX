'use client'

import { useState, useMemo } from 'react'
import {
  Search,
  AlertTriangle,
  XCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Warehouse,
  Filter,
  ArrowUpDown,
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
  unit: string
  zone: string
  lastUpdated: string
  status: StockStatus
  price: number
}

// ─── Mock data ─────────────────────────────────────────────────────────────────
const INVENTORY: InventoryItem[] = [
  { id: 'PH-001', name: 'Gạo Jasmine túi 10kg',           sku: 'JAS-G-10KG',   category: 'Gạo & Nông sản',  quantity: 85,  minStock: 30,  unit: 'Túi',  zone: 'KP-A1', lastUpdated: '10/03/2026', status: 'Còn hàng', price: 220000 },
  { id: 'PH-002', name: 'Dầu ăn Tường An 5L',             sku: 'TA-DA-5L',     category: 'Dầu ăn',          quantity: 12,  minStock: 20,  unit: 'Can',  zone: 'KP-B2', lastUpdated: '09/03/2026', status: 'Sắp hết',  price: 135000 },
  { id: 'PH-003', name: 'Nước mắm Nam Ngư 1L',            sku: 'NN-NMM-1L',    category: 'Gia vị',          quantity: 0,   minStock: 40,  unit: 'Chai', zone: 'KP-B1', lastUpdated: '08/03/2026', status: 'Hết hàng', price: 42000  },
  { id: 'PH-004', name: 'Đường tinh luyện Biên Hòa 2kg',  sku: 'BH-DG-2KG',   category: 'Gia vị',          quantity: 60,  minStock: 25,  unit: 'Túi',  zone: 'KP-B3', lastUpdated: '10/03/2026', status: 'Còn hàng', price: 46000  },
  { id: 'PH-005', name: 'Mì Hảo Hảo thùng 30 gói',       sku: 'HH-MG-30',     category: 'Mì & Cháo',       quantity: 8,   minStock: 15,  unit: 'Thùng',zone: 'KP-C2', lastUpdated: '09/03/2026', status: 'Sắp hết',  price: 120000 },
  { id: 'PH-006', name: 'Muối i-ốt trắng 1kg',            sku: 'IOT-M-1KG',    category: 'Gia vị',          quantity: 110, minStock: 30,  unit: 'Gói',  zone: 'KP-B4', lastUpdated: '07/03/2026', status: 'Còn hàng', price: 9000   },
  { id: 'PH-007', name: 'Nước suối Aquafina 24 chai',      sku: 'AQF-NS-24',    category: 'Nước uống',        quantity: 5,   minStock: 20,  unit: 'Thùng',zone: 'KP-D1', lastUpdated: '10/03/2026', status: 'Sắp hết',  price: 108000 },
  { id: 'PH-008', name: 'Sữa đặc Ông Thọ (thùng 48)',     sku: 'OT-SD-48',     category: 'Sữa & Trứng',     quantity: 0,   minStock: 10,  unit: 'Thùng',zone: 'KP-A3', lastUpdated: '08/03/2026', status: 'Hết hàng', price: 1320000},
  { id: 'PH-009', name: 'Bột giặt Omo 4.5kg',             sku: 'OMO-BG-4K5',   category: 'Vệ sinh',         quantity: 28,  minStock: 10,  unit: 'Túi',  zone: 'KP-E1', lastUpdated: '06/03/2026', status: 'Còn hàng', price: 175000 },
  { id: 'PH-010', name: 'Nước rửa chén Sunlight 1L',      sku: 'SL-NRC-1L',    category: 'Vệ sinh',         quantity: 35,  minStock: 20,  unit: 'Chai', zone: 'KP-E2', lastUpdated: '09/03/2026', status: 'Còn hàng', price: 38000  },
  { id: 'PH-011', name: 'Cà phê G7 3in1 (thùng 100)',     sku: 'G7-CF-100',    category: 'Cà phê & Trà',    quantity: 9,   minStock: 15,  unit: 'Thùng',zone: 'KP-F1', lastUpdated: '08/03/2026', status: 'Sắp hết',  price: 420000 },
  { id: 'PH-012', name: 'Bia Sài Gòn thùng 24 chai',      sku: 'SG-BIA-24',    category: 'Bia & Rượu',      quantity: 40,  minStock: 12,  unit: 'Thùng',zone: 'KP-D2', lastUpdated: '10/03/2026', status: 'Còn hàng', price: 480000 },
  { id: 'PH-013', name: 'Snack Oishi tôm chua cay',       sku: 'OIS-SNK-TCC',  category: 'Bánh & Kẹo',      quantity: 0,   minStock: 30,  unit: 'Thùng',zone: 'KP-C1', lastUpdated: '07/03/2026', status: 'Hết hàng', price: 180000 },
  { id: 'PH-014', name: 'Dầu gội Clear Men 650ml (lốc 6)',sku: 'CLR-DG-650-6', category: 'Vệ sinh cá nhân', quantity: 15,  minStock: 8,   unit: 'Lốc',  zone: 'KP-E3', lastUpdated: '05/03/2026', status: 'Còn hàng', price: 320000 },
  { id: 'PH-015', name: 'Bánh tráng Tây Ninh 200g',       sku: 'TN-BT-200G',   category: 'Bánh & Kẹo',      quantity: 18,  minStock: 25,  unit: 'Gói',  zone: 'KP-C3', lastUpdated: '09/03/2026', status: 'Sắp hết',  price: 18000  },
]

const CATEGORIES = ['Tất cả', ...Array.from(new Set(INVENTORY.map((i) => i.category)))]
const STATUS_OPTS: StockStatus[] = ['Còn hàng', 'Sắp hết', 'Hết hàng']

const statusConfig: Record<StockStatus, { icon: React.ReactNode; cls: string }> = {
  'Còn hàng': { icon: <CheckCircle size={12} />, cls: 'bg-green-50 text-green-700' },
  'Sắp hết':  { icon: <AlertTriangle size={12} />, cls: 'bg-yellow-50 text-yellow-700' },
  'Hết hàng': { icon: <XCircle size={12} />, cls: 'bg-red-50 text-red-600' },
}

const PAGE_SIZE = 10

export default function InventoryAuxPage() {
  const [search, setSearch]         = useState('')
  const [category, setCategory]     = useState('Tất cả')
  const [statusFilter, setStatus]   = useState<string>('Tất cả')
  const [page, setPage]             = useState(1)

  const filtered = useMemo(() => {
    let list = INVENTORY
    if (category !== 'Tất cả') list = list.filter((i) => i.category === category)
    if (statusFilter !== 'Tất cả') list = list.filter((i) => i.status === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (i) => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q) || i.id.toLowerCase().includes(q),
      )
    }
    return list
  }, [search, category, statusFilter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const stats = useMemo(() => ({
    total:    INVENTORY.length,
    ok:       INVENTORY.filter((i) => i.status === 'Còn hàng').length,
    low:      INVENTORY.filter((i) => i.status === 'Sắp hết').length,
    out:      INVENTORY.filter((i) => i.status === 'Hết hàng').length,
  }), [])

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Warehouse size={20} className="text-indigo-600" />
            Tồn kho kho phụ
          </h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Quản lý hàng hóa dự trữ tại kho phụ</p>
        </div>
        <button className="flex items-center gap-2 text-[13px] font-medium text-gray-600 border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
          <ArrowUpDown size={15} />
          Xuất báo cáo
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Tổng mặt hàng', value: stats.total, cls: 'text-gray-800' },
          { label: 'Còn hàng',      value: stats.ok,    cls: 'text-green-700' },
          { label: 'Sắp hết',       value: stats.low,   cls: 'text-yellow-600' },
          { label: 'Hết hàng',      value: stats.out,   cls: 'text-red-500' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-[11px] text-gray-500 uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Tìm theo tên, mã SKU..."
              className="w-full pl-9 pr-3 py-2 text-[13px] bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-400 focus:bg-white transition-all"
            />
          </div>
          {/* Status filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {['Tất cả', ...STATUS_OPTS].map((s) => (
              <button
                key={s}
                onClick={() => { setStatus(s); setPage(1) }}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
                  statusFilter === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        {/* Category filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={13} className="text-gray-400" />
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => { setCategory(c); setPage(1) }}
              className={`px-3 py-1 rounded-lg text-[12px] font-medium transition-colors ${
                category === c ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {c}
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
                {['Mã SP', 'Tên sản phẩm', 'Danh mục', 'Tồn kho', 'Tối thiểu', 'Vị trí', 'Cập nhật', 'Trạng thái'].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
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
                  return (
                    <tr
                      key={item.id}
                      className={`border-t border-gray-50 hover:bg-indigo-50/20 transition-colors ${idx % 2 === 1 ? 'bg-gray-50/20' : ''}`}
                    >
                      <td className="py-3 px-4 font-mono text-[12px] font-semibold text-gray-600">{item.id}</td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-800">{item.name}</div>
                        <div className="text-[11px] text-gray-400">{item.sku}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[11px] font-medium">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-semibold ${item.quantity === 0 ? 'text-red-500' : item.quantity <= item.minStock ? 'text-yellow-600' : 'text-gray-800'}`}>
                          {item.quantity}
                        </span>
                        <span className="text-gray-400 text-[11px] ml-1">{item.unit}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{item.minStock} {item.unit}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-semibold font-mono">
                          {item.zone}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500 whitespace-nowrap">{item.lastUpdated}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${sc.cls}`}>
                          {sc.icon} {item.status}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-[12px] text-gray-500">
            Hiển thị {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length} sản phẩm
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-[12px] font-medium transition-colors ${
                  p === page ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
