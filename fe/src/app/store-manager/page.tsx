'use client'

import { useState } from 'react'
import {
  DollarSign,
  ShoppingCart,
  Package,
  ClipboardList,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react'

// â”€â”€ KPI cards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const KPI_CARDS = [
  {
    label: "Today's Revenue",
    value: '$4,250.00',
    trend: '+12.5%',
    trendUp: true,
    icon: DollarSign,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    label: 'Total Orders',
    value: '124',
    trend: '+8.2%',
    trendUp: true,
    icon: ShoppingCart,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    label: 'Low Stock Products',
    value: '12',
    warning: true,
    icon: Package,
    iconBg: 'bg-yellow-50',
    iconColor: 'text-yellow-500',
  },
  {
    label: 'Stock Requests',
    value: '3',
    icon: ClipboardList,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    label: 'Incidents',
    value: '2',
    icon: AlertTriangle,
    iconBg: 'bg-red-50',
    iconColor: 'text-red-500',
  },
]

// â”€â”€ Chart data (Monâ€“Sun) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CHART_POINTS = [
  { day: 'Mon', value: 900  },
  { day: 'Tue', value: 1500 },
  { day: 'Wed', value: 2100 },
  { day: 'Thu', value: 2700 },
  { day: 'Fri', value: 4200 },
  { day: 'Sat', value: 3800 },
  { day: 'Sun', value: 5400 },
]

// â”€â”€ Top selling products â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const TOP_PRODUCTS = [
  { name: 'Whole Milk 1L',        units: 142, revenue: '$355.00' },
  { name: 'Organic Bananas (kg)', units: 98,  revenue: '$245.00' },
  { name: 'Whole Wheat Bread',    units: 86,  revenue: '$215.00' },
]

// â”€â”€ Low stock items â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const LOW_STOCK = [
  { product: 'Free Range Eggs 12pk', shelf: 0, back: 0, status: 'Out' },
  { product: 'Hass Avocado',         shelf: 4, back: 0, status: 'Low' },
]

// â”€â”€ Pending incidents â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const INCIDENTS = [
  { reporter: 'Sarah Jenkins',  type: 'Spillage',  date: 'Oct 24' },
  { reporter: 'Mike Thompson',  type: 'Equipment', date: 'Oct 23' },
]

// â”€â”€ SVG smooth line chart â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function SalesChart() {
  const MAX_VAL  = 6000
  const SVG_W    = 520
  const SVG_H    = 170
  const PAD_L    = 38
  const PAD_B    = 22
  const PAD_T    = 8
  const PAD_R    = 10

  const chartW = SVG_W - PAD_L - PAD_R
  const chartH = SVG_H - PAD_B - PAD_T

  const pts = CHART_POINTS.map((d, i) => ({
    x: PAD_L + (i / (CHART_POINTS.length - 1)) * chartW,
    y: PAD_T + chartH - (d.value / MAX_VAL) * chartH,
  }))

  // Build smooth cubic-bezier path
  let lineD = `M${pts[0].x},${pts[0].y}`
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1]
    const curr = pts[i]
    const cpx  = (prev.x + curr.x) / 2
    lineD += ` C${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`
  }
  const areaD = `${lineD} L${pts[pts.length - 1].x},${PAD_T + chartH} L${pts[0].x},${PAD_T + chartH} Z`

  const yTicks = [
    { v: 0,    label: '$0'  },
    { v: 2000, label: '$2k' },
    { v: 4000, label: '$4k' },
    { v: 6000, label: '$6k' },
  ]

  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full" style={{ height: 170 }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#3B82F6" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.01" />
        </linearGradient>
      </defs>

      {/* Y-axis grid lines + labels */}
      {yTicks.map(({ v, label }) => {
        const y = PAD_T + chartH - (v / MAX_VAL) * chartH
        return (
          <g key={label}>
            <line
              x1={PAD_L} y1={y} x2={SVG_W - PAD_R} y2={y}
              stroke="#E2E8F0" strokeWidth="1"
            />
            <text x={PAD_L - 5} y={y + 4} textAnchor="end" fontSize="9.5" fill="#94A3B8">
              {label}
            </text>
          </g>
        )
      })}

      {/* Area fill */}
      <path d={areaD} fill="url(#chartGrad)" />

      {/* Line */}
      <path
        d={lineD}
        fill="none"
        stroke="#3B82F6"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dots */}
      {pts.map((pt, i) => (
        <circle key={i} cx={pt.x} cy={pt.y} r="3.5" fill="white" stroke="#3B82F6" strokeWidth="2" />
      ))}

      {/* X-axis labels */}
      {CHART_POINTS.map((d, i) => (
        <text
          key={d.day}
          x={pts[i].x}
          y={SVG_H - 5}
          textAnchor="middle"
          fontSize="10"
          fill="#94A3B8"
        >
          {d.day}
        </text>
      ))}
    </svg>
  )
}

// â”€â”€ Page component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function StoreManagerDashboard() {
  const [activeFilter, setActiveFilter] = useState<'Today' | 'Yesterday' | 'Last 7 Days'>('Today')

  return (
    <div className="p-6 space-y-5">

      {/* â”€â”€ KPI cards â”€â”€ */}
      <div className="grid grid-cols-5 gap-4">
        {KPI_CARDS.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide leading-tight">
                  {card.label}
                </p>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.iconBg}`}>
                  <Icon size={16} className={card.iconColor} />
                </div>
              </div>

              <p className="text-[22px] font-bold text-gray-900">{card.value}</p>

              {card.trend && (
                <p className={`flex items-center gap-1 text-[12px] font-semibold mt-1 ${card.trendUp ? 'text-green-600' : 'text-red-500'}`}>
                  <TrendingUp size={12} />
                  {card.trend}
                </p>
              )}
              {card.warning && (
                <p className="flex items-center gap-1 text-[12px] font-semibold mt-1 text-yellow-500">
                  <AlertTriangle size={11} />
                  Warning
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* â”€â”€ Chart + Top Products â”€â”€ */}
      <div className="grid grid-cols-3 gap-4">

        {/* Sales Performance chart */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-[15px] font-bold text-gray-900">Sales Performance</h2>
              <p className="text-[12px] text-gray-400 mt-0.5">Daily revenue trend</p>
            </div>
            <div className="flex items-center gap-2">
              {(['Today', 'Yesterday', 'Last 7 Days'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`text-[12px] px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    activeFilter === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f}
                </button>
              ))}
              <button className="text-[12px] px-3 py-1.5 rounded-lg font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                Export
              </button>
            </div>
          </div>
          <SalesChart />
        </div>

        {/* Top Selling Products */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-[15px] font-bold text-gray-900 mb-4">Top Selling Products</h2>
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left text-[10.5px] font-semibold text-gray-400 uppercase tracking-wide pb-2.5">
                  Product Name
                </th>
                <th className="text-right text-[10.5px] font-semibold text-gray-400 uppercase tracking-wide pb-2.5">
                  Units Sold
                </th>
                <th className="text-right text-[10.5px] font-semibold text-gray-400 uppercase tracking-wide pb-2.5">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody>
              {TOP_PRODUCTS.map((p, i) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="py-2.5 text-[13px] text-gray-800 pr-2">{p.name}</td>
                  <td className="py-2.5 text-[13px] text-gray-600 text-right">{p.units}</td>
                  <td className="py-2.5 text-[13px] font-semibold text-gray-900 text-right">{p.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* â”€â”€ Low Stock Alert + Pending Incidents â”€â”€ */}
      <div className="grid grid-cols-2 gap-4">

        {/* Low Stock Alert */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-bold text-gray-900">Low Stock Alert</h2>
            <span className="text-[10.5px] font-bold text-orange-600 bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-lg uppercase tracking-wide">
              Action Required
            </span>
          </div>
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left text-[10.5px] font-semibold text-gray-400 uppercase tracking-wide pb-2.5">
                  Product
                </th>
                <th className="text-center text-[10.5px] font-semibold text-gray-400 uppercase tracking-wide pb-2.5">
                  Shelf / Back
                </th>
                <th className="text-center text-[10.5px] font-semibold text-gray-400 uppercase tracking-wide pb-2.5">
                  Status
                </th>
                <th className="text-center text-[10.5px] font-semibold text-gray-400 uppercase tracking-wide pb-2.5">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {LOW_STOCK.map((item, i) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="py-3 text-[13px] text-gray-800">{item.product}</td>
                  <td className="py-3 text-[13px] text-gray-600 text-center">{item.shelf} / {item.back}</td>
                  <td className="py-3 text-center">
                    <span
                      className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        item.status === 'Out'
                          ? 'bg-red-100 text-red-600'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <button className="text-[12px] font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors">
                      Request Stock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pending Incident Reports */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-[15px] font-bold text-gray-900 mb-4">Pending Incident Reports</h2>
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left text-[10.5px] font-semibold text-gray-400 uppercase tracking-wide pb-2.5">
                  Reported By
                </th>
                <th className="text-left text-[10.5px] font-semibold text-gray-400 uppercase tracking-wide pb-2.5">
                  Type
                </th>
                <th className="text-left text-[10.5px] font-semibold text-gray-400 uppercase tracking-wide pb-2.5">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {INCIDENTS.map((inc, i) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="py-3 text-[13px] text-gray-800">{inc.reporter}</td>
                  <td className="py-3 text-[13px] text-gray-600">{inc.type}</td>
                  <td className="py-3 text-[13px] text-gray-600">{inc.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-[11px] text-gray-400 pb-2">
        Â© 2023 RetailCore Systems Inc. All rights reserved. Main Street Supermarket Admin Portal.
      </p>
    </div>
  )
}

