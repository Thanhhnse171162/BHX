'use client'
import Link from 'next/link'
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  BarChart3,
} from 'lucide-react'

// ─── Mock KPI data ────────────────────────────────────────────────────────────
const KPI_CARDS = [
  {
    label: 'Doanh thu hôm nay',
    value: '24.850.000 ₫',
    change: '+12.5%',
    up: true,
    icon: DollarSign,
    color: 'green',
    sub: 'so với hôm qua',
  },
  {
    label: 'Đơn hàng hôm nay',
    value: '138',
    change: '+8.2%',
    up: true,
    icon: ShoppingCart,
    color: 'blue',
    sub: 'so với hôm qua',
  },
  {
    label: 'Khách hàng mới',
    value: '24',
    change: '-3.1%',
    up: false,
    icon: Users,
    color: 'purple',
    sub: 'so với hôm qua',
  },
  {
    label: 'Sản phẩm sắp hết',
    value: '17',
    change: '+5',
    up: false,
    icon: Package,
    color: 'orange',
    sub: 'cần nhập thêm',
  },
]

// ─── Mock recent orders ───────────────────────────────────────────────────────
const RECENT_ORDERS = [
  { id: 'DH-5821', customer: 'Nguyễn Thị Lan Anh', time: '10:52', total: '385.000 ₫', status: 'Thành công', items: 6 },
  { id: 'DH-5820', customer: 'Trần Văn Hùng',      time: '10:41', total: '122.000 ₫', status: 'Đang xử lý', items: 2 },
  { id: 'DH-5819', customer: 'Lê Thị Hoa',         time: '10:28', total: '540.000 ₫', status: 'Thành công', items: 9 },
  { id: 'DH-5818', customer: 'Phạm Quốc Tuấn',     time: '10:15', total: '89.000 ₫',  status: 'Đã hủy',    items: 1 },
  { id: 'DH-5817', customer: 'Hoàng Minh Đức',     time: '09:58', total: '278.000 ₫', status: 'Thành công', items: 4 },
  { id: 'DH-5816', customer: 'Võ Thị Thu Thảo',    time: '09:40', total: '630.000 ₫', status: 'Thành công', items: 11 },
]

// ─── Mock incidents ───────────────────────────────────────────────────────────
const ACTIVE_INCIDENTS = [
  { id: 'ISS-0241', title: 'Tủ đông khu sữa bị chảy nước', priority: 'urgent', timeAgo: '15 phút trước' },
  { id: 'ISS-0240', title: 'Máy quét mã vạch quầy 3 lỗi', priority: 'medium', timeAgo: '1 giờ trước' },
  { id: 'ISS-0239', title: 'Hết bao bì khu thanh toán',    priority: 'low',    timeAgo: '2 giờ trước' },
]

// ─── Mock hourly sales ────────────────────────────────────────────────────────
const HOURLY_SALES = [
  { hour: '07h', value: 8 },
  { hour: '08h', value: 15 },
  { hour: '09h', value: 22 },
  { hour: '10h', value: 38 },
  { hour: '11h', value: 31 },
  { hour: '12h', value: 42 },
  { hour: '13h', value: 29 },
  { hour: '14h', value: 35 },
  { hour: '15h', value: 48 },
  { hour: '16h', value: 52 },
  { hour: '17h', value: 46 },
  { hour: '18h', value: 33 },
]

const colorMap: Record<string, string> = {
  green:  'bg-green-100 text-green-600',
  blue:   'bg-blue-100 text-blue-600',
  purple: 'bg-purple-100 text-purple-600',
  orange: 'bg-orange-100 text-orange-600',
}

const statusConfig: Record<string, { icon: React.ReactNode; cls: string }> = {
  'Thành công': {
    icon: <CheckCircle size={13} className="text-green-600" />,
    cls: 'bg-green-50 text-green-700',
  },
  'Đang xử lý': {
    icon: <Clock size={13} className="text-blue-600" />,
    cls: 'bg-blue-50 text-blue-700',
  },
  'Đã hủy': {
    icon: <XCircle size={13} className="text-red-500" />,
    cls: 'bg-red-50 text-red-600',
  },
}

const priorityConfig: Record<string, { label: string; cls: string }> = {
  urgent: { label: 'Khẩn cấp', cls: 'bg-red-100 text-red-700' },
  medium: { label: 'Trung bình', cls: 'bg-yellow-100 text-yellow-700' },
  low:    { label: 'Thấp',      cls: 'bg-gray-100 text-gray-600' },
}

const maxBar = Math.max(...HOURLY_SALES.map((h) => h.value))

export default function StoreManagerDashboard() {
  const today = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="p-6 space-y-6">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tổng quan cửa hàng</h1>
          <p className="text-[13px] text-gray-500 mt-0.5 capitalize">{today}</p>
        </div>
        <Link
          href="/store-manager/reports"
          className="flex items-center gap-1.5 text-[13px] font-medium text-green-700 hover:text-green-800 bg-green-50 border border-green-100 px-4 py-2 rounded-xl transition-colors"
        >
          <BarChart3 size={15} />
          Xem báo cáo đầy đủ
        </Link>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[card.color]}`}>
                  <Icon size={20} />
                </div>
                <span className={`flex items-center gap-0.5 text-[12px] font-semibold ${card.up ? 'text-green-600' : 'text-red-500'}`}>
                  {card.up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {card.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-3">{card.value}</p>
              <p className="text-[12px] text-gray-500 mt-0.5">{card.label}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{card.sub}</p>
            </div>
          )
        })}
      </div>

      {/* ── Middle row: Chart + Incidents ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Hourly sales chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-semibold text-gray-800">Doanh thu theo giờ</h2>
            <span className="text-[12px] text-gray-400">Hôm nay</span>
          </div>
          {/* Simple bar chart */}
          <div className="flex items-end gap-1.5 h-36">
            {HOURLY_SALES.map((h) => (
              <div key={h.hour} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-md bg-green-400 hover:bg-green-500 transition-colors cursor-default"
                  style={{ height: `${(h.value / maxBar) * 100}%` }}
                  title={`${h.hour}: ${h.value} đơn`}
                />
                <span className="text-[9px] text-gray-400">{h.hour}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Active incidents */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-semibold text-gray-800 flex items-center gap-2">
              <AlertTriangle size={15} className="text-orange-500" />
              Sự cố đang mở
            </h2>
            <Link href="/store-manager/incidents" className="text-[12px] text-green-600 hover:underline">
              Xem tất cả
            </Link>
          </div>
          <div className="space-y-2.5">
            {ACTIVE_INCIDENTS.map((inc) => {
              const pc = priorityConfig[inc.priority]
              return (
                <div key={inc.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-medium text-gray-800 truncate">{inc.title}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{inc.id} · {inc.timeAgo}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${pc.cls}`}>
                    {pc.label}
                  </span>
                </div>
              )
            })}
          </div>
          {ACTIVE_INCIDENTS.length === 0 && (
            <p className="text-[13px] text-gray-400 text-center py-4">Không có sự cố nào</p>
          )}
        </div>
      </div>

      {/* ── Recent orders ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-[14px] font-semibold text-gray-800">Đơn hàng gần đây</h2>
          <Link
            href="/store-manager/orders"
            className="flex items-center gap-1 text-[12px] text-green-600 hover:underline font-medium"
          >
            Xem tất cả <ArrowRight size={13} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Mã đơn</th>
                <th className="text-left py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Khách hàng</th>
                <th className="text-left py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Thời gian</th>
                <th className="text-left py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">SL</th>
                <th className="text-left py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Tổng tiền</th>
                <th className="text-left py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_ORDERS.map((order, idx) => {
                const sc = statusConfig[order.status] ?? {
                  icon: null,
                  cls: 'bg-gray-100 text-gray-600',
                }
                return (
                  <tr
                    key={order.id}
                    className={`border-t border-gray-50 hover:bg-green-50/40 transition-colors cursor-pointer ${idx % 2 === 0 ? '' : 'bg-gray-50/30'}`}
                  >
                    <td className="py-3.5 px-5 font-mono font-medium text-gray-700">{order.id}</td>
                    <td className="py-3.5 px-5 text-gray-800">{order.customer}</td>
                    <td className="py-3.5 px-5 text-gray-500">{order.time}</td>
                    <td className="py-3.5 px-5 text-gray-600">{order.items} sản phẩm</td>
                    <td className="py-3.5 px-5 font-semibold text-gray-800">{order.total}</td>
                    <td className="py-3.5 px-5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${sc.cls}`}>
                        {sc.icon}
                        {order.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
