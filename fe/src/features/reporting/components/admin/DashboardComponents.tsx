'use client'

import Link from 'next/link'
import { formatCurrency, formatNumber } from '@/shared/utils/format'

// ───────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ───────────────────────────────────────────────────────────────

interface KpiItem {
  title: string
  value: string
  change: string
  trend: 'up' | 'down' | 'flat'
  accent?: 'emerald' | 'amber' | 'red'
}

interface ActivityItem {
  actor: string
  action: string
  time: string
}

interface AlertItem {
  type: 'stock' | 'approval' | 'delivery'
  message: string
  severity: 'low' | 'medium' | 'high'
}

interface ActionItem {
  label: string
  href?: string
  enabled: boolean
}

interface ShortcutItem {
  title: string
  description: string
  href: string
  status: 'Ready' | 'Stub'
}

// ───────────────────────────────────────────────────────────────
// MOCK DATA
// ───────────────────────────────────────────────────────────────

const KPIS: KpiItem[] = [
  {
    title: 'Doanh thu hôm nay',
    value: formatCurrency(125_500_000, 'VND'),
    change: '+4.2% so với hôm qua',
    trend: 'up',
    accent: 'emerald',
  },
  {
    title: 'Đơn online hôm nay',
    value: formatNumber(843, 0),
    change: '+2.1% so với hôm qua',
    trend: 'up',
    accent: 'emerald',
  },
  {
    title: 'Cảnh báo tồn kho thấp',
    value: formatNumber(27, 0),
    change: '3 nhóm hàng cần xử lý',
    trend: 'flat',
    accent: 'amber',
  },
  {
    title: 'User nội bộ đang hoạt động',
    value: formatNumber(156, 0),
    change: '−1 ca nghỉ sớm',
    trend: 'down',
    accent: 'emerald',
  },
]

const RECENT_ACTIVITIES: ActivityItem[] = [
  { actor: 'Nguyễn Văn A', action: 'Tạo khuyến mãi tuần 6', time: '10 phút trước' },
  { actor: 'Trần Thị B', action: 'Cập nhật tồn kho SKU-123', time: '25 phút trước' },
  { actor: 'Lê C', action: 'Phê duyệt đơn nhập hàng', time: '1 giờ trước' },
  { actor: 'Phạm D', action: 'Thêm nhân viên ca tối', time: '2 giờ trước' },
  { actor: 'Võ E', action: 'Khóa tài khoản nội bộ', time: '3 giờ trước' },
  { actor: 'Đặng F', action: 'Điều chỉnh giá mặt hàng', time: 'Hôm qua' },
]

const SYSTEM_ALERTS: AlertItem[] = [
  { type: 'stock', message: 'Tồn kho thấp: Rau xà lách tại kho Q7', severity: 'medium' },
  { type: 'approval', message: 'Đang chờ duyệt: Khuyến mãi "Tết 2026"', severity: 'low' },
  { type: 'delivery', message: 'Đang trễ: 12 đơn giao trong khu vực Q1', severity: 'high' },
]

const ACTIONS: ActionItem[] = [
  { label: 'Tạo tài khoản nội bộ', href: '/admin/users', enabled: true },
  { label: 'Tạo sản phẩm', href: '/admin/catalog/products', enabled: true },
  { label: 'Tạo khuyến mãi', href: '/admin/promotions', enabled: true },
  { label: 'Xem báo cáo', href: '/admin/reports', enabled: true },
]

const SHORTCUTS: ShortcutItem[] = [
  { title: 'Users & Roles', description: 'Quản lý IAM và phân quyền', href: '/admin/users', status: 'Ready' },
  { title: 'Products', description: 'Danh mục hàng hóa', href: '/admin/catalog/products', status: 'Ready' },
  { title: 'Categories', description: 'Phân loại sản phẩm', href: '/admin/catalog/categories', status: 'Ready' },
  { title: 'Promotions', description: 'Chương trình khuyến mãi', href: '/admin/promotions', status: 'Ready' },
  { title: 'Reports', description: 'Phân tích và báo cáo', href: '/admin/reports', status: 'Ready' },
  { title: 'Customers', description: 'Quản lý khách hàng', href: '/admin/customers', status: 'Ready' },
  { title: 'Delivery', description: 'Theo dõi đơn giao hàng', href: '/admin/delivery', status: 'Ready' },
]

// ───────────────────────────────────────────────────────────────
// COMPONENTS
// ───────────────────────────────────────────────────────────────

export function DashboardKpis() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {KPIS.map((kpi, idx) => (
        <div
          key={idx}
          className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4"
        >
          <div className="flex items-start justify-between">
            <h3 className="text-sm font-medium text-gray-600">{kpi.title}</h3>
            <span
              className={
                kpi.accent === 'amber'
                  ? 'px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700'
                  : 'px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700'
              }
            >
              {kpi.trend === 'up' ? '▲' : kpi.trend === 'down' ? '▼' : '—'}
            </span>
          </div>
          <div className="mt-2 text-2xl lg:text-3xl font-bold text-gray-900">{kpi.value}</div>
          <div className="mt-1 text-xs text-gray-500">{kpi.change}</div>
        </div>
      ))}
    </div>
  )
}

export function RecentActivityPanel() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">Hoạt động gần đây</h2>
        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">{RECENT_ACTIVITIES.length} mục</span>
      </div>
      <ul className="divide-y divide-gray-200">
        {RECENT_ACTIVITIES.map((item, idx) => (
          <li key={idx} className="py-3 flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-900 font-medium">{item.actor}</p>
              <p className="text-sm text-gray-600">{item.action}</p>
            </div>
            <span className="text-xs text-gray-500">{item.time}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function SystemAlertsPanel() {
  const getBadgeClasses = (severity: AlertItem['severity']) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-700'
      case 'medium':
        return 'bg-amber-100 text-amber-700'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const getTypeIcon = (type: AlertItem['type']) => {
    switch (type) {
      case 'stock':
        return '📦'
      case 'approval':
        return '✅'
      case 'delivery':
        return '🚚'
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">Cảnh báo hệ thống</h2>
        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">{SYSTEM_ALERTS.length} mục</span>
      </div>
      <ul className="divide-y divide-gray-200">
        {SYSTEM_ALERTS.map((alert, idx) => (
          <li key={idx} className="py-3 flex items-start gap-3">
            <span className="text-xl">{getTypeIcon(alert.type)}</span>
            <div className="flex-1">
              <p className="text-sm text-gray-900">{alert.message}</p>
              <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${getBadgeClasses(alert.severity)}`}>
                {alert.severity === 'high' ? 'Cao' : alert.severity === 'medium' ? 'Trung bình' : 'Thấp'}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function QuickActions() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Hành động nhanh</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ACTIONS.map((a, idx) => (
          a.enabled && a.href ? (
            <Link
              key={idx}
              href={a.href}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
            >
              <span>⚙️</span>
              <span className="font-medium">{a.label}</span>
            </Link>
          ) : (
            <div
              key={idx}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-500 bg-gray-50 cursor-not-allowed"
              title="Chưa triển khai"
            >
              <span>⌛</span>
              <span className="font-medium">{a.label}</span>
            </div>
          )
        ))}
      </div>
    </div>
  )
}

export function ModuleShortcuts() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
      {SHORTCUTS.map((s, idx) => (
        <Link
          key={idx}
          href={s.href}
          className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4 group"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900 group-hover:text-emerald-700">{s.title}</h3>
            <span
              className={`${
                s.status === 'Ready'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-100 text-gray-600'
              } px-2 py-0.5 text-xs rounded-full`}
            >
              {s.status}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-2">{s.description}</p>
        </Link>
      ))}
    </div>
  )
}
