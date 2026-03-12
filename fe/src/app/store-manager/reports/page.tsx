'use client'

import { useState, useMemo } from 'react'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Download,
  Calendar,
  ChevronDown,
} from 'lucide-react'

// ─── Date helpers ─────────────────────────────────────────────────────────────
// App date: March 12, 2026 (Thursday = getDay() → 4)
const APP_TODAY = new Date(2026, 2, 12)
const VI_DOW = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

function addDays(base: Date, n: number): Date {
  const d = new Date(base.getTime())
  d.setDate(d.getDate() + n)
  return d
}
function fmtDate(d: Date) {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}
function dowOf(d: Date) { return VI_DOW[d.getDay()] }

// Deterministic pseudo-revenue from date seed
function mockRevDay(d: Date, base = 22_000_000): number {
  const s = (d.getFullYear() % 100) * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
  const r = Math.abs(Math.sin(s * 127.1 + 311.7))
  return Math.round(base * (0.62 + r * 0.46))
}
function mockRevHour(d: Date, h: number): number {
  const s = (d.getMonth() + 1) * 10000 + d.getDate() * 100 + h
  const r = Math.abs(Math.sin(s * 91.3 + 177.2))
  const peak = h >= 17 && h <= 19 ? 1.9 : h >= 11 && h <= 13 ? 1.5 : h <= 8 ? 0.25 : h >= 20 ? 0.5 : 0.85
  return Math.round(1_600_000 * peak * (0.55 + r * 0.5))
}

type Bar = { top: string; bottom: string; revenue: number; orders: number }
type FilterKey = 'Hôm nay' | 'Hôm qua' | 'Tuần này' | '7 ngày qua'
const FILTER_OPTS: FilterKey[] = ['Hôm nay', 'Hôm qua', 'Tuần này', '7 ngày qua']
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]

function getBars(f: FilterKey): Bar[] {
  const today = APP_TODAY
  const dow = today.getDay() // 4 = Thursday

  if (f === 'Hôm nay') {
    return HOURS.map((h) => {
      const rev = mockRevHour(today, h)
      return { top: `${h}h`, bottom: '', revenue: rev, orders: Math.max(1, Math.round(rev / 190000)) }
    })
  }
  if (f === 'Hôm qua') {
    const d = addDays(today, -1)
    return HOURS.map((h) => {
      const rev = mockRevHour(d, h)
      return { top: `${h}h`, bottom: '', revenue: rev, orders: Math.max(1, Math.round(rev / 190000)) }
    })
  }
  if (f === 'Tuần này') {
    const mondayOff = dow === 0 ? -6 : 1 - dow
    const mon = addDays(today, mondayOff)
    const count = dow === 0 ? 7 : dow
    return Array.from({ length: count }, (_, i) => {
      const d = addDays(mon, i)
      const rev = mockRevDay(d)
      return { top: dowOf(d), bottom: fmtDate(d), revenue: rev, orders: Math.round(rev / 190000) }
    })
  }
  // '7 ngày qua'
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(today, i - 6)
    const rev = mockRevDay(d)
    return { top: dowOf(d), bottom: fmtDate(d), revenue: rev, orders: Math.round(rev / 190000) }
  })
}

function getChartMeta(f: FilterKey): { title: string; subtitle: string } {
  const today = APP_TODAY
  switch (f) {
    case 'Hôm nay':
      return { title: 'Doanh thu hôm nay', subtitle: `${fmtDate(today)}/2026 · ${dowOf(today)}` }
    case 'Hôm qua': {
      const d = addDays(today, -1)
      return { title: 'Doanh thu hôm qua', subtitle: `${fmtDate(d)}/2026 · ${dowOf(d)}` }
    }
    case 'Tuần này': {
      const mondayOff = today.getDay() === 0 ? -6 : 1 - today.getDay()
      const mon = addDays(today, mondayOff)
      return { title: 'Doanh thu tuần này', subtitle: `${fmtDate(mon)} – ${fmtDate(today)}/2026` }
    }
    case '7 ngày qua':
      return { title: 'Doanh thu 7 ngày qua', subtitle: `${fmtDate(addDays(today, -6))} – ${fmtDate(today)}/2026` }
  }
}

// ─── Static references ────────────────────────────────────────────────────────
const TOP_PRODUCTS = [
  { rank: 1, name: 'Sữa tươi Vinamilk 1L',       category: 'Sữa & Trứng',    sold: 384, revenue: 13440000, change: +12.5 },
  { rank: 2, name: 'Gạo ST25 túi 5kg',            category: 'Gạo & Nông sản', sold: 210, revenue: 24150000, change: +8.3  },
  { rank: 3, name: 'Mì gói Hảo Hảo (thùng)',      category: 'Mì & Cháo',      sold: 175, revenue: 7000000,  change: +5.1  },
  { rank: 4, name: 'Bia Heineken chai 330ml',      category: 'Bia & Rượu',     sold: 163, revenue: 3586000,  change: -2.4  },
  { rank: 5, name: 'Trứng gà ta (vỉ 10)',         category: 'Sữa & Trứng',    sold: 148, revenue: 6216000,  change: +3.8  },
  { rank: 6, name: 'Nước ngọt Pepsi (thùng 24)', category: 'Nước uống',       sold: 132, revenue: 3168000,  change: +1.2  },
  { rank: 7, name: 'Dầu ăn Neptune 1L',           category: 'Dầu ăn',         sold: 121, revenue: 6655000,  change: -1.8  },
  { rank: 8, name: 'Snack Pringles',              category: 'Bánh & Kẹo',     sold: 98,  revenue: 6370000,  change: +7.6  },
]

const CAT_PCT  = [23.4, 18.1, 15.3, 8.9, 7.9, 7.3, 19.1]
const CAT_NAME = ['Sữa & Trứng', 'Gạo & Nông sản', 'Nước uống', 'Gia vị', 'Bánh & Kẹo', 'Mì & Cháo', 'Khác']
const CAT_CLR  = ['bg-green-500', 'bg-blue-500', 'bg-violet-500', 'bg-orange-400', 'bg-pink-400', 'bg-teal-500', 'bg-gray-400']

const KPI_CHANGE: Record<FilterKey, { rev: string; ord: string; avg: string; cust: string }> = {
  'Hôm nay':    { rev: '+3.2%',  ord: '+1.8%',  avg: '+1.4%', cust: '-1.1%' },
  'Hôm qua':    { rev: '-2.5%',  ord: '-3.0%',  avg: '+0.5%', cust: '+5.2%' },
  'Tuần này':   { rev: '+8.4%',  ord: '+7.1%',  avg: '+1.2%', cust: '+6.3%' },
  '7 ngày qua': { rev: '+11.2%', ord: '+9.4%',  avg: '+1.7%', cust: '-4.1%' },
}
const NEW_CUST: Record<FilterKey, number> = { 'Hôm nay': 12, 'Hôm qua': 15, 'Tuần này': 43, '7 ngày qua': 87 }

function fmt(n: number) { return n.toLocaleString('vi-VN') }

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [filter, setFilter]     = useState<FilterKey>('7 ngày qua')
  const [showDrop, setShowDrop] = useState(false)

  const bars      = useMemo(() => getBars(filter), [filter])
  const chartMeta = useMemo(() => getChartMeta(filter), [filter])
  const maxRev    = useMemo(() => Math.max(...bars.map((b) => b.revenue), 1), [bars])

  const totalRevenue = useMemo(() => bars.reduce((s, b) => s + b.revenue, 0), [bars])
  const totalOrders  = useMemo(() => bars.reduce((s, b) => s + b.orders, 0), [bars])
  const avgOrder     = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0
  const cashAmt      = Math.round(totalRevenue * 0.58)
  const qrAmt        = Math.round(totalRevenue * 0.42)
  const cats         = CAT_NAME.map((name, i) => ({ name, pct: CAT_PCT[i], amount: Math.round(totalRevenue * CAT_PCT[i] / 100) }))
  const kc           = KPI_CHANGE[filter]

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 size={20} className="text-green-600" />
            Doanh thu
          </h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Phân tích hiệu quả kinh doanh cửa hàng</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period dropdown (same as chart tabs, synced) */}
          <div className="relative">
            <button
              onClick={() => setShowDrop(!showDrop)}
              className="flex items-center gap-2 text-[13px] font-medium text-gray-700 border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Calendar size={14} />
              {filter}
              <ChevronDown size={14} className={`transition-transform duration-200 ${showDrop ? 'rotate-180' : ''}`} />
            </button>
            {showDrop && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-20 overflow-hidden min-w-[150px]">
                {FILTER_OPTS.map((f) => (
                  <button
                    key={f}
                    onClick={() => { setFilter(f); setShowDrop(false) }}
                    className={`w-full text-left px-4 py-2.5 text-[13px] hover:bg-gray-50 transition-colors ${
                      f === filter ? 'text-green-700 font-semibold bg-green-50' : 'text-gray-700'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="flex items-center gap-2 text-[13px] font-medium text-gray-600 border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
            <Download size={14} />
            Xuất báo cáo
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Doanh thu',       value: totalRevenue >= 1_000_000 ? `${fmt(Math.round(totalRevenue / 1_000_000))}M VND` : `${fmt(totalRevenue)} VND`, change: kc.rev,  icon: DollarSign,  color: 'green'  },
          { label: 'Tổng đơn hàng',  value: String(totalOrders),                                                                                          change: kc.ord,  icon: ShoppingCart, color: 'blue'   },
          { label: 'Giá trị đơn TB', value: `${fmt(avgOrder)} VND`,                                                                                        change: kc.avg,  icon: TrendingUp,  color: 'purple' },
          { label: 'Khách hàng mới', value: String(NEW_CUST[filter]),                                                                                      change: kc.cust, icon: Users,        color: 'orange' },
        ].map((kpi) => {
          const Icon = kpi.icon
          const up   = !kpi.change.startsWith('-')
          const colorMap: Record<string, string> = { green: 'bg-green-100 text-green-600', blue: 'bg-blue-100 text-blue-600', purple: 'bg-purple-100 text-purple-600', orange: 'bg-orange-100 text-orange-600' }
          return (
            <div key={kpi.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[kpi.color]}`}>
                  <Icon size={20} />
                </div>
                <span className={`flex items-center gap-0.5 text-[12px] font-semibold ${up ? 'text-green-600' : 'text-red-500'}`}>
                  {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {kpi.change}
                </span>
              </div>
              <p className="text-xl font-bold text-gray-900 mt-3">{kpi.value}</p>
              <p className="text-[12px] text-gray-500 mt-0.5">{kpi.label}</p>
            </div>
          )
        })}
      </div>

      {/* Revenue chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h2 className="text-[14px] font-semibold text-gray-800">{chartMeta.title}</h2>
            <p className="text-[12px] text-gray-400 mt-0.5">{chartMeta.subtitle}</p>
          </div>
          {/* Filter pill tabs inside chart */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            {FILTER_OPTS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                  filter === f ? 'bg-white text-green-700 shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Bars – no background gridlines inside bars */}
        <div className="flex items-stretch gap-1.5" style={{ height: '220px' }}>
          {bars.map((b, i) => {
            const barH = Math.round((b.revenue / maxRev) * 160)
            return (
              <div key={i} className="flex-1 flex flex-col items-center min-w-0">
                {/* Value + bar in remaining space */}
                <div className="flex-1 flex flex-col justify-end items-center w-full gap-1">
                  <span className="text-[9px] font-bold text-green-700 whitespace-nowrap leading-tight">
                    {b.revenue >= 1_000_000 ? `${(b.revenue / 1_000_000).toFixed(1)}M` : `${Math.round(b.revenue / 1000)}K`}
                  </span>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-green-600 to-green-400 hover:brightness-110 transition-all duration-200 cursor-default"
                    style={{ height: `${barH}px` }}
                    title={`${b.top}${b.bottom ? ' ' + b.bottom : ''}: ${fmt(b.revenue)} VND · ${b.orders} đơn`}
                  />
                </div>
                {/* Labels below bar */}
                {b.bottom ? (
                  <div className="pt-1.5 text-center">
                    <div className="text-[11px] font-semibold text-gray-600">{b.top}</div>
                    <div className="text-[10px] text-gray-400">{b.bottom}</div>
                  </div>
                ) : (
                  <div className="pt-1.5 text-center">
                    <div className="text-[10px] text-gray-500">{b.top}</div>
                    <div className="text-[9px] text-gray-300">{b.orders} đơn</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 2-col: payment + category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Payment methods */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-[14px] font-semibold text-gray-800 mb-1">Phương thức thanh toán</h2>
          <p className="text-[12px] text-gray-400 mb-5">Phân bổ doanh thu theo hình thức</p>
          <div className="space-y-5">
            {[
              { method: 'Tiền mặt', pct: 58, amount: cashAmt, color: 'from-green-500 to-green-400',   dot: 'bg-green-500',  light: 'bg-green-50 text-green-700' },
              { method: 'Mã QR',    pct: 42, amount: qrAmt,   color: 'from-violet-500 to-violet-400', dot: 'bg-violet-500', light: 'bg-violet-50 text-violet-700' },
            ].map((pm) => (
              <div key={pm.method}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${pm.dot}`} />
                    <span className="text-[13px] text-gray-700 font-medium">{pm.method}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${pm.light}`}>{pm.pct}%</span>
                    <span className="text-[12px] font-semibold text-gray-700 whitespace-nowrap">{fmt(pm.amount)} VND</span>
                  </div>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full bg-gradient-to-r ${pm.color} transition-all duration-500`} style={{ width: `${pm.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[12px] text-gray-500">Tổng doanh thu</span>
            <span className="text-[14px] font-bold text-green-700">{fmt(totalRevenue)} VND</span>
          </div>
        </div>

        {/* Category revenue */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-[14px] font-semibold text-gray-800 mb-1">Doanh thu theo danh mục</h2>
          <p className="text-[12px] text-gray-400 mb-5">Tỷ trọng từng nhóm hàng</p>
          <div className="space-y-3">
            {cats.map((cat, i) => (
              <div key={cat.name} className="flex items-center gap-3">
                <span className="text-[12.5px] text-gray-700 w-32 flex-shrink-0">{cat.name}</span>
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${CAT_CLR[i]} transition-all duration-500`} style={{ width: `${(cat.pct / 25) * 100}%` }} />
                </div>
                <span className="text-[12px] font-semibold text-gray-600 w-9 text-right">{cat.pct}%</span>
                <span className="text-[11px] text-gray-400 w-24 text-right whitespace-nowrap">{fmt(cat.amount)} VND</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top products table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-gray-800 flex items-center gap-2">
            <Package size={15} className="text-green-500" />
            Sản phẩm bán chạy
          </h2>
          <span className="text-[12px] text-gray-400">Top 8 trong kỳ</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['#', 'Sản phẩm', 'Danh mục', 'Đã bán', 'Doanh thu', 'Tăng trưởng'].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TOP_PRODUCTS.map((p, idx) => (
                <tr key={p.rank} className={`border-t border-gray-50 hover:bg-green-50/30 transition-colors ${idx % 2 === 1 ? 'bg-gray-50/20' : ''}`}>
                  <td className="py-3 px-4">
                    <span className={`w-6 h-6 inline-flex items-center justify-center rounded-full text-[11px] font-bold ${
                      p.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                      p.rank === 2 ? 'bg-gray-200 text-gray-600' :
                      p.rank === 3 ? 'bg-orange-100 text-orange-600' :
                      'bg-gray-50 text-gray-400'
                    }`}>{p.rank}</span>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-800">{p.name}</td>
                  <td className="py-3 px-4 text-gray-500">{p.category}</td>
                  <td className="py-3 px-4 font-semibold text-gray-700">{p.sold}</td>
                  <td className="py-3 px-4 font-semibold text-gray-800 whitespace-nowrap">{fmt(p.revenue)} VND</td>
                  <td className="py-3 px-4">
                    <span className={`flex items-center gap-1 text-[12px] font-semibold ${p.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {p.change >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                      {p.change >= 0 ? '+' : ''}{p.change}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

        </div>
        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="relative">
            <button
              onClick={() => setShowPeriod(!showPeriod)}
              className="flex items-center gap-2 text-[13px] font-medium text-gray-700 border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Calendar size={14} />
              {period}
              <ChevronDown size={14} />
            </button>
            {showPeriod && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-10 overflow-hidden min-w-[160px]">
                {PERIOD_OPTIONS.map((p) => (
                  <button
                    key={p}
                    onClick={() => { setPeriod(p); setShowPeriod(false) }}
                    className={`w-full text-left px-4 py-2.5 text-[13px] hover:bg-gray-50 transition-colors ${p === period ? 'text-green-700 font-semibold bg-green-50' : 'text-gray-700'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="flex items-center gap-2 text-[13px] font-medium text-gray-600 border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
            <Download size={14} />
            Xuất báo cáo
          </button>
        </div>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Doanh thu',       value: `${fmt(Math.round(totalRevenue / 1000000))}M ₫`, change: '+11.2%', up: true,  icon: DollarSign, color: 'green' },
          { label: 'Tổng đơn hàng',  value: String(totalOrders),   change: '+9.4%',  up: true,  icon: ShoppingCart, color: 'blue' },
          { label: 'Giá trị đơn TB', value: `${fmt(avgOrderValue)} ₫`, change: '+1.7%', up: true, icon: TrendingUp, color: 'purple' },
          { label: 'Khách hàng mới', value: '87',                  change: '-4.1%',  up: false, icon: Users, color: 'orange' },
        ].map((kpi) => {
          const Icon = kpi.icon
          const colorMap: Record<string, string> = {
            green: 'bg-green-100 text-green-600',
            blue: 'bg-blue-100 text-blue-600',
            purple: 'bg-purple-100 text-purple-600',
            orange: 'bg-orange-100 text-orange-600',
          }
          return (
            <div key={kpi.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[kpi.color]}`}>
                  <Icon size={20} />
                </div>
                <span className={`flex items-center gap-0.5 text-[12px] font-semibold ${kpi.up ? 'text-green-600' : 'text-red-500'}`}>
                  {kpi.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {kpi.change}
                </span>
              </div>
              <p className="text-xl font-bold text-gray-900 mt-3">{kpi.value}</p>
              <p className="text-[12px] text-gray-500 mt-0.5">{kpi.label}</p>
            </div>
          )
        })}
      </div>

      {/* Revenue chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-[14px] font-semibold text-gray-800">Biểu đồ doanh thu 7 ngày</h2>
            <p className="text-[12px] text-gray-400 mt-0.5">Thống kê theo ngày trong tuần qua</p>
          </div>
          <span className="flex items-center gap-1.5 text-[12px] text-gray-500">
            <span className="w-3 h-3 rounded-sm bg-green-500 inline-block" />
            Doanh thu (₫)
          </span>
        </div>
        {/* Grid + Bars */}
        <div className="relative">
          {/* Horizontal grid lines */}
          <div className="absolute left-0 right-0 top-0 bottom-10 flex flex-col justify-between pointer-events-none">
            {[0,1,2,3,4].map((i) => (
              <div key={i} className="border-t border-dashed border-gray-100 w-full" />
            ))}
          </div>
          {/* Bar columns */}
          <div className="flex items-stretch gap-2 h-64">
            {shown.map((d, i) => {
              const barPct = d.revenue / maxRevenue
              const barH   = Math.round(barPct * 170)
              return (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div className="flex-1 flex flex-col justify-end items-center w-full gap-1">
                    {/* Value label above bar */}
                    <span className="text-[10px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                      {(d.revenue / 1000000).toFixed(1)}M
                    </span>
                    {/* Bar */}
                    <div
                      className="w-full rounded-t-xl bg-gradient-to-t from-green-600 to-green-400 hover:from-green-700 hover:to-green-500 transition-all duration-200 shadow-sm"
                      style={{ height: `${barH}px` }}
                      title={`${d.day}: ${fmt(d.revenue)} ₫ · ${d.orders} đơn`}
                    />
                  </div>
                  {/* Bottom labels */}
                  <div className="pt-2 text-center">
                    <div className="text-[11px] text-gray-500 font-medium">{d.day}</div>
                    <div className="text-[10px] text-gray-300">{d.orders} đơn</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 2-col row: payment + category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Payment methods */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-[14px] font-semibold text-gray-800 mb-1">Phương thức thanh toán</h2>
          <p className="text-[12px] text-gray-400 mb-5">Tổng doanh thu kỳ này</p>
          <div className="space-y-5">
            {PAYMENT_METHODS.map((pm) => (
              <div key={pm.method}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${pm.dot}`} />
                    <span className="text-[13px] text-gray-700 font-medium">{pm.method}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${pm.light}`}>{pm.pct}%</span>
                    <span className="text-[12px] font-semibold text-gray-700">{fmt(pm.amount)} ₫</span>
                  </div>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full bg-gradient-to-r ${pm.color} transition-all`} style={{ width: `${pm.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          {/* Total */}
          <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[12px] text-gray-500">Tổng doanh thu</span>
            <span className="text-[14px] font-bold text-green-700">{fmt(PAYMENT_METHODS.reduce((s, p) => s + p.amount, 0))} ₫</span>
          </div>
        </div>

        {/* Category revenue */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-[14px] font-semibold text-gray-800 mb-1">Doanh thu theo danh mục</h2>
          <p className="text-[12px] text-gray-400 mb-5">Tỷ trọng từng nhóm hàng</p>
          <div className="space-y-3">
            {CATEGORY_REVENUE.map((cat, i) => {
              const colors = ['bg-green-500','bg-blue-500','bg-violet-500','bg-orange-400','bg-pink-400','bg-teal-500','bg-gray-400']
              return (
                <div key={cat.name} className="flex items-center gap-3">
                  <span className="text-[12.5px] text-gray-700 w-32 flex-shrink-0">{cat.name}</span>
                  <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${colors[i % colors.length]}`} style={{ width: `${(cat.pct / 25) * 100}%` }} />
                  </div>
                  <span className="text-[12px] font-semibold text-gray-600 w-9 text-right">{cat.pct}%</span>
                  <span className="text-[11px] text-gray-400 w-24 text-right whitespace-nowrap">{fmt(cat.amount)} ₫</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Top products table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-gray-800 flex items-center gap-2">
            <Package size={15} className="text-green-500" />
            Sản phẩm bán chạy
          </h2>
          <span className="text-[12px] text-gray-400">Top 8 trong kỳ</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['#', 'Sản phẩm', 'Danh mục', 'Đã bán', 'Doanh thu', 'Tăng trưởng'].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TOP_PRODUCTS.map((p, idx) => (
                <tr key={p.rank} className={`border-t border-gray-50 hover:bg-green-50/30 transition-colors ${idx % 2 === 1 ? 'bg-gray-50/20' : ''}`}>
                  <td className="py-3 px-4">
                    <span className={`w-6 h-6 inline-flex items-center justify-center rounded-full text-[11px] font-bold ${
                      p.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                      p.rank === 2 ? 'bg-gray-200 text-gray-600' :
                      p.rank === 3 ? 'bg-orange-100 text-orange-600' :
                      'bg-gray-50 text-gray-400'
                    }`}>{p.rank}</span>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-800">{p.name}</td>
                  <td className="py-3 px-4 text-gray-500">{p.category}</td>
                  <td className="py-3 px-4 font-semibold text-gray-700">{p.sold}</td>
                  <td className="py-3 px-4 font-semibold text-gray-800 whitespace-nowrap">{fmt(p.revenue)} ₫</td>
                  <td className="py-3 px-4">
                    <span className={`flex items-center gap-1 text-[12px] font-semibold ${p.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {p.change >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                      {p.change >= 0 ? '+' : ''}{p.change}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
