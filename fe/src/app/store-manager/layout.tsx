'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import Link from 'next/link'
import Image from 'next/image'
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Warehouse,
  AlertTriangle,
  BarChart2,
  LogOut,
  Settings,
  Bell,
} from 'lucide-react'

interface StoreManagerLayoutProps {
  children: React.ReactNode
}

const NAV_SECTIONS = [
  {
    label: 'CHÍNH',
    items: [
      { href: '/store-manager', label: 'Màn hình chính', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: 'CỬA HÀNG',
    items: [
      { href: '/store-manager/orders', label: 'Quản lí đơn hàng', icon: ShoppingCart, exact: false },
      { href: '/store-manager/customers', label: 'Khách hàng', icon: Users, exact: false },
    ],
  },
  {
    label: 'VẬN HÀNH',
    items: [
      { href: '/store-manager/inventory', label: 'Kho hàng', icon: Warehouse, exact: false },
      { href: '/store-manager/incidents', label: 'Sự cố', icon: AlertTriangle, exact: false, badge: 'incident' },
    ],
  },
  {
    label: 'BÁO CÁO',
    items: [
      { href: '/store-manager/reports', label: 'Báo cáo doanh thu', icon: BarChart2, exact: false },
    ],
  },
]

export default function StoreManagerLayout({ children }: StoreManagerLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, logout, hydrated } = useAuthStore()
  const [incidentCount, setIncidentCount] = useState<number>(0)

  // Fetch unresolved incident count
  useEffect(() => {
    const fetchIncidentCount = async () => {
      try {
        const res = await fetch('/api/incidents/count')
        if (res.ok) {
          const data = await res.json()
          setIncidentCount(data.count ?? 0)
        }
      } catch { /* silently fail */ }
    }
    fetchIncidentCount()
    const interval = setInterval(fetchIncidentCount, 30_000)
    return () => clearInterval(interval)
  }, [])

  // Auth / role guard
  useEffect(() => {
    if (!hydrated) return
    if (!isAuthenticated || !user) {
      router.push('/login')
      return
    }
    const allowedRoleIds = [2, 1]
    const isAllowed =
      user.role === 'ADMIN' ||
      user.role === 'STORE_MANAGER' ||
      (user.roleId !== undefined && allowedRoleIds.includes(user.roleId as number))

    if (!isAllowed) {
      if (user.role === 'STAFF' || user.roleId === 4) router.push('/cashier')
      else if (user.role === 'CUSTOMER') router.push('/customer')
      else if (user.role === 'WAREHOUSE_ADMIN' || user.roleId === 7) router.push('/warehouse')
      else if (user.role === 'WAREHOUSE_MANAGER' || user.roleId === 3) {
        // Role deprecated - logout và redirect về login
        logout()
        router.push('/login')
      }
      else if (user.roleId === 5) router.push('/warehouse-store')
      else router.push('/login')
    }
  }, [isAuthenticated, user, router, hydrated])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  if (!hydrated || !isAuthenticated || !user) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" /></div>

  const userInitial = user.name ? user.name.charAt(0).toUpperCase() : 'S'

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex font-sans">
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="fixed left-0 top-0 h-screen w-[230px] bg-white border-r border-gray-100 flex flex-col z-40 shadow-sm">
        {/* Brand */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0">
              <Image
                src="/logocty.png"
                alt="Logo"
                width={28}
                height={28}
                className="rounded-lg object-contain"
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>
            <div>
              <p className="text-[15px] font-bold text-gray-900 leading-tight">Bách Hóa Xanh</p>
              <p className="text-[11px] text-green-600 font-medium mt-0.5">Quản lý cửa hàng</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 overflow-y-auto px-2">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="mb-1">
              <p className="text-[10px] font-semibold text-gray-400 tracking-widest px-3 py-1.5 uppercase">
                {section.label}
              </p>
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href)
                const badgeCount = item.badge === 'incident' ? incidentCount : null
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all mb-0.5
                      ${
                        isActive
                          ? 'bg-green-50 text-green-700'
                          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                      }`}
                  >
                    <Icon
                      size={18}
                      className={`flex-shrink-0 ${isActive ? 'text-green-600' : 'text-gray-400'}`}
                      strokeWidth={isActive ? 2.2 : 1.8}
                    />
                    <span className="flex-1 truncate">{item.label}</span>
                    {badgeCount != null && badgeCount > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[11px] font-bold">
                        {badgeCount}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* User profile at bottom */}
        <div className="border-t border-gray-100 px-3 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-gray-900 truncate">{user.name || 'Store Manager'}</p>
              <p className="text-[11px] text-gray-400 truncate">Quản lý cửa hàng</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                title="Cài đặt"
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <Settings size={14} />
              </button>
              <button
                onClick={handleLogout}
                title="Đăng xuất"
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────── */}
      <div className="ml-[230px] flex-1 flex flex-col min-h-screen">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100 h-14 flex items-center gap-4 px-6 shadow-sm">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Tìm đơn hàng, hàng hóa..."
                className="w-full pl-9 pr-4 py-2 text-[13px] bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-green-400 focus:bg-white transition-all placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Notification bell */}
            <button className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
            </button>

            {/* Branch info */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-100 rounded-xl">
              <svg
                className="text-green-600"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span className="text-[13px] font-semibold text-green-700">Chi nhánh Trung tâm #402</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
