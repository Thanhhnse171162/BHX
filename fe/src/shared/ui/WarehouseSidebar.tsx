'use client'

import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart,
  ClipboardCheck,
  UserCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Warehouse,
  Eye,
  LucideIcon
} from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '@/store/auth.store'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

interface NavSection {
  label: string
  icon: LucideIcon
  items: NavItem[]
}

const inventorySection: NavSection = {
  label: 'Inventory',
  icon: Package,
  items: [
    {
      label: 'Overview',
      href: '/warehouse/inventory/overview',
      icon: BarChart3
    },
    {
      label: 'Backroom Stock',
      href: '/warehouse/inventory/backroom',
      icon: Warehouse
    },
    {
      label: 'Shelf Monitoring',
      href: '/warehouse/inventory/shelf',
      icon: Eye
    },
    {
      label: 'Stock Movement',
      href: '/warehouse/stock-movement',
      icon: ShoppingCart
    },
    {
      label: 'Inventory Check',
      href: '/warehouse/checks',
      icon: ClipboardCheck
    }
  ]
}

export function WarehouseSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const logout = useAuthStore((state) => state.logout)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isInventoryOpen, setIsInventoryOpen] = useState(true)

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  // Check if any inventory item is active
  const isInventoryActive = inventorySection.items.some(item => pathname === item.href)

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
              <Warehouse className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Warehouse</h2>
              <p className="text-xs text-white/70">Management</p>
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30">
              <Warehouse className="text-white" size={22} />
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
        {/* Dashboard */}
        <button
          onClick={() => router.push('/warehouse')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
            pathname === '/warehouse'
              ? 'bg-white/20 text-white shadow-sm backdrop-blur-sm border border-white/30'
              : 'text-white/80 hover:bg-white/10 hover:text-white'
          } ${isCollapsed ? 'justify-center' : ''}`}
          title={isCollapsed ? 'Dashboard' : undefined}
        >
          <LayoutDashboard size={20} className={pathname === '/warehouse' ? 'text-white' : 'text-white/70'} />
          {!isCollapsed && (
            <span className="text-sm font-medium">Dashboard</span>
          )}
        </button>

        {/* Inventory Section (Collapsible) */}
        {!isCollapsed ? (
          <div className="space-y-1">
            <button
              onClick={() => setIsInventoryOpen(!isInventoryOpen)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                isInventoryActive
                  ? 'bg-white/10 text-white'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Package size={20} className={isInventoryActive ? 'text-white' : 'text-white/70'} />
                <span className="text-sm font-medium">Inventory</span>
              </div>
              {isInventoryOpen ? (
                <ChevronUp size={16} className="text-white/70" />
              ) : (
                <ChevronDown size={16} className="text-white/70" />
              )}
            </button>
            
            {/* Inventory Sub-items */}
            {isInventoryOpen && (
              <div className="ml-3 pl-3 border-l border-white/20 space-y-1">
                {inventorySection.items.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  
                  return (
                    <button
                      key={item.href}
                      onClick={() => router.push(item.href)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm ${
                        isActive
                          ? 'bg-white/20 text-white shadow-sm backdrop-blur-sm border border-white/30'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Icon size={18} className={isActive ? 'text-white' : 'text-white/60'} />
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          // Collapsed: Show inventory items directly
          inventorySection.items.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`w-full flex items-center justify-center px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-white/20 text-white shadow-sm backdrop-blur-sm border border-white/30'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
                title={item.label}
              >
                <Icon size={20} className={isActive ? 'text-white' : 'text-white/70'} />
              </button>
            )
          })
        )}

        {/* Profile */}
        <button
          onClick={() => router.push('/warehouse/profile')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
            pathname === '/warehouse/profile'
              ? 'bg-white/20 text-white shadow-sm backdrop-blur-sm border border-white/30'
              : 'text-white/80 hover:bg-white/10 hover:text-white'
          } ${isCollapsed ? 'justify-center' : ''}`}
          title={isCollapsed ? 'Profile' : undefined}
        >
          <UserCircle size={20} className={pathname === '/warehouse/profile' ? 'text-white' : 'text-white/70'} />
          {!isCollapsed && (
            <span className="text-sm font-medium">Profile</span>
          )}
        </button>
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
