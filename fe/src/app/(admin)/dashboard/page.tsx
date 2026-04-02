'use client'

import { useState, useRef, useEffect } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type TabKey = 'ngay' | 'hom_qua' | 'tuan'

interface Store {
  rank: number
  name: string
  loc: string
  rev: string
  revNum: number
}

interface ProductStore {
  s: string
  q: string
  r: string
  ok: boolean
}

interface Product {
  icon: string
  name: string
  cat: string
  rev: string
  qty: string
  detail: {
    growth: string
    stores: ProductStore[]
  }
}

// Dữ liệu thực tế sẽ được fetch từ API
const ALL_STORES: Store[] = []
const PRODUCTS: Product[] = []

const DATA_BY_TAB: Record<TabKey, number[]> = {
  ngay:    [],
  hom_qua: [],
  tuan:    [],
}
const DAY_LABELS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN']

const PRIMARY     = '#1a6b3a'
const PRIMARY_MID = '#2d9e5f'
const BAR_DEFAULT = '#b6dfc6'

// ─── Excel (CSV) export ───────────────────────────────────────────────────────

function exportToExcel(storeName: string, dateRange: string, stores: Store[], products: Product[]) {
  const rows: string[][] = [
    ['Báo cáo doanh thu cửa hàng'],
    [`Cửa hàng: ${storeName}`],
    [`Thời gian: ${dateRange}`],
    [],
    ['STT', 'Cửa hàng', 'Khu vực', 'Doanh thu'],
    ...stores.map(s => [String(s.rank), s.name, s.loc, s.rev]),
    [],
    ['Sản phẩm đóng góp cao'],
    ['Sản phẩm', 'Danh mục', 'Doanh số', 'Số lượng', 'Tăng trưởng'],
    ...products.map(p => [p.name, p.cat, p.rev, p.qty, p.detail.growth]),
  ]
  const csv  = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `bao-cao-doanh-thu-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Bar Chart (no Y-axis column) ────────────────────────────────────────────

function BarChart({ data }: { data: number[] }) {
  const max    = Math.max(...data)
  const chartH = 200
  const barW   = 36
  const gap    = 16
  const padL   = 6
  const padB   = 30
  const padT   = 24
  const totalW = padL + data.length * (barW + gap) - gap + 8

  return (
    <svg width="100%" viewBox={`0 0 ${totalW} ${chartH + padB + padT}`} style={{ overflow: 'visible' }}>
      {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
        <line
          key={ratio}
          x1={padL} y1={padT + chartH - ratio * chartH}
          x2={totalW} y2={padT + chartH - ratio * chartH}
          stroke="#f0f0f0" strokeWidth="1"
        />
      ))}
      {data.map((val, i) => {
        const barH     = (val / max) * chartH
        const x        = padL + i * (barW + gap)
        const y        = padT + chartH - barH
        const isLast   = i === data.length - 1
        const isMax    = val === max
        const fill     = isLast ? PRIMARY : isMax ? PRIMARY_MID : BAR_DEFAULT
        const lblColor = isLast || isMax ? PRIMARY : '#9ca3af'
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} fill={fill} rx="5" />
            <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize="10" fill={lblColor} fontWeight="500">
              {val >= 1000 ? `${(val / 1000).toFixed(1)}B` : `${val}M`}
            </text>
            <text
              x={x + barW / 2} y={chartH + padT + padB - 8}
              textAnchor="middle" fontSize="10"
              fill={isLast ? PRIMARY : '#9ca3af'}
              fontWeight={isLast ? '500' : '400'}
            >
              {DAY_LABELS[i]}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── Store Dropdown ───────────────────────────────────────────────────────────

function StoreDropdown({ selected, onChange }: { selected: Store | null; onChange: (s: Store | null) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 bg-[#e8f5ed] border border-[#b6dfc6] rounded-lg px-3 py-1.5 text-xs text-[#1a6b3a] font-medium min-w-[170px] justify-between"
      >
        <span className="flex items-center gap-1.5 truncate">
          <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          <span className="truncate">{selected ? selected.name : 'Tất cả cửa hàng'}</span>
        </span>
        <svg className={`w-3 h-3 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-[250px] overflow-hidden">
          <button
            onClick={() => { onChange(null); setOpen(false) }}
            className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs text-left transition-colors border-b border-gray-50 ${!selected ? 'text-[#1a6b3a] font-medium bg-[#f5fbf7]' : 'text-gray-700 hover:bg-gray-50'}`}
          >
            <span className="w-5 h-5 rounded-full bg-[#e8f5ed] flex items-center justify-center text-[10px] text-[#1a6b3a] font-bold flex-shrink-0">✓</span>
            Tất cả cửa hàng
          </button>
          {ALL_STORES.map(s => (
            <button
              key={s.rank}
              onClick={() => { onChange(s); setOpen(false) }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs text-left transition-colors ${selected?.rank === s.rank ? 'text-[#1a6b3a] font-medium bg-[#f5fbf7]' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium flex-shrink-0 ${s.rank === 1 ? 'bg-[#1a6b3a] text-white' : 'bg-[#e8f5ed] text-[#1a6b3a]'}`}>
                {s.rank}
              </span>
              <div className="min-w-0 text-left">
                <div className="truncate font-medium">{s.name}</div>
                <div className="text-[10px] text-gray-400">{s.loc}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Date Range Picker ────────────────────────────────────────────────────────

function toInputVal(ddmmyyyy: string) {
  const [d, m, y] = ddmmyyyy.split('/')
  return `${y}-${m}-${d}`
}
function toDisplay(yyyymmdd: string) {
  const [y, m, d] = yyyymmdd.split('-')
  return `${d}/${m}/${y}`
}

function DateRangePicker({ from, to, onChange }: { from: string; to: string; onChange: (f: string, t: string) => void }) {
  const [open,  setOpen]  = useState(false)
  const [dFrom, setDFrom] = useState(toInputVal(from))
  const [dTo,   setDTo]   = useState(toInputVal(to))
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  function quickRange(days: number) {
    const now  = new Date()
    const fmt  = (d: Date) => d.toISOString().slice(0, 10)
    if (days > 0) {
      const s = new Date(now); s.setDate(s.getDate() - days)
      setDFrom(fmt(s)); setDTo(fmt(now))
    } else {
      const s = new Date(now.getFullYear(), now.getMonth(), 1)
      setDFrom(fmt(s)); setDTo(fmt(now))
    }
  }

  function apply() {
    onChange(toDisplay(dFrom), toDisplay(dTo))
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 hover:border-gray-300 transition-colors"
      >
        <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        {from} – {to}
        <svg className={`w-3 h-3 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-4 w-[270px]">
          <div className="text-xs font-medium text-gray-700 mb-3">Chọn khoảng thời gian</div>
          <div className="space-y-2.5 mb-3">
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">Từ ngày</label>
              <input type="date" value={dFrom} onChange={e => setDFrom(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-[#1a6b3a]" />
            </div>
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">Đến ngày</label>
              <input type="date" value={dTo} onChange={e => setDTo(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-[#1a6b3a]" />
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {[{ label: '7 ngày', days: 7 }, { label: '30 ngày', days: 30 }, { label: 'Tháng này', days: 0 }].map(q => (
              <button key={q.label} onClick={() => quickRange(q.days)}
                className="px-2 py-1 text-[11px] border border-gray-200 rounded-md text-gray-500 hover:border-[#1a6b3a] hover:text-[#1a6b3a] transition-colors">
                {q.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setOpen(false)} className="flex-1 border border-gray-200 rounded-lg py-1.5 text-xs text-gray-500 hover:bg-gray-50">Hủy</button>
            <button onClick={apply} className="flex-1 bg-[#1a6b3a] rounded-lg py-1.5 text-xs text-white hover:bg-[#155c30]">Áp dụng</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Product Modal ────────────────────────────────────────────────────────────

function ProductModal({ product, onClose }: { product: Product; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-6 w-[500px] max-w-[95vw] max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium text-gray-900">{product.icon} {product.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Doanh thu',   val: product.rev },
            { label: 'Số lượng',    val: product.qty },
            { label: 'Tăng trưởng', val: product.detail.growth, green: true },
          ].map(m => (
            <div key={m.label} className="bg-gray-50 rounded-lg p-3">
              <div className="text-[11px] text-gray-500 mb-1">{m.label}</div>
              <div className={`text-lg font-medium ${m.green ? 'text-[#1a6b3a]' : 'text-gray-900'}`}>{m.val}</div>
            </div>
          ))}
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {['Cửa hàng', 'Số lượng', 'Doanh thu', 'Trạng thái'].map(h => (
                <th key={h} className="text-[11px] text-gray-400 font-medium uppercase tracking-wide pb-2 text-left last:text-right">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {product.detail.stores.map((row, i) => (
              <tr key={i} className="border-b border-gray-50 last:border-0">
                <td className="py-2 font-medium text-gray-800">{row.s}</td>
                <td className="py-2 text-gray-500">{row.q}</td>
                <td className="py-2 text-gray-800">{row.r}</td>
                <td className="py-2 text-right">
                  <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${row.ok ? 'bg-[#e8f5ed] text-[#1a6b3a]' : 'bg-amber-50 text-amber-700'}`}>
                    {row.ok ? 'Tốt' : 'Cần bổ sung'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [activeTab,       setActiveTab]       = useState<TabKey>('ngay')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedStore,   setSelectedStore]   = useState<Store | null>(null)
  const [dateFrom,        setDateFrom]        = useState('01/05/2024')
  const [dateTo,          setDateTo]          = useState('24/05/2024')

  const storeName = selectedStore ? selectedStore.name : 'Tất cả cửa hàng'

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-gray-900">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Báo cáo doanh thu cửa hàng</h2>
        </div>
        <div className="flex items-center gap-2.5">
          <DateRangePicker
            from={dateFrom} to={dateTo}
            onChange={(f, t) => { setDateFrom(f); setDateTo(t) }}
          />
          <StoreDropdown selected={selectedStore} onChange={setSelectedStore} />
          <button
            onClick={() => exportToExcel(storeName, `${dateFrom} – ${dateTo}`, ALL_STORES, PRODUCTS)}
            className="flex items-center gap-1.5 bg-[#1a6b3a] hover:bg-[#155c30] text-white rounded-lg px-4 py-1.5 text-xs font-medium transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Xuất dữ liệu
          </button>
        </div>
      </div>

      {/* Metric cards — no trend bar, no small % */}
      <div className="grid grid-cols-3 gap-3.5 mb-5">
        {[
          { label: 'Tổng doanh thu cửa hàng', value: '—' },
          { label: 'Số hóa đơn',              value: '—' },
          { label: 'Tăng trưởng doanh thu',   value: '—' },
        ].map(m => (
          <div key={m.label} className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">{m.label}</div>
            <div className="text-[30px] font-semibold text-gray-900 leading-none">{m.value}</div>
          </div>
        ))}
      </div>

      {/* Chart + Top 7 stores */}
      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: '1fr 300px' }}>

        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-medium text-gray-900">Xu hướng doanh thu</div>
              <div className="text-xs text-gray-400 mt-0.5">Theo ngày trong tuần</div>
            </div>
            <div className="flex gap-1">
              {(['ngay', 'hom_qua', 'tuan'] as TabKey[]).map(key => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${activeTab === key ? 'bg-[#1a6b3a] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  {key === 'ngay' ? 'Hôm nay' : key === 'hom_qua' ? 'Hôm qua' : 'Tuần rồi'}
                </button>
              ))}
            </div>
          </div>
          <BarChart data={DATA_BY_TAB[activeTab]} />
        </div>

        {/* Top 7 stores list */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="text-sm font-medium text-gray-900 mb-3">Top cửa hàng</div>
          {ALL_STORES.map(s => (
            <div key={s.rank} className="flex items-center gap-2.5 py-2 border-b border-gray-50 last:border-0">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-medium flex-shrink-0 ${s.rank === 1 ? 'bg-[#1a6b3a] text-white' : 'bg-[#e8f5ed] text-[#1a6b3a]'}`}>
                {s.rank}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-800 truncate">{s.name}</div>
                <div className="text-[10px] text-gray-400">{s.loc}</div>
              </div>
              <div className="text-xs font-medium text-gray-800 whitespace-nowrap">{s.rev}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Products table */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-medium text-gray-900">Sản phẩm đóng góp cao</div>
            <div className="text-xs text-gray-400 mt-0.5">Tỷ trọng doanh thu theo danh mục sản phẩm</div>
          </div>
          <button className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors">
            Chi tiết danh mục
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {['Sản phẩm', 'Danh mục', 'Doanh số', 'Số lượng', 'Hành động'].map(h => (
                <th key={h} className="text-[11px] text-gray-400 font-medium uppercase tracking-wide pb-2.5 text-left last:text-center">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PRODUCTS.slice(0, 5).map((p, i) => (
              <tr key={i} className="border-b border-gray-50 last:border-0">
                <td className="py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#f0f9f4] flex items-center justify-center text-base flex-shrink-0">{p.icon}</div>
                    <span className="font-medium text-gray-800 text-xs">{p.name}</span>
                  </div>
                </td>
                <td className="py-3 text-xs text-gray-400">{p.cat}</td>
                <td className="py-3 text-xs font-medium text-gray-800">{p.rev}</td>
                <td className="py-3 text-xs text-gray-400">{p.qty}</td>
                <td className="py-3 text-center">
                  <button
                    onClick={() => setSelectedProduct(p)}
                    className="inline-flex items-center justify-center p-1.5 rounded-md text-[#1a6b3a] hover:bg-[#e8f5ed] transition-colors"
                    title="Xem chi tiết"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedProduct && (
        <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </div>
  )
}