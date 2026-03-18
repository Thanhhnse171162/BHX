'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import Link from 'next/link'
import Image from 'next/image'
import {
  LayoutDashboard,
  Monitor,
  Users,
  Package,
  ClipboardList,
  AlertTriangle,
  LogOut,
} from 'lucide-react'

interface CashierLayoutProps {
  children: React.ReactNode
}

const navItems = [
  {
    href: '/cashier',
    label: 'Dashboard',
    icon: LayoutDashboard,
    badge: null,
  },
  {
    href: '/cashier/pos',
    label: 'POS Bán hàng',
    icon: Monitor,
    badge: null,
  },
  {
    href: '/cashier/customers',
    label: 'Khách hàng',
    icon: Users,
    badge: null,
  },
  {
    href: '/cashier/products',
    label: 'Sản phẩm',
    icon: Package,
    badge: null,
  },
  {
    href: '/cashier/invoices',
    label: 'Lịch sử hóa đơn',
    icon: ClipboardList,
    badge: null,
  },
  {
    href: '/cashier/incidents',
    label: 'Báo cáo sự cố',
    icon: AlertTriangle,
    badge: 'incident',
  },
]

export default function CashierLayout({ children }: CashierLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, logout, hydrated } = useAuthStore()
  const [incidentCount, setIncidentCount] = useState<number>(0)

  // Fetch unresolved incident count from API
  useEffect(() => {
    const fetchIncidentCount = async () => {
      try {
        const res = await fetch('/api/incidents/count')
        if (res.ok) {
          const data = await res.json()
          setIncidentCount(data.count ?? 0)
        }
      } catch {
        // silently fail — badge just won't show
      }
    }

    fetchIncidentCount()
    // Refresh every 30 seconds to pick up new incidents
    const interval = setInterval(fetchIncidentCount, 30_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Đợi auth store hydrate xong trước khi kiểm tra
    if (!hydrated) {
      return
    }

    if (!isAuthenticated || !user) {
      router.push('/login')
      return
    }
    const allowedRoles = ['STAFF', 'ADMIN']
    const allowedRoleIds = [4, 1] // Store Staff (role 4) và Admin (role 1)
    const isAllowed =
      allowedRoles.includes(user.role) ||
      (user.roleId !== undefined && allowedRoleIds.includes(user.roleId))

    if (!isAllowed) {
      if (user.role === 'ADMIN') {
        router.push('/admin/dashboard')
      } else if (user.role === 'CUSTOMER') {
        router.push('/customer')
      } else if (user.role === 'STORE_MANAGER') {
        router.push('/store-manager')
      } else if (user.role === 'WAREHOUSE_MANAGER' || user.roleId === 3) {
        router.push('/warehouse-manager')
      } else if (user.role === 'WAREHOUSE_ADMIN' || user.roleId === 7) {
        router.push('/warehouse')
      } else if (user.roleId === 5) {
        router.push('/warehouse-store')
      } else {
        router.push('/login')
      }
    }
  }, [isAuthenticated, user, router, hydrated])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  if (!hydrated || !isAuthenticated || !user) return null

  const userInitial = user.name ? user.name.charAt(0).toUpperCase() : 'U'

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-[240px] bg-white border-r border-gray-200 flex flex-col z-40 shadow-sm">
        {/* Brand */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Image
              src="/logocty.png"
              alt="Bách Hóa Xanh Logo"
              width={40}
              height={40}
              className="rounded-xl object-contain"
            />
            <div>
              <p className="text-[17px] font-bold text-gray-900 leading-tight font-sans tracking-tight">
                Bách Hóa Xanh
              </p>
              <p className="text-[13px] text-green-600 font-medium font-sans mt-0.5">
                Store Staff Portal
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              item.href === '/cashier'
                ? pathname === '/cashier'
                : pathname.startsWith(item.href)
            const badgeCount = item.badge === 'incident' ? incidentCount : null

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-[18px] font-medium transition-all duration-150 font-sans ${
                  isActive
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon
                  size={22}
                  className={`flex-shrink-0 ${
                    isActive ? 'text-green-600' : 'text-gray-500'
                  }`}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                <span className="flex-1">{item.label}</span>
                {badgeCount != null && badgeCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full bg-orange-500 text-white text-[13px] font-bold leading-none">
                    {badgeCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

      </aside>

      {/* Main content */}
      <div className="ml-[240px] flex-1 flex flex-col min-h-screen font-sans">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 h-14 flex items-center justify-end px-6 gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[14px] font-semibold text-gray-900 leading-tight font-sans">{user.name}</p>
              <p className="text-[12px] text-gray-500 font-sans">Store Staff</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 font-sans">
              {userInitial}
            </div>
            <button
              onClick={handleLogout}
              title="Đăng xuất"
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
