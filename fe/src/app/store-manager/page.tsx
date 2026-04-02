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

type TimeRange = 'today' | 'yesterday' | '7days' | 'month' | 'custom'

// ─── Revenue Line Chart (SVG) ─────────────────────────────────────────────────
function RevenueChart({ chartData }: { chartData: ChartPoint[] }) {
  if (!chartData.length) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-[#9aaa8e]">
        Đang tải biểu đồ...
      </div>
    )
  }

  const maxValue = Math.max(...chartData.map(d => d.value), 1)
  const width = 600
  const height = 200
  const padding = { top: 20, right: 20, bottom: 40, left: 50 }
  
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  
  const points = chartData.map((d, i) => ({
    x: padding.left + (i / (chartData.length - 1 || 1)) * chartWidth,
    y: padding.top + chartHeight - (d.value / maxValue) * chartHeight,
    value: d.value,
    day: d.day,
  }))

  // Create path
  let pathData = `M ${points[0]?.x || 0} ${points[0]?.y || 0}`
  for (let i = 1; i < points.length; i++) {
    const curr = points[i]
    const prev = points[i - 1]
    const midX = (prev.x + curr.x) / 2
    pathData += ` C ${midX} ${prev.y} ${midX} ${curr.y} ${curr.x} ${curr.y}`
  }

  // Fill area
  const areaPath = `${pathData} L ${points[points.length - 1]?.x || 0} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
        const y = padding.top + chartHeight * (1 - pct)
        const label = (maxValue * pct).toLocaleString('vi-VN', {
          notation: 'compact',
          compactDisplay: 'short',
        })
        return (
          <g key={i}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#eef2e9" strokeWidth="1" />
            <text x={padding.left - 8} y={y + 4} textAnchor="end" className="text-[10px] fill-[#9aaa8e]">
              {label}
            </text>
          </g>
        )
      })}

      {/* Area fill */}
      <path d={areaPath} fill="rgba(59,140,42,0.08)" />

      {/* Line */}
      <path d={pathData} fill="none" stroke="#3b8c2a" strokeWidth="2.5" strokeLinecap="round" />

      {/* Points */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="white" stroke="#3b8c2a" strokeWidth="2" />
        </g>
      ))}

      {/* X-axis labels */}
      {points.map((p, i) => (
        <text
          key={i}
          x={p.x}
          y={padding.top + chartHeight + 25}
          textAnchor="middle"
          className="text-[10px] fill-[#9aaa8e]"
        >
          {p.day}
        </text>
      ))}
    </svg>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function StoreManagerDashboard() {
  const token = useAuthStore(s => s.token)
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

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchAll = async () => {
    try {
      setLoading(true)
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}

      const params = new URLSearchParams()
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
        const items: any = await invRes.json()
        const arr = Array.isArray(items) ? items : items.data || []
        setLowCount(arr.filter((i: any) => i.quantity > 0).length)
        setOutCount(arr.filter((i: any) => i.quantity === 0).length)
        setStockCount(arr.reduce((sum: number, i: any) => sum + (i.totalQuantity || 0), 0))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [token, activeRange])

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

  // ── KPI cards config ───────────────────────────────────────────────────────
  const kpis = [
    {
      label: 'Tổng doanh thu',
      value: revenue,
      sub: 'So với kỳ trước',
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
        {/* Store select */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-[#7a8a6e]">
            Cửa hàng
          </label>
          <select className="rounded-lg border border-[#d4e0c8] px-3 py-1.5 text-sm text-[#2d4a1a] outline-none focus:border-[#3b8c2a]">
            <option>Bách Hoá Xanh Lê Văn Việt</option>
            <option>Bách Hoá Xanh Nguyễn Trãi</option>
            <option>Bách Hoá Xanh Đinh Tiên Hoàng</option>
          </select>
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