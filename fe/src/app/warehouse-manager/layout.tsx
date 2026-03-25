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
  ArrowUpDown,
  BarChart3,
  ClipboardList,
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
  
  // Warehouse mapping dựa trên workplace_id từ database (chữ thường)
  const warehouseNames: { [key: string]: string } = {
    'a0000001-0001-0001-0001-000000000001': 'Kho HCM',
    'a0000001-0001-0001-0001-000000000002': 'Kho Chi Nhánh Quận 12',
    'a0000001-0001-0001-0001-000000000003': 'Kho Chi Nhánh Bình Dương',
    'a0000001-0001-0001-0001-000000000004': 'Kho Chi Nhánh Long An',
    'b0000001-0001-0001-0001-000000000001': 'Cửa Hàng Thủ Đức',
    'b0000001-0001-0001-0001-000000000002': 'Cửa Hàng Giải Phóng HCM',
    'b0000001-0001-0001-0001-000000000003': 'Cửa Hàng Bình Dương',
    'b0000001-0001-0001-0001-000000000004': 'Cửa Hàng Củ Chi',
    'b0000001-0001-0001-0001-000000000005': 'Cửa Hàng Biên Hòa',
    'b0000001-0001-0001-0001-000000000006': 'Cửa Hàng Quận 7',
  }
  
  const selectedLocation = user?.workplaceId 
    ? (warehouseNames[user.workplaceId.toLowerCase()] || warehouseNames[user.workplaceId] || 'Kho Chưa Xác Định')
    : 'Kho Chưa Xác Định'

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
    { name: 'Bảng điều khiển', href: '/warehouse-manager', icon: LayoutDashboard },
    { name: 'Quản lý yêu cầu', href: '/warehouse-manager/requests', icon: ClipboardList },
    { name: 'Tồn kho', href: '/warehouse-manager/inventory', icon: Package },
    { name: 'Lô hàng', href: '/warehouse-manager/shipments', icon: Truck },
    { name: 'Di chuyển hàng', href: '/warehouse-manager/movements', icon: ArrowUpDown },
    { name: 'Lịch sử xuất kho', href: '/warehouse-manager/transfers', icon: ArrowLeftRight },
    { name: 'Báo cáo', href: '/warehouse-manager/reports', icon: BarChart3 },
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
            <div className="font-bold text-gray-900 text-sm">Quản Lý Kho Chi Nhánh</div>
          </div>
        </div>

        {/* Location Selector */}
        <div className="px-4 py-3 border-b border-gray-200">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-2">
            Vị trí hiện tại
          </label>
          <button className="w-full flex items-center justify-start gap-2 px-3 py-2 bg-[#2d6e3e] text-white rounded-lg hover:bg-[#1e4d2b] transition-colors">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium text-left">
                {selectedLocation}
              </span>
            </div>
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
              <div className="text-xs text-gray-500">Quản lý kho</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-6">
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
