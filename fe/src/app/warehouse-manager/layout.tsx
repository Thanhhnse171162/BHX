'use client'

import { useAuth } from '@/shared/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  Truck,
  ArrowLeftRight,
  BarChart3,
  Users,
  ChevronDown,
  Bell,
  Settings,
  LogOut,
  MapPin,
} from 'lucide-react'

export default function WarehouseManagerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isAuthenticated, isLoading, hydrated, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const selectedLocation = 'Warehouse 1 (Regional Hub)'

  useEffect(() => {
    if (!hydrated) return

    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login')
        return
      }

      // Kiểm tra role_id phải là 3 (Warehouse Manager)
      const isWarehouseManager = user?.roleId === 3 || user?.role === 'WAREHOUSE_MANAGER'
      if (user && !isWarehouseManager) {
        router.push('/')
        return
      }
    }
  }, [isAuthenticated, isLoading, user, router, hydrated])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  if (isLoading || !hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2d6e3e]"></div>
      </div>
    )
  }

  const isWarehouseManager = user?.roleId === 3 || user?.role === 'WAREHOUSE_MANAGER'
  if (!isAuthenticated || !user || !isWarehouseManager) {
    return null
  }

  const navigation = [
    { name: 'Dashboard', href: '/warehouse-manager', icon: LayoutDashboard },
    { name: 'Inventory', href: '/warehouse-manager/inventory', icon: Package },
    { name: 'Shipments', href: '/warehouse-manager/shipments', icon: Truck },
    { name: 'Transfers', href: '/warehouse-manager/transfers', icon: ArrowLeftRight },
    { name: 'Reports', href: '/warehouse-manager/reports', icon: BarChart3 },
    { name: 'Staff', href: '/warehouse-manager/staff', icon: Users },
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-4 border-b border-gray-200">
          <div className="w-10 h-10 bg-gradient-to-br from-[#2d6e3e] to-[#1e4d2b] rounded-lg flex items-center justify-center">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="font-bold text-gray-900 text-sm">Warehouse Dashboard</div>
          </div>
        </div>

        {/* Location Selector */}
        <div className="px-4 py-3 border-b border-gray-200">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-2">
            Current Location
          </label>
          <button className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-[#2d6e3e] text-white rounded-lg hover:bg-[#1e4d2b] transition-colors">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium text-left">
                {selectedLocation}
              </span>
            </div>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[#2d6e3e] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#2d6e3e] to-[#1e4d2b] rounded-full flex items-center justify-center text-white font-semibold">
              {user.name?.[0]?.toUpperCase() || 'W'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {user.name}
              </div>
              <div className="text-xs text-gray-500">Warehouse Manager</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div>
            <input
              type="text"
              placeholder="Search inventory..."
              className="w-80 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d6e3e] focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center text-white font-semibold cursor-pointer hover:shadow-lg transition-shadow">
              {user.name?.[0]?.toUpperCase() || 'W'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  )
}
