'use client'

import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart,
  AlertTriangle,
  XCircle,
  ClipboardCheck,
  Users,
  UserCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  LucideIcon
} from 'lucide-react'
import { useState } from 'react'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/warehouse',
    icon: LayoutDashboard
  },
  {
    label: 'Inventory',
    href: '/warehouse/inventory',
    icon: Package
  },
  {
    label: 'Stock Movement',
    href: '/warehouse/stock-movement',
    icon: ShoppingCart
  },
  {
    label: 'Low Stock',
    href: '/warehouse/low-stock',
    icon: AlertTriangle
  },
  {
    label: 'Out of Stock',
    href: '/warehouse/out-of-stock',
    icon: XCircle
  },
  {
    label: 'Inventory Checks',
    href: '/warehouse/checks',
    icon: ClipboardCheck
  },
  {
    label: 'Attendance',
    href: '/warehouse/attendance',
    icon: Users
  },
  {
    label: 'Profile',
    href: '/warehouse/profile',
    icon: UserCircle
  }
]

export function WarehouseSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleLogout = () => {
    // Clear auth data
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  return (
    <div 
      className={`bg-gradient-to-b from-[#2d6e3e] to-[#1f5b2e] flex flex-col transition-all duration-300 shadow-xl ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Logo/Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
        {!isCollapsed ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30">
              <Package className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Warehouse</h2>
              <p className="text-xs text-white/70">Management</p>
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30">
              <Package className="text-white" size={22} />
            </div>
          </div>
        )}
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            title="Collapse"
          >
            <ChevronLeft size={18} className="text-white" />
          </button>
        )}
      </div>

      {/* Expand Button (when collapsed) */}
      {isCollapsed && (
        <div className="px-3 mt-3">
          <button
            onClick={() => setIsCollapsed(false)}
            className="w-full p-2 hover:bg-white/10 rounded-lg transition-colors flex justify-center"
            title="Expand"
          >
            <ChevronRight size={18} className="text-white" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isActive
                  ? 'bg-white/20 text-white shadow-sm backdrop-blur-sm border border-white/30'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              } ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon size={20} className={isActive ? 'text-white' : 'text-white/70'} />
              {!isCollapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-100 hover:bg-red-500/20 transition-colors border border-transparent hover:border-red-400/30 ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? 'Logout' : undefined}
        >
          <LogOut size={20} />
          {!isCollapsed && (
            <span className="text-sm font-medium">Logout</span>
          )}
        </button>
      </div>
    </div>
  )
}
