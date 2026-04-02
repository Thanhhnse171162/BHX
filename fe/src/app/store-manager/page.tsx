'use client'

import { useState, useEffect } from 'react'
import {
  DollarSign,
  Package,
  AlertTriangle,
  XCircle,
  Download,
  Search,
  RefreshCw,
  Check,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChartPoint { day: string; value: number }
interface Product { name: string; units: number; revenue: string; pct: number }
interface Store { id: string; name: string }

type TimeRange = 'today' | 'yesterday' | '7days' | 'month' | 'custom'

// ─── Custom SVG Revenue Chart ─────────────────────────────────────────────────
function RevenueChart({ chartData }: { chartData: ChartPoint[] }) {
  if (!chartData.length) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-[#9aaa8e]">
        Đang tải biểu đồ...
      </div>
    )
  }

  const width = 500
  const height = 240
  const padding = { top: 20, right: 30, bottom: 30, left: 50 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const values = chartData.map(d => d.value)
  const maxValue = Math.max(...values, 1)
  const minValue = 0

  const xStep = chartWidth / Math.max(chartData.length - 1, 1)
  const yScale = chartHeight / (maxValue - minValue)

  const points = chartData.map((d, i) => ({
    x: padding.left + i * xStep,
    y: padding.top + chartHeight - (d.value - minValue) * yScale,
  }))

  // Create smooth bezier path
  let pathD = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1]
    const p1 = points[i]
    const cp1x = p0.x + (p1.x - p0.x) / 3
    const cp1y = p0.y
    const cp2x = p1.x - (p1.x - p0.x) / 3
    const cp2y = p1.y
    pathD += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p1.x} ${p1.y}`
  }

  // Fill area
  let areaD = pathD + ` L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="mx-auto">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
        const y = padding.top + chartHeight * (1 - ratio)
        return (
          <line key={i} x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#e4edd9" strokeWidth="1" />
        )
      })}

      {/* Fill area */}
      <path d={areaD} fill="rgba(59,140,42,0.08)" />

      {/* Line */}
      <path d={pathD} stroke="#3b8c2a" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {/* Points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="white" stroke="#3b8c2a" strokeWidth="2" />
      ))}

      {/* X Axis labels */}
      {chartData.map((d, i) => (
        i % Math.ceil(chartData.length / 5) === 0 ? (
          <text
            key={`x-${i}`}
            x={points[i].x}
            y={height - 8}
            textAnchor="middle"
            fontSize="11"
            fill="#9aaa8e"
          >
            {d.day}
          </text>
        ) : null
      ))}

      {/* Y Axis labels */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
        const value = minValue + (maxValue - minValue) * ratio
        const y = padding.top + chartHeight * (1 - ratio)
        const label = value >= 1_000_000 ? `${(value / 1_000_000).toFixed(0)}M` : 
                      value >= 1_000 ? `${(value / 1_000).toFixed(0)}K` : 
                      value.toFixed(0)
        return (
          <text
            key={`y-${i}`}
            x={padding.left - 10}
            y={y + 4}
            textAnchor="end"
            fontSize="11"
            fill="#9aaa8e"
          >
            {label}
          </text>
        )
      })}
    </svg>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function StoreManagerDashboard() {
  const { token, user } = useAuthStore(s => ({ token: s.token, user: s.user }))
  
  // Store selection
  const [stores, setStores] = useState<Store[]>([])
  const [selectedStoreId, setSelectedStoreId] = useState('')
  const [showStoreMenu, setShowStoreMenu] = useState(false)
  const selectedStore = stores.find(s => s.id === selectedStoreId)

  // Time filters
  const [activeRange, setActiveRange] = useState<TimeRange>('7days')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  // KPI
  const [revenue, setRevenue] = useState('—')
  const [stockCount, setStockCount] = useState(0)
  const [lowCount, setLowCount] = useState(0)
  const [outCount, setOutCount] = useState(0)

  // Chart & Products
  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [products, setProducts] = useState<Product[]>([])

  // ── Initialize stores from API ─────────────────────────────────────────────
  useEffect(() => {
    const initStores = async () => {
      try {
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}
        const res = await fetch('/api/warehouse/list', { headers })
        if (res.ok) {
          const data = await res.json()
          const storeList = Array.isArray(data) ? data : data.data || []
          setStores(storeList)
          
          // If user has workplace, set it as default; otherwise use first store
          if (user?.workplaceId && storeList.some((s: Store) => s.id === user.workplaceId)) {
            setSelectedStoreId(user.workplaceId)
          } else if (storeList.length > 0) {
            setSelectedStoreId(storeList[0].id)
          }
        }
      } catch (err) {
        console.error('Failed to load stores:', err)
      }
    }
    
    if (token) initStores()
  }, [token, user?.workplaceId])

  // ── Fetch data ──────────────────────────────────────────────────────────────
  const fetchAll = async () => {
    try {
      setLoading(true)
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}

      const params = new URLSearchParams()
      if (selectedStoreId) params.set('storeId', selectedStoreId)
      if (activeRange !== 'custom') params.set('range', activeRange)
      else {
        if (dateFrom) params.set('from', dateFrom)
        if (dateTo) params.set('to', dateTo)
      }
      const qs = params.toString() ? `?${params}` : ''

      // Revenue
      const revenueRes = await fetch(`/api/reports/manager/revenue${qs}`, { headers })
      if (revenueRes.ok) {
        const data = await revenueRes.json()
        setRevenue(
          (data.totalRevenue || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })
        )
        setChartData(
          (data.chartData || []).map((d: any) => ({ day: d.day || d.date || d.label, value: d.value || d.revenue || 0 }))
        )
        setProducts(
          (data.topProducts || []).slice(0, 5).map((p: any, _: number, arr: any[]) => {
            const maxRev = arr[0]?.revenue || 1
            return {
              name: p.productName || p.name,
              units: p.unitsSold || p.units || 0,
              revenue: (p.revenue || 0).toLocaleString('vi-VN'),
              pct: Math.round(((p.revenue || 0) / maxRev) * 100),
            }
          })
        )
      }

      // Inventory
      const invRes = await fetch(`/api/Inventory/low-stock-alerts${qs}`, { headers })
      if (invRes.ok) {
        const data: any = await invRes.json()
        const items = Array.isArray(data) ? data : data.data || []
        setLowCount(items.filter((i: any) => i.quantity > 0).length)
        setOutCount(items.filter((i: any) => i.quantity === 0).length)
        setStockCount(items.reduce((sum: number, i: any) => sum + (i.totalQuantity || 0), 0))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { 
    if (selectedStoreId) fetchAll() 
  }, [token, activeRange, selectedStoreId])

  const handleApply = () => fetchAll()

  const handleReset = () => {
    setDateFrom('')
    setDateTo('')
    setActiveRange('7days')
  }

  // ── Filtered products ──────────────────────────────────────────────────────
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const timeOptions: { label: string; value: TimeRange }[] = [
    { label: 'Hôm nay', value: 'today' },
    { label: 'Hôm qua', value: 'yesterday' },
    { label: '7 ngày qua', value: '7days' },
    { label: 'Tháng này', value: 'month' },
    { label: 'Tuỳ chỉnh', value: 'custom' },
  ]

  // ── KPI cards config ───────────────────────────────────────────────────────
  const kpis = [
    {
      label: 'Tổng doanh thu',
      value: revenue,
      sub: '',
      color: 'green',
      icon: DollarSign,
    },
    {
      label: 'Còn hàng',
      value: stockCount.toLocaleString('vi-VN'),
      sub: 'Sản phẩm khả dụng',
      color: 'blue',
      icon: Package,
    },
    {
      label: 'Sắp hết',
      value: String(lowCount),
      sub: 'Cần nhập thêm ngay',
      color: 'amber',
      icon: AlertTriangle,
    },
    {
      label: 'Hết hàng',
      value: String(outCount),
      sub: 'Đang tạm ngừng bán',
      color: 'red',
      icon: XCircle,
    },
  ]

  const colorMap: Record<string, { border: string; iconBg: string; iconColor: string }> = {
    green: { border: 'border-l-[#3b8c2a]', iconBg: 'bg-[#e8f5e2]', iconColor: 'text-[#3b8c2a]' },
    blue:  { border: 'border-l-[#2a6eb0]', iconBg: 'bg-[#e2edf8]', iconColor: 'text-[#2a6eb0]' },
    amber: { border: 'border-l-[#e09a1a]', iconBg: 'bg-[#fdf3de]', iconColor: 'text-[#e09a1a]' },
    red:   { border: 'border-l-[#c03030]', iconBg: 'bg-[#fce8e8]', iconColor: 'text-[#c03030]' },
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f5f7f2] p-5 font-['Be_Vietnam_Pro',sans-serif]">

      {/* Top bar */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold text-[#1a2e10]">Doanh thu cửa hàng</h1>
          <p className="mt-0.5 text-xs text-[#7a8a6e]">
            Theo dõi doanh thu theo ngày và theo khoảng thời gian
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-[#d4e0c8] bg-white px-4 py-2 text-xs font-semibold text-[#3b6b22] transition hover:bg-[#f0f5eb]">
          <Download size={13} />
          Xuất báo cáo
        </button>
      </div>

      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-end gap-4 rounded-xl border border-[#e4edd9] bg-white px-5 py-4">
        {/* Store selection */}
        <div className="flex flex-col gap-1 relative">
          {stores.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowStoreMenu(!showStoreMenu)}
                className="min-w-[200px] rounded-lg border border-[#d4e0c8] bg-white px-4 py-2 text-sm font-semibold text-[#2d4a1a] outline-none hover:border-[#3b8c2a] focus:border-[#3b8c2a] transition flex items-center justify-between"
              >
                <span className="truncate">{selectedStore?.name || 'Chọn cửa hàng'}</span>
                <svg className={`w-4 h-4 transition-transform ${showStoreMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
              
              {/* Dropdown menu */}
              {showStoreMenu && stores.length > 1 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#d4e0c8] rounded-lg shadow-lg z-10 overflow-hidden">
                  {stores.map(store => (
                    <button
                      key={store.id}
                      onClick={() => {
                        setSelectedStoreId(store.id)
                        setShowStoreMenu(false)
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm font-medium transition ${
                        selectedStoreId === store.id
                          ? 'bg-[#f5fdf1] text-[#3b8c2a] border-l-4 border-[#3b8c2a]'
                          : 'text-[#2d4a1a] hover:bg-[#f9fbf7]'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        {selectedStoreId === store.id && (
                          <span className="text-[#3b8c2a] font-bold">✓</span>
                        )}
                        {store.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Time tabs */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-[#7a8a6e]">
            Khoảng thời gian
          </label>
          <div className="flex gap-1.5">
            {timeOptions.map(t => (
              <button
                key={t.value}
                onClick={() => setActiveRange(t.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeRange === t.value
                    ? 'bg-[#3b8c2a] text-white'
                    : 'bg-[#f0f4eb] text-[#6a7c5a] hover:bg-[#e4edda]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date pickers */}
        {activeRange === 'custom' && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-[#7a8a6e]">
                Từ ngày
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="rounded-lg border border-[#d4e0c8] px-3 py-1.5 text-xs text-[#4a6040] outline-none focus:border-[#3b8c2a]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-[#7a8a6e]">
                Đến ngày
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="rounded-lg border border-[#d4e0c8] px-3 py-1.5 text-xs text-[#4a6040] outline-none focus:border-[#3b8c2a]"
              />
            </div>
          </>
        )}

        {/* Actions */}
        <div className="ml-auto flex gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-lg border border-[#d4e0c8] bg-[#f0f4eb] px-4 py-1.5 text-xs font-semibold text-[#6a7c5a] transition hover:bg-[#e4edda]"
          >
            <RefreshCw size={12} />
            Đặt lại
          </button>
          <button
            onClick={handleApply}
            className="flex items-center gap-1.5 rounded-lg bg-[#3b8c2a] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[#2f7020]"
          >
            <Check size={12} />
            Áp dụng
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map(card => {
          const c = colorMap[card.color]
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className={`relative overflow-hidden rounded-xl border border-[#e4edd9] bg-white p-4 border-l-4 ${c.border}`}
            >
              <div className={`mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg ${c.iconBg}`}>
                <Icon size={17} className={c.iconColor} />
              </div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#7a8a6e]">
                {card.label}
              </p>
              <p className="mb-1.5 text-xl font-bold leading-none text-[#1a2e10]">{card.value}</p>
              <p className="text-[11px] text-[#9aaa8e]">{card.sub}</p>
            </div>
          )
        })}
      </div>

      {/* Chart + Products grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Revenue Chart */}
        <div className="rounded-xl border border-[#e4edd9] bg-white p-5">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#1a2e10]">Biểu đồ xu hướng doanh thu</h2>
            </div>
            <span className="flex items-center gap-1.5 text-[11px] text-[#7a8a6e]">
              <span className="inline-block h-2 w-2 rounded-full bg-[#3b8c2a]" />
              Doanh thu thực tế
            </span>
          </div>
          <div className="h-56">
            {loading ? (
              <div className="flex h-full items-center justify-center text-xs text-[#9aaa8e]">
                Đang tải...
              </div>
            ) : (
              <RevenueChart chartData={chartData} />
            )}
          </div>
        </div>

        {/* Top products */}
        <div className="rounded-xl border border-[#e4edd9] bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#1a2e10]">Top 5 sản phẩm bán chạy nhất</h2>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-[#d4e0c8] px-2.5 py-1.5">
              <Search size={12} className="text-[#9aaa8e]" />
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-32 border-none bg-transparent text-xs text-[#4a6040] outline-none placeholder:text-[#b8c8aa]"
              />
            </div>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b border-[#eef2e9]">
                <th className="pb-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-[#9aaa8e]">
                  Tên sản phẩm
                </th>
                <th className="pb-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-[#9aaa8e]">
                  Số lượng đã bán
                </th>
                <th className="pb-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-[#9aaa8e]">
                  Tổng doanh thu
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f4f7f0]">
              {loading ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-xs text-[#9aaa8e]">
                    Đang tải...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-xs text-[#9aaa8e]">
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p, i) => (
                  <tr key={i} className="transition hover:bg-[#fafcf8]">
                    <td className="py-2.5 text-[13px] text-[#2d4a1a]">
                      <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded bg-[#eef5e9] text-[11px] font-bold text-[#5a8a40]">
                        {i + 1}
                      </span>
                      {p.name}
                    </td>
                    <td className="py-2.5 text-center">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#eef2e9]">
                          <div
                            className="h-full rounded-full bg-[#3b8c2a]"
                            style={{ width: `${p.pct}%` }}
                          />
                        </div>
                        <span className="min-w-[36px] text-right text-xs font-semibold text-[#3b8c2a]">
                          {p.units.toLocaleString('vi-VN')}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 text-right text-[13px] font-semibold text-[#1a2e10]">
                      {p.revenue}₫
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-5 text-center text-[10px] text-[#b8c8aa]">
        © 2025 Hệ thống quản lý bán lẻ. Bảng điều khiển quản trị viên.
      </p>
    </div>
  )
}