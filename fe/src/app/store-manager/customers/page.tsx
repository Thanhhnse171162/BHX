'use client'

import { useState, useMemo } from 'react'
import {
  Search,
  Users,
  Eye,
  ChevronLeft,
  ChevronRight,
  Star,
  Phone,
  Mail,
  Gift,
  ShoppingBag,
  X,
  Crown,
  UserCheck,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
type MemberTier = 'Bạch kim' | 'Vàng' | 'Bạc' | 'Đồng'
type SortKey = 'default' | 'spent_desc' | 'spent_asc' | 'points_desc'

interface Customer {
  id: string
  name: string
  phone: string
  email: string
  tier: MemberTier
  points: number
  totalOrders: number
  totalSpent: number
  lastVisit: string
  joinedDate: string
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const ALL_CUSTOMERS: Customer[] = [
  { id: 'KH-001', name: 'Nguyễn Thị Lan Anh',   phone: '0912 345 678', email: 'lananh@gmail.com',   tier: 'Bạch kim', points: 4520, totalOrders: 68,  totalSpent: 12500000, lastVisit: '10/03/2026', joinedDate: '05/01/2023' },
  { id: 'KH-002', name: 'Trần Văn Hùng',         phone: '0987 654 321', email: 'tvhung@gmail.com',    tier: 'Vàng',     points: 1850, totalOrders: 34,  totalSpent: 5200000,  lastVisit: '10/03/2026', joinedDate: '12/03/2023' },
  { id: 'KH-003', name: 'Lê Thị Hoa',            phone: '0909 111 222', email: 'lethihoa@gmail.com',  tier: 'Vàng',     points: 2310, totalOrders: 45,  totalSpent: 7800000,  lastVisit: '09/03/2026', joinedDate: '20/06/2022' },
  { id: 'KH-004', name: 'Phạm Quốc Tuấn',        phone: '0933 456 789', email: 'pqtuan@gmail.com',   tier: 'Bạc',      points: 640,  totalOrders: 12,  totalSpent: 1850000,  lastVisit: '08/03/2026', joinedDate: '14/09/2024' },
  { id: 'KH-005', name: 'Hoàng Minh Đức',        phone: '0976 234 567', email: 'hmduc@gmail.com',    tier: 'Đồng',     points: 210,  totalOrders: 5,   totalSpent: 620000,   lastVisit: '07/03/2026', joinedDate: '03/01/2026' },
  { id: 'KH-006', name: 'Võ Thị Thu Thảo',       phone: '0901 987 654', email: 'vttthao@gmail.com',  tier: 'Bạch kim', points: 5100, totalOrders: 82,  totalSpent: 18900000, lastVisit: '10/03/2026', joinedDate: '18/04/2021' },
  { id: 'KH-007', name: 'Bùi Thanh Nam',         phone: '0944 321 098', email: 'btnam@gmail.com',    tier: 'Bạc',      points: 890,  totalOrders: 19,  totalSpent: 2700000,  lastVisit: '06/03/2026', joinedDate: '22/11/2023' },
  { id: 'KH-008', name: 'Đinh Thị Kiều My',      phone: '0918 765 432', email: 'dtkmy@gmail.com',    tier: 'Vàng',     points: 1670, totalOrders: 31,  totalSpent: 4900000,  lastVisit: '05/03/2026', joinedDate: '07/07/2022' },
  { id: 'KH-009', name: 'Lý Văn Phát',           phone: '0962 543 210', email: 'lvphat@gmail.com',   tier: 'Đồng',     points: 120,  totalOrders: 3,   totalSpent: 340000,   lastVisit: '04/03/2026', joinedDate: '11/02/2026' },
  { id: 'KH-010', name: 'Hồ Thị Ngọc Bích',     phone: '0905 876 543', email: 'htnbich@gmail.com',  tier: 'Vàng',     points: 2800, totalOrders: 52,  totalSpent: 9300000,  lastVisit: '10/03/2026', joinedDate: '30/08/2021' },
  { id: 'KH-011', name: 'Trương Minh Khải',      phone: '0981 234 567', email: 'tmkhai@gmail.com',   tier: 'Bạc',      points: 570,  totalOrders: 10,  totalSpent: 1520000,  lastVisit: '09/03/2026', joinedDate: '16/05/2024' },
  { id: 'KH-012', name: 'Phan Thị Mai Liên',     phone: '0928 765 432', email: 'ptmlien@gmail.com',  tier: 'Đồng',     points: 380,  totalOrders: 8,   totalSpent: 950000,   lastVisit: '03/03/2026', joinedDate: '25/10/2025' },
]

const TIERS: MemberTier[] = ['Bạch kim', 'Vàng', 'Bạc', 'Đồng']

const tierConfig: Record<MemberTier, { cls: string; icon: React.ReactNode }> = {
  'Bạch kim': { cls: 'bg-purple-100 text-purple-700', icon: <Crown size={11} /> },
  'Vàng':     { cls: 'bg-yellow-100 text-yellow-700', icon: <Star size={11} /> },
  'Bạc':      { cls: 'bg-gray-200 text-gray-700',     icon: <UserCheck size={11} /> },
  'Đồng':     { cls: 'bg-orange-100 text-orange-600', icon: <UserCheck size={11} /> },
}

const PAGE_SIZE = 8

// ─── Detail modal ─────────────────────────────────────────────────────────────
function CustomerDetailModal({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const tc = tierConfig[customer.tier]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-[15px] font-bold text-gray-900">Thông tin khách hàng</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        <div className="px-6 py-5">
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xl font-bold">
              {customer.name.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-[15px]">{customer.name}</p>
              <p className="text-[12px] text-gray-500">{customer.id}</p>
              <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${tc.cls}`}>
                {tc.icon} {customer.tier}
              </span>
            </div>
          </div>
          <div className="space-y-2.5 text-[13px]">
            <Row label={<><Phone size={12} /> SĐT</>}      value={customer.phone} />
            <Row label={<><Mail size={12} /> Email</>}     value={customer.email} />
            <Row label={<><Gift size={12} /> Điểm tích lũy</>} value={<span className="font-bold text-green-600">{customer.points.toLocaleString()} điểm</span>} />
            <Row label={<><ShoppingBag size={12} /> Tổng đơn</>} value={`${customer.totalOrders} đơn`} />
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="text-gray-500 font-medium">Tổng chi tiêu</span>
              <span className="font-bold text-lg text-gray-800">{customer.totalSpent.toLocaleString('vi-VN')} ₫</span>
            </div>
            <Row label="Lần ghé gần nhất" value={customer.lastVisit} />
            <Row label="Ngày đăng ký" value={customer.joinedDate} />
          </div>
        </div>
        <div className="px-6 pb-5">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-[13px] transition-colors">
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5 text-gray-500">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CustomersPage() {
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState<string>('Tất cả')
  const [sortKey, setSortKey] = useState<SortKey>('default')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Customer | null>(null)

  const SORT_OPTIONS: { key: SortKey; label: string; icon: React.ReactNode }[] = [
    { key: 'default',    label: 'Mặc định',          icon: <ArrowUpDown size={12} /> },
    { key: 'spent_desc', label: 'Chi tiêu cao nhất',  icon: <TrendingUp size={12} /> },
    { key: 'spent_asc',  label: 'Chi tiêu thấp nhất', icon: <TrendingDown size={12} /> },
    { key: 'points_desc',label: 'Điểm thưởng',        icon: <Star size={12} /> },
  ]

  const filtered = useMemo(() => {
    let list = ALL_CUSTOMERS
    if (tierFilter !== 'Tất cả') list = list.filter((c) => c.tier === tierFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q),
      )
    }
    // Sort
    const sorted = [...list]
    if (sortKey === 'spent_desc')  sorted.sort((a, b) => b.totalSpent - a.totalSpent)
    if (sortKey === 'spent_asc')   sorted.sort((a, b) => a.totalSpent - b.totalSpent)
    if (sortKey === 'points_desc') sorted.sort((a, b) => b.points - a.points)
    return sorted
  }, [search, tierFilter, sortKey])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const stats = useMemo(() => ({
    total: ALL_CUSTOMERS.length,
    platinum: ALL_CUSTOMERS.filter((c) => c.tier === 'Bạch kim').length,
    gold: ALL_CUSTOMERS.filter((c) => c.tier === 'Vàng').length,
    newThisMonth: 3,
  }), [])

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Users size={20} className="text-green-600" />
          Khách hàng
        </h1>
        <p className="text-[13px] text-gray-500 mt-0.5">Quản lý thông tin và chương trình tích điểm khách hàng</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Tổng khách hàng', value: stats.total,       cls: 'text-gray-800',   accent: 'bg-gray-50',   border: 'border-gray-200' },
          { label: 'Bạch kim',        value: stats.platinum,    cls: 'text-purple-700', accent: 'bg-purple-50', border: 'border-purple-100' },
          { label: 'Vàng',            value: stats.gold,        cls: 'text-yellow-600', accent: 'bg-yellow-50', border: 'border-yellow-100' },
          { label: 'Mới tháng này',   value: stats.newThisMonth,cls: 'text-green-600',  accent: 'bg-green-50',  border: 'border-green-100' },
        ].map((s) => (
          <div key={s.label} className={`${s.accent} rounded-xl border ${s.border} p-4 shadow-sm`}>
            <p className="text-[11px] text-gray-500 uppercase tracking-wide font-semibold">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters + Sort */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Tìm tên, SĐT, email, mã KH..."
            className="w-full pl-9 pr-4 py-2.5 text-[13px] bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-green-400 focus:bg-white transition-all"
          />
        </div>

        {/* Tier filter + Sort */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Tier filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mr-1">Hạng:</span>
            {['Tất cả', ...TIERS].map((t) => (
              <button
                key={t}
                onClick={() => { setTierFilter(t); setPage(1) }}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${
                  tierFilter === t ? 'bg-green-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mr-1">Sắp xếp:</span>
            {SORT_OPTIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => { setSortKey(s.key); setPage(1) }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${
                  sortKey === s.key ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s.icon}
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden max-w-[1200px]">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide w-[260px]">Khách hàng</th>
                <th className="text-right py-2.5 px-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide w-[140px]">Chi tiêu</th>
                <th className="text-right py-2.5 px-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide w-[120px]">Điểm</th>
                <th className="text-right py-2.5 px-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide w-[100px]">Tổng đơn</th>
                <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide w-[200px]">Liên hệ</th>
                <th className="text-center py-2.5 px-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide w-[120px]">Lần ghé cuối</th>
                <th className="py-2.5 px-3 w-[60px]"></th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-400 text-[13px]">
                    Không tìm thấy khách hàng
                  </td>
                </tr>
              ) : (
                paged.map((c, idx) => {
                  return (
                    <tr key={c.id} className={`border-t border-gray-50 hover:bg-green-50/40 transition-colors ${idx % 2 === 1 ? 'bg-gray-50/40' : ''}`}>
                      {/* Khách hàng */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold flex-shrink-0">
                            {c.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-800 truncate text-[13px]">{c.name}</div>
                            <div className="text-[11px] text-gray-400">{c.id}</div>
                          </div>
                        </div>
                      </td>

                      {/* Chi tiêu */}
                      <td className="py-2.5 px-3 text-right">
                        <span className="font-semibold text-gray-800 whitespace-nowrap text-[13px]">
                          {c.totalSpent.toLocaleString('vi-VN')} ₫
                        </span>
                      </td>

                      {/* Điểm */}
                      <td className="py-2.5 px-3 text-right">
                        <span className="font-semibold text-green-600 text-[13px]">{c.points.toLocaleString()}</span>
                      </td>

                      {/* Tổng đơn */}
                      <td className="py-2.5 px-3 text-right text-gray-600 font-medium text-[13px]">{c.totalOrders}</td>

                      {/* Liên hệ */}
                      <td className="py-2.5 px-3">
                        <div className="text-gray-700 font-medium text-[13px]">{c.phone}</div>
                        <div className="text-[11px] text-gray-400">{c.email}</div>
                      </td>

                      {/* Lần ghé cuối */}
                      <td className="py-2.5 px-3 text-center text-gray-500 text-[13px]">{c.lastVisit}</td>

                      {/* Action */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => setSelected(c)}
                          className="p-1 rounded-lg hover:bg-green-100 text-gray-400 hover:text-green-600 transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100">
          <p className="text-[12px] text-gray-500">
            Hiển thị <span className="font-semibold text-gray-700">{Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)}</span> / {filtered.length} khách hàng
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
                className={`w-7 h-7 rounded-lg text-[12px] font-semibold transition-colors ${
                  p === page ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'
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

      {selected && <CustomerDetailModal customer={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
