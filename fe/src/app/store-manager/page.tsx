'use client'

import { useState, useEffect } from 'react'
import {
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
  const [userStoreName, setUserStoreName] = useState('')

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
            setUserStoreName(storeList.find((s: Store) => s.id === user.workplaceId)?.name || '')
          } else if (storeList.length > 0) {
            setSelectedStoreId(storeList[0].id)
            setUserStoreName(storeList[0].name)
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

      // Sales
      const salesRes = await fetch(`/api/sales${qs}`, { headers })
      if (salesRes.ok) {
        const s = await salesRes.json()
        setRevenue(
          (s.totalRevenue || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })
        )
        setChartData(
          (s.chartData || []).map((d: any) => ({ day: d.day || d.label, value: d.value }))
        )
        setProducts(
          (s.topProducts || []).slice(0, 5).map((p: any, _: number, arr: any[]) => {
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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f5f7f2] p-5 font-['Be_Vietnam_Pro',sans-serif]">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        
        {/* LEFT SIDEBAR - Doanh thu ────────────────────────────────────────────*/}
        <div className="lg:col-span-1 sticky top-5 h-fit">
          <div className="rounded-xl border border-[#e4edd9] bg-white p-5">
            {/* Title */}
            <h2 className="mb-4 text-sm font-bold text-[#1a2e10]">Doanh thu</h2>

            {/* Store selection */}
            {stores.length > 1 && (
              <div className="mb-4 flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-[#7a8a6e]">
                  Cửa hàng
                </label>
                <select 
                  value={selectedStoreId} 
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="rounded-lg border border-[#d4e0c8] px-3 py-1.5 text-sm text-[#2d4a1a] outline-none focus:border-[#3b8c2a]"
                >
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Main revenue box */}
            <div className="mb-4 rounded-lg bg-gradient-to-br from-[#f5fdf1] to-[#eefde8] p-4 border border-[#d4e0c8]">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#7a8a6e]">
                Tổng doanh thu
              </p>
              <p className="text-2xl font-bold text-[#3b8c2a]">{revenue}</p>
              <p className="mt-1 text-[11px] text-[#9aaa8e]">Khoảng thời gian được chọn</p>
            </div>

            {/* Quick stats boxes */}
            <div className="space-y-2.5">
              {/* Stock */}
              <div className="rounded-lg border border-[#e4edd9] bg-[#fafcf8] p-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e8f5e2]">
                  <span className="text-[13px] font-bold text-[#3b8c2a]">📦</span>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-semibold uppercase text-[#7a8a6e]">Còn hàng</p>
                  <p className="text-sm font-bold text-[#2d4a1a]">{stockCount.toLocaleString('vi-VN')}</p>
                </div>
              </div>

              {/* Low stock */}
              <div className="rounded-lg border border-[#e4edd9] bg-[#fffbf0] p-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#fdf3de]">
                  <span className="text-[13px] font-bold text-[#e09a1a]">⚠️</span>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-semibold uppercase text-[#7a8a6e]">Sắp hết</p>
                  <p className="text-sm font-bold text-[#2d4a1a]">{lowCount}</p>
                </div>
              </div>

              {/* Out of stock */}
              <div className="rounded-lg border border-[#e4edd9] bg-[#fef8f8] p-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#fce8e8]">
                  <span className="text-[13px] font-bold text-[#c03030]">❌</span>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-semibold uppercase text-[#7a8a6e]">Hết hàng</p>
                  <p className="text-sm font-bold text-[#2d4a1a]">{outCount}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT - Chart & Products ─────────────────────────────────────*/}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Top bar */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-lg font-bold text-[#1a2e10]">Phân tích doanh thu cửa hàng</h1>
              <p className="mt-0.5 text-xs text-[#7a8a6e]">
                {userStoreName || 'Theo dõi doanh thu theo ngày và khoảng thời gian'}
              </p>
            </div>
            <button className="flex items-center gap-2 rounded-lg border border-[#d4e0c8] bg-white px-4 py-2 text-xs font-semibold text-[#3b6b22] transition hover:bg-[#f0f5eb]">
              <Download size={13} />
              Xuất báo cáo
            </button>
          </div>

          {/* Filter bar */}
          <div className="flex flex-wrap items-end gap-4 rounded-xl border border-[#e4edd9] bg-white px-5 py-4">
            {/* Time tabs */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-[#7a8a6e]">
                Khoảng thời gian
              </label>
              <div className="flex gap-1.5 flex-wrap">
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

          {/* Chart + Products grid */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

            {/* Revenue Chart */}
            <div className="rounded-xl border border-[#e4edd9] bg-white p-5">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[#1a2e10]">Xu hướng doanh thu</h2>
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
                  <h2 className="text-sm font-bold text-[#1a2e10]">Top 5 sản phẩm bán chạy</h2>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg border border-[#d4e0c8] px-2.5 py-1.5">
                  <Search size={12} className="text-[#9aaa8e]" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm..."
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
                      Sản phẩm
                    </th>
                    <th className="pb-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-[#9aaa8e]">
                      Số lượng
                    </th>
                    <th className="pb-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-[#9aaa8e]">
                      Doanh thu
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
        </div>
      </div>

      {/* Footer */}
      <p className="mt-8 text-center text-[10px] text-[#b8c8aa]">
        © 2025 Hệ thống quản lý bán lẻ Bách Hoá Xanh
      </p>
    </div>
  )
}