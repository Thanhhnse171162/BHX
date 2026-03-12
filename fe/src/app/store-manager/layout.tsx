'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import Link from 'next/link'
import {
  LayoutDashboard,
  TrendingUp,
  Archive,
  Warehouse,
  ClipboardList,
  AlertTriangle,
  Package,
  Settings,
  LogOut,
  Bell,
  Store,
} from 'lucide-react'

interface StoreManagerLayoutProps {
  children: React.ReactNode
}

const PRIMARY_NAV = [
  { href: '/store-manager',            label: 'Dashboard',           icon: LayoutDashboard, exact: true  },
  { href: '/store-manager/reports',    label: 'Sales Overview',      icon: TrendingUp,      exact: false },
  { href: '/store-manager/inventory',  label: 'Shelf Inventory',     icon: Archive,         exact: false },
  { href: '/store-manager/inventory',  label: 'Backroom Inventory',  icon: Warehouse,       exact: false },
  { href: '/store-manager/orders',     label: 'Stock Requests',      icon: ClipboardList,   exact: false },
  { href: '/store-manager/incidents',  label: 'Incident Reports',    icon: AlertTriangle,   exact: false, badge: 'incident' },
]

const MANAGEMENT_NAV = [
  { href: '/store-manager/customers',  label: 'Product Management',  icon: Package,         exact: false },
  { href: '/store-manager',            label: 'Settings',            icon: Settings,        exact: false },
]

// Map pathname → page title
function getPageTitle(pathname: string): string {
  if (pathname === '/store-manager') return 'Store Manager Dashboard'
  if (pathname.startsWith('/store-manager/reports'))   return 'Sales Overview'
  if (pathname.startsWith('/store-manager/inventory')) return 'Shelf Inventory'
  if (pathname.startsWith('/store-manager/incidents')) return 'Incident Reports'
  if (pathname.startsWith('/store-manager/orders'))    return 'Stock Requests'
  if (pathname.startsWith('/store-manager/customers')) return 'Customers'
  return 'Store Manager'
}

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

  if (!hydrated || !isAuthenticated || !user) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const userInitial = user.name ? user.name.charAt(0).toUpperCase() : 'A'
  const displayName = user.name || 'Alex Rivera'
  const pageTitle   = getPageTitle(pathname)
  const headerDate  = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex font-sans">

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="fixed left-0 top-0 h-screen w-[220px] bg-white border-r border-gray-200 flex flex-col z-40">

        {/* Brand */}
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Store size={18} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[12.5px] font-bold text-gray-900 leading-tight">
                Main Street<br />Supermarket
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">Retail ERP v2.0</p>
            </div>
          </div>
        </div>

        {/* Navigation – primary items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {PRIMARY_NAV.map((item) => {
            const Icon = item.icon
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href
            const badgeCount = item.badge === 'incident' ? incidentCount : null
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all mb-0.5
                  ${isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                  }`}
              >
                <Icon
                  size={17}
                  className={`flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                <span className="flex-1 truncate">{item.label}</span>
                {badgeCount != null && badgeCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
                    {badgeCount}
                  </span>
                )}
              </Link>
            )
          })}

          {/* Management section */}
          <p className="text-[10px] font-semibold text-gray-400 tracking-widest px-3 mt-5 mb-2 uppercase">
            Management
          </p>
          {MANAGEMENT_NAV.map((item) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href) && item.href !== '/store-manager'
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all mb-0.5
                  ${isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                  }`}
              >
                <Icon size={17} className={`flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} strokeWidth={1.8} />
                <span className="flex-1 truncate">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-gray-100 px-3 py-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-[13px] font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut size={17} strokeWidth={1.8} />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────── */}
      <div className="ml-[220px] flex-1 flex flex-col min-h-screen">

        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 h-16 flex items-center px-6 gap-4">
          {/* Page title + date */}
          <div>
            <h1 className="text-[16px] font-bold text-gray-900 leading-tight">{pageTitle}</h1>
            <p className="text-[12px] text-gray-400">{headerDate}</p>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Notification bell */}
            <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">
              <Bell size={20} />
              {incidentCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
              )}
            </button>

            {/* User info */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-gray-200">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {userInitial}
              </div>
              <div>
                <p className="text-[13px] font-semibold text-gray-900 leading-tight">{displayName}</p>
                <p className="text-[11px] text-gray-400">Store Manager</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
