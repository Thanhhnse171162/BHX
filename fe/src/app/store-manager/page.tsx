'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  DollarSign,
  ShoppingCart,
  Package,
  ClipboardList,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Download,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'

// Types
interface KPICard {
  label: string
  value: string
  trend?: string
  trendUp?: boolean
  sub: string
  icon: any
  accent: string
  iconBg: string
  iconColor: string
  border: string
  warning?: boolean
}

interface ChartPoint {
  day: string
  value: number
}

interface Product {
  name: string
  units: number
  revenue: number
  pct: number
}

interface LowStockItem {
  product: string
  shelf: number
  back: number
  status: string
}

interface Incident {
  reporter: string
  type: string
  date: string
  severity: string
}

// SVG smooth line chart
// SVG smooth line chart
function SalesChart({ chartData }: { chartData: ChartPoint[] }) {
  if (!chartData || chartData.length === 0) {
    return <div className="text-center text-gray-400">Loading chart data...</div>
  }

  const MAX_VAL = Math.max(...chartData.map(d => d.value), 6000)
  const SVG_W   = 680
  const SVG_H   = 300
  const PAD_L   = 50
  const PAD_B   = 32
  const PAD_T   = 16
  const PAD_R   = 20

  const chartW = SVG_W - PAD_L - PAD_R
  const chartH = SVG_H - PAD_B - PAD_T

  const pts = chartData.map((d, i) => ({
    x: PAD_L + (i / (chartData.length - 1)) * chartW,
    y: PAD_T + chartH - (d.value / MAX_VAL) * chartH,
  }))

  let lineD = `M${pts[0].x},${pts[0].y}`
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1]
    const curr = pts[i]
    const cpx = (prev.x + curr.x) / 2
    lineD += ` C${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`
  }
  const areaD = `${lineD} L${pts[pts.length - 1].x},${PAD_T + chartH} L${pts[0].x},${PAD_T + chartH} Z`

  const yTicks = [
    { v: 0, label: '$0' },
    { v: MAX_VAL * 0.25, label: `$${(MAX_VAL * 0.25 / 1000).toFixed(1)}k` },
    { v: MAX_VAL * 0.5, label: `$${(MAX_VAL * 0.5 / 1000).toFixed(1)}k` },
    { v: MAX_VAL * 0.75, label: `$${(MAX_VAL * 0.75 / 1000).toFixed(1)}k` },
    { v: MAX_VAL, label: `$${(MAX_VAL / 1000).toFixed(1)}k` },
  ]

  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full block" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="chartGrad2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#3B82F6" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
        </linearGradient>
        <filter id="dot-shadow">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#3B82F6" floodOpacity="0.4" />
        </filter>
      </defs>

      {yTicks.map(({ v, label }) => {
        const y = PAD_T + chartH - (v / MAX_VAL) * chartH
        return (
          <g key={label}>
            <line
              x1={PAD_L} y1={y} x2={SVG_W - PAD_R} y2={y}
              stroke={v === 0 ? '#CBD5E1' : '#F1F5F9'}
              strokeWidth={v === 0 ? 1.5 : 1}
              strokeDasharray={v !== 0 ? '4 4' : undefined}
            />
            <text x={PAD_L - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#94A3B8" fontFamily="system-ui">
              {label}
            </text>
          </g>
        )
      })}

      <path d={areaD} fill="url(#chartGrad2)" />
      <path d={lineD} fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {pts.map((pt, i) => (
        <g key={i}>
          <circle cx={pt.x} cy={pt.y} r="5" fill="white" stroke="#3B82F6" strokeWidth="2.5" filter="url(#dot-shadow)" />
        </g>
      ))}

      {chartData.map((d, i) => (
        <text key={d.day} x={pts[i].x} y={SVG_H - 6} textAnchor="middle" fontSize="11" fill="#94A3B8" fontFamily="system-ui">
          {d.day}
        </text>
      ))}
    </svg>
  )
}

// Page component
export default function StoreManagerDashboard() {
  const token = useAuthStore((state) => state.token)
  const [activeFilter, setActiveFilter] = useState<'Today' | 'Yesterday' | 'Last 7 Days'>('Today')

  // State for data
  const [todayRevenue, setTodayRevenue] = useState<string>('$0.00')
  const [totalOrders, setTotalOrders] = useState<number>(0)
  const [lowStockCount, setLowStockCount] = useState<number>(0)
  const [stockRequests, setStockRequests] = useState<number>(0)
  const [incidentCount, setIncidentCount] = useState<number>(0)

  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [topProducts, setTopProducts] = useState<Product[]>([])
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}

        // 1. Fetch Sales data - for revenue, orders, and chart
        console.log('📊 Fetching sales data...')
        const salesResponse = await fetch('/api/sales', { headers })
        if (salesResponse.ok) {
          const salesData = await salesResponse.json()
          console.log('✅ Sales data:', salesData)

          // Process sales data
          const revenue = (salesData.totalRevenue || 4250).toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
          })
          setTodayRevenue(revenue)

          setTotalOrders(salesData.totalOrders || 124)

          // Build chart data from sales data
          if (salesData.chartData && Array.isArray(salesData.chartData)) {
            setChartData(salesData.chartData)
          } else {
            // Fallback chart data
            setChartData([
              { day: 'Mon', value: 900 },
              { day: 'Tue', value: 1500 },
              { day: 'Wed', value: 2100 },
              { day: 'Thu', value: 2700 },
              { day: 'Fri', value: 4200 },
              { day: 'Sat', value: 3800 },
              { day: 'Sun', value: 5400 },
            ])
          }

          // Top products from sales data
          if (salesData.topProducts && Array.isArray(salesData.topProducts)) {
            const mapped = salesData.topProducts.slice(0, 5).map((p: any) => ({
              name: p.productName || p.name,
              units: p.unitsSold || p.units || 0,
              revenue: p.revenue || '$0',
              pct: (p.percentage || 0) * 100,
            }))
            setTopProducts(mapped)
          }
        }

        // 2. Fetch Low Stock data
        console.log('📦 Fetching low stock alerts...')
        const lowStockResponse = await fetch('/api/Inventory/low-stock-alerts', { headers })
        if (lowStockResponse.ok) {
          const lowStockData = await lowStockResponse.json()
          console.log('✅ Low stock data:', lowStockData)

          const items = Array.isArray(lowStockData) ? lowStockData : lowStockData.data || []
          setLowStockCount(items.length)

          const mapped = items.slice(0, 4).map((item: any) => ({
            product: item.productName || item.product,
            shelf: item.shelfQuantity || 0,
            back: item.backQuantity || 0,
            status: item.quantity === 0 ? 'Out' : 'Low',
          }))
          setLowStockItems(mapped)
        }

        // 3. Fetch Stock Requests
        console.log('📋 Fetching restock requests...')
        const restockResponse = await fetch('/api/restock-requests', { headers })
        if (restockResponse.ok) {
          const restockData = await restockResponse.json()
          console.log('✅ Restock requests:', restockData)

          const requests = Array.isArray(restockData) ? restockData : restockData.data || []
          setStockRequests(requests.filter((r: any) => r.status === 'pending' || r.status === 'Pending').length)
        }

        // 4. Fetch Incident Reports
        console.log('🚨 Fetching incident reports...')
        const incidentResponse = await fetch('/api/damage-reports/Get-All-Damage-Reports', { headers })
        if (incidentResponse.ok) {
          const incidentData = await incidentResponse.json()
          console.log('✅ Incident data:', incidentData)

          const incidentList = Array.isArray(incidentData) ? incidentData : incidentData.data || []
          setIncidentCount(incidentList.length)

          const mapped = incidentList.slice(0, 3).map((inc: any) => ({
            reporter: inc.createdBy || inc.reporter || 'Unknown',
            type: inc.type || inc.damageType || 'General',
            date: new Date(inc.createdAt || inc.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            }),
            severity: inc.severity || 'Low',
          }))
          setIncidents(mapped)
        }
      } catch (error) {
        console.error('❌ Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [token])

  // Build KPI cards dynamically
  const kpiCards: KPICard[] = [
    {
      label: "Today's Revenue",
      value: todayRevenue,
      trend: '+12.5%',
      trendUp: true,
      sub: 'vs yesterday',
      icon: DollarSign,
      accent: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      border: 'border-blue-100',
    },
    {
      label: 'Total Orders',
      value: String(totalOrders),
      trend: '+8.2%',
      trendUp: true,
      sub: 'vs yesterday',
      icon: ShoppingCart,
      accent: 'from-violet-500 to-violet-600',
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
      border: 'border-violet-100',
    },
    {
      label: 'Low Stock Products',
      value: String(lowStockCount),
      warning: true,
      sub: 'Need restocking',
      icon: Package,
      accent: 'from-amber-400 to-amber-500',
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-500',
      border: 'border-amber-100',
    },
    {
      label: 'Stock Requests',
      value: String(stockRequests),
      sub: 'Pending approval',
      icon: ClipboardList,
      accent: 'from-cyan-500 to-cyan-600',
      iconBg: 'bg-cyan-50',
      iconColor: 'text-cyan-600',
      border: 'border-cyan-100',
    },
    {
      label: 'Incidents',
      value: String(incidentCount),
      sub: 'Unresolved',
      icon: AlertTriangle,
      accent: 'from-red-400 to-red-500',
      iconBg: 'bg-red-50',
      iconColor: 'text-red-500',
      border: 'border-red-100',
    },
  ]

  return (
    <div className="p-6 space-y-5 min-h-full">

      <div className="flex items-center justify-end gap-3">
        <Link
          href="/store-manager/inventory-check"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          <ClipboardList size={16} />
          Tạo đơn kiểm kê
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-5 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className={`bg-white rounded-2xl border ${card.border} p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden`}
            >
              <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${card.accent}`} />

              <div className="flex items-start justify-between mb-3">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider leading-tight mt-1">
                  {card.label}
                </p>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.iconBg} flex-shrink-0`}>
                  <Icon size={17} className={card.iconColor} />
                </div>
              </div>

              <p className="text-[26px] font-bold text-gray-900 leading-none mb-2">{card.value}</p>

              <div className="flex items-center gap-1.5">
                {card.trend && (
                  <>
                    <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
                      card.trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                    }`}>
                      {card.trendUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {card.trend}
                    </span>
                    <span className="text-[11px] text-gray-400">{card.sub}</span>
                  </>
                )}
                {card.warning && (
                  <span className="inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-600">
                    <AlertTriangle size={10} />
                    {card.sub}
                  </span>
                )}
                {!card.trend && !card.warning && (
                  <span className="text-[11px] text-gray-400">{card.sub}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Chart + Top Products */}
      <div className="grid grid-cols-5 gap-4 items-stretch">
        <div className="col-span-3 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col">
          <div className="flex items-start justify-between mb-4 flex-shrink-0">
            <div>
              <h2 className="text-[15px] font-bold text-gray-900">Sales Performance</h2>
              <p className="text-[12px] text-gray-400 mt-0.5">Daily revenue trend</p>
            </div>
            <div className="flex items-center gap-2">
              {(['Today', 'Yesterday', 'Last 7 Days'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`text-[12px] px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    activeFilter === f
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {f}
                </button>
              ))}
              <button className="inline-flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-lg font-semibold bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all">
                <Download size={12} />
                Export
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-0 flex items-center">
            {loading ? <div className="text-center text-gray-400">Loading chart...</div> : <SalesChart chartData={chartData} />}
          </div>
        </div>

        <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-5 flex-shrink-0">
            <div>
              <h2 className="text-[15px] font-bold text-gray-900">Top Selling Products</h2>
              <p className="text-[12px] text-gray-400 mt-0.5">This week</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer">
              View all <ArrowUpRight size={12} />
            </span>
          </div>
          <div className="flex-1 flex flex-col justify-between gap-3">
            {topProducts.length === 0 ? (
              <div className="text-center text-gray-400 py-4">No product data</div>
            ) : (
              topProducts.map((p, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[11px] font-bold text-gray-400 w-4 flex-shrink-0">#{i + 1}</span>
                      <span className="text-[13px] font-medium text-gray-800 truncate">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                      <span className="text-[12px] text-gray-400">{p.units} sold</span>
                      <span className="text-[13px] font-bold text-gray-900">${p.revenue}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full" style={{ width: `${p.pct}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Alert + Pending Incidents */}
      <div className="grid grid-cols-2 gap-4 items-stretch">

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-5 flex-shrink-0">
            <div>
              <h2 className="text-[15px] font-bold text-gray-900">Low Stock Alert</h2>
              <p className="text-[12px] text-gray-400 mt-0.5">Items needing restock</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-lg uppercase tracking-wide">
              <AlertTriangle size={11} />
              Action Required
            </span>
          </div>
          <div className="flex-1">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide pb-3">Product</th>
                  <th className="text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wide pb-3">Shelf / Back</th>
                  <th className="text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wide pb-3">Status</th>
                  <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wide pb-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lowStockItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-400">
                      No low stock items
                    </td>
                  </tr>
                ) : (
                  lowStockItems.map((item, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3.5 text-[13px] font-medium text-gray-800">{item.product}</td>
                      <td className="py-3.5 text-[13px] text-gray-500 text-center font-mono">
                        {item.shelf} / {item.back}
                      </td>
                      <td className="py-3.5 text-center">
                        <span
                          className={`inline-flex items-center justify-center text-[11px] font-bold px-2.5 py-0.5 rounded-full min-w-[40px] ${
                            item.status === 'Out'
                              ? 'bg-red-50 text-red-600 border border-red-100'
                              : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <button className="text-[12px] font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                          Request Stock
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-5 flex-shrink-0">
            <div>
              <h2 className="text-[15px] font-bold text-gray-900">Pending Incident Reports</h2>
              <p className="text-[12px] text-gray-400 mt-0.5">Awaiting resolution</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer">
              View all <ArrowUpRight size={12} />
            </span>
          </div>
          <div className="flex-1">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide pb-3">Reported By</th>
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide pb-3">Type</th>
                  <th className="text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wide pb-3">Severity</th>
                  <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wide pb-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {incidents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-400">
                      No incident reports
                    </td>
                  </tr>
                ) : (
                  incidents.map((inc, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 text-[13px] font-medium text-gray-800">{inc.reporter}</td>
                      <td className="py-4 text-[13px] text-gray-600">{inc.type}</td>
                      <td className="py-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center text-[11px] font-bold px-2.5 py-0.5 rounded-full min-w-[48px] ${
                            inc.severity === 'High'
                              ? 'bg-red-50 text-red-600 border border-red-100'
                              : inc.severity === 'Medium'
                              ? 'bg-amber-50 text-amber-700 border border-amber-100'
                              : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          }`}
                        >
                          {inc.severity}
                        </span>
                      </td>
                      <td className="py-4 text-[13px] text-gray-400 text-right">{inc.date}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-[11px] text-gray-300 pb-2">
        © 2025 RetailCore Systems Inc. All rights reserved. Main Street Supermarket Admin Portal.
      </p>
    </div>
  )
}
