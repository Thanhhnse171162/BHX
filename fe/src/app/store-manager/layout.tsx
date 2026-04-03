'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import Link from 'next/link'
import Image from 'next/image'
import {
  LayoutDashboard,
  Archive,
  Warehouse,
  ArrowLeftRight,
  ClipboardCheck,
  AlertTriangle,
  LogOut,
  PackagePlus,
} from 'lucide-react'

interface StoreManagerLayoutProps {
  children: React.ReactNode
}

const PRIMARY_NAV = [
  { href: '/store-manager',                          label: 'Doanh thu',            icon: LayoutDashboard, exact: true  },
  { href: '/store-manager/products',                 label: 'Sản phẩm',            icon: Archive,         exact: false },
  // { href: '/store-manager/inventory',                label: 'Tồn kho kệ hàng',     icon: Archive,         exact: false },
  { href: '/store-manager/inventory-aux',            label: 'Tồn kho kho phụ',     icon: Warehouse,       exact: false },
  { href: '/store-manager/inventory-check',          label: 'Kiểm kê',             icon: ClipboardCheck,  exact: false },
  { href: '/store-manager/purchase-requests',        label: 'Yêu cầu nhập hàng',   icon: PackagePlus,     exact: false },
  { href: '/store-manager/transfers',                label: 'Di chuyển hàng',      icon: ArrowLeftRight,  exact: false },
  { href: '/store-manager/incidents',                label: 'Báo cáo sự cố',       icon: AlertTriangle,   exact: false },
]

const MANAGEMENT_NAV: any[] = []

const HIDDEN_SIDEBAR_LABELS = new Set(['Doanh thu', 'Quản lý đơn hàng', 'Quản lý khách hàng'])

function getPageTitle(pathname: string): string {
  if (pathname === '/store-manager') return 'Doanh thu'
  if (pathname.startsWith('/store-manager/discounts'))         return 'Giảm Giá'
  if (pathname.startsWith('/store-manager/products'))          return 'Sản Phẩm'
  if (pathname.startsWith('/store-manager/inventory-aux'))     return 'Tồn Kho Phụ'
  if (pathname.startsWith('/store-manager/inventory-check'))   return 'Kiểm Kê'
  // if (pathname.startsWith('/store-manager/inventory'))         return 'Tồn Kho Kệ Hàng'
  if (pathname.startsWith('/store-manager/purchase-requests')) return 'Yêu Cầu Nhập Hàng'
  if (pathname.startsWith('/store-manager/transfers'))         return 'Di Chuyển Hàng'
  if (pathname.startsWith('/store-manager/incidents'))         return 'Báo Cáo Sự Cố'
  return 'Quản Lý Cửa Hàng'
}

export default function StoreManagerLayout({ children }: StoreManagerLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, logout, hydrated } = useAuthStore()

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
      else if (user.role === 'WAREHOUSE_MANAGER' || user.roleId === 3) router.push('/warehouse-manager')
      else if (user.role === 'WAREHOUSE_ADMIN' || user.roleId === 7) router.push('/warehouse')
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
  const visiblePrimaryNav = PRIMARY_NAV.filter((item) => !HIDDEN_SIDEBAR_LABELS.has(item.label))
  const visibleManagementNav = MANAGEMENT_NAV.filter((item) => !HIDDEN_SIDEBAR_LABELS.has(item.label))

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex font-sans">

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="fixed left-0 top-0 h-screen w-[220px] bg-white border-r border-gray-200 flex flex-col z-40">

        {/* Brand */}
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-white">
              <Image src="/logocty.png" alt="Bách Hóa Xanh" width={36} height={36} className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-gray-900 leading-tight">Bách Hóa Xanh</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Quản Lý Cửa Hàng</p>
            </div>
          </div>
        </div>

        {/* Navigation – primary items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {visiblePrimaryNav.map((item) => {
            const Icon = item.icon
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + '/')
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
              </Link>
            )
          })}

          {/* Management section */}
          {visibleManagementNav.length > 0 && (
            <p className="text-[10px] font-semibold text-gray-400 tracking-widest px-3 mt-5 mb-2 uppercase">
              Quản lý
            </p>
          )}
          {visibleManagementNav.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
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
            Đăng xuất
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
            {/* User info */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-gray-200">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {userInitial}
              </div>
              <div>
                <p className="text-[13px] font-semibold text-gray-900 leading-tight">{displayName}</p>
                <p className="text-[11px] text-gray-400">Quản Lý Cửa Hàng</p>
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
