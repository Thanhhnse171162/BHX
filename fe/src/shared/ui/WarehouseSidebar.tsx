'use client'

import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  Package, 
  ClipboardCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Warehouse,
  LucideIcon,
  FileText,
  ArrowLeftRight,
  RefreshCw,
  Truck,
  Building2,
  BoxIcon,
  BarChart3,
  MapPin
} from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { useAuth } from '@/shared/hooks/useAuth'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  subItems?: NavItem[]
}

import { ROLE_ID_MAP } from '@/shared/types'

function getNavigationItems(userRole?: string): NavItem[] {
  const items: NavItem[] = [
    {
      label: 'Tổng quan',
      href: '/warehouse',
      icon: LayoutDashboard
    },
    {
      label: 'Tồn kho',
      href: '/warehouse/inventory',
      icon: Package,
      subItems: [
        {
          label: 'Tồn kho',
          href: '/warehouse/inventory',
          icon: Package
        },
        {
          label: 'Tồn kho theo lô',
          href: '/warehouse/inventory/batch-movements',
          icon: Warehouse
        },
        {
          label: 'Kiểm kê tồn kho',
          href: '/warehouse/checks',
          icon: ClipboardCheck
        }
      ]
    },
    {
      label: 'Yêu cầu kho',
      href: '/warehouse/requests',
      icon: FileText
    },
    {
      label: 'Di chuyển hàng',
      href: '/warehouse/stock-movement',
      icon: ArrowLeftRight
    },
    {
      label: 'Bổ sung hàng',
      href: '/warehouse/replenishment',
      icon: RefreshCw
    },
    {
      label: 'Quản lý NCC',
      href: '/warehouse/suppliers',
      icon: Truck
    },
    {
      label: 'Quản lý kho',
      href: '/warehouse/management',
      icon: Building2
    },
    {
      label: 'Quản lý sản phẩm',
      href: '/warehouse/products',
      icon: BoxIcon
    }
  ]
  // Only show 'Báo cáo' if not WAREHOUSE_STAFF (role id 5)
  if (userRole !== ROLE_ID_MAP[5]) {
    items.push({
      label: 'Báo cáo',
      href: '/warehouse/reports',
      icon: BarChart3
    })
  }
  return items
}
  {
    label: 'Tổng quan',
    href: '/warehouse',
    icon: LayoutDashboard
  },
  {
    label: 'Tồn kho',
    href: '/warehouse/inventory',
    icon: Package,
    subItems: [
      {
        label: 'Tồn kho',
        href: '/warehouse/inventory',
        icon: Package
      },
      {
        label: 'Tồn kho theo lô',
        href: '/warehouse/inventory/batch-movements',
        icon: Warehouse
      },
      {
        label: 'Kiểm kê tồn kho',
        href: '/warehouse/checks',
        icon: ClipboardCheck
      }
    ]
  },
  {
    label: 'Yêu cầu kho',
    href: '/warehouse/requests',
    icon: FileText
  },
  {
    label: 'Di chuyển hàng',
    href: '/warehouse/stock-movement',
    icon: ArrowLeftRight
  },
  {
    label: 'Bổ sung hàng',
    href: '/warehouse/replenishment',
    icon: RefreshCw
  },
  {
    label: 'Quản lý NCC',
    href: '/warehouse/suppliers',
    icon: Truck
  },
  {
    label: 'Quản lý kho',
    href: '/warehouse/management',
    icon: Building2
  },
  {
    label: 'Quản lý sản phẩm',
    href: '/warehouse/products',
    icon: BoxIcon
  },
  {
    label: 'Báo cáo',
    href: '/warehouse/reports',
    icon: BarChart3
  }
]

export function WarehouseSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const logout = useAuthStore((state) => state.logout)
  const { user } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>(['Inventory'])
  const navigationItems = getNavigationItems(user?.role)

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

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const toggleExpanded = (label: string) => {
    setExpandedItems(prev => 
      prev.includes(label) 
        ? prev.filter(item => item !== label)
        : [...prev, label]
    )
  }

  const isItemActive = (item: NavItem): boolean => {
    if (pathname === item.href) return true
    if (item.subItems) {
      return item.subItems.some(subItem => pathname === subItem.href)
    }
    return false
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
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <Warehouse className="text-[#2d6e3e]" size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Bách hóa xanh</h2>
              <p className="text-xs text-white/70 uppercase">Quản trị trung tâm</p>
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Warehouse className="text-[#2d6e3e]" size={22} />
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

      {/* Location Selector */}
      {!isCollapsed && (
        <div className="px-3 py-3 border-b border-white/10">
          <label className="text-xs font-medium text-white/60 uppercase tracking-wider block mb-2">
            Vị trí hiện tại
          </label>
          <button className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/20">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium text-left">
                {selectedLocation}
              </span>
            </div>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}

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
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = isItemActive(item)
          const isExpanded = expandedItems.includes(item.label)
          const hasSubItems = item.subItems && item.subItems.length > 0

          return (
            <div key={item.label}>
              <button
                onClick={() => {
                  if (hasSubItems && !isCollapsed) {
                    toggleExpanded(item.label)
                  } else {
                    router.push(item.href)
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive && !hasSubItems
                    ? 'bg-white/20 text-white shadow-sm backdrop-blur-sm border border-white/30'
                    : isActive && hasSubItems
                    ? 'bg-white/10 text-white'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                } ${isCollapsed ? 'justify-center' : 'justify-between'}`}
                title={isCollapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon size={20} className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-white/70'}`} />
                  {!isCollapsed && (
                    <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                  )}
                </div>
                {!isCollapsed && hasSubItems && (
                  isExpanded ? (
                    <ChevronUp size={16} className="text-white/70" />
                  ) : (
                    <ChevronDown size={16} className="text-white/70" />
                  )
                )}
              </button>
              
              {/* Sub-items */}
              {hasSubItems && isExpanded && !isCollapsed && (
                <div className="ml-3 pl-3 border-l border-white/20 space-y-1 mt-1">
                  {item.subItems!.map((subItem) => {
                    const SubIcon = subItem.icon
                    const isSubActive = pathname === subItem.href
                    
                    return (
                      <button
                        key={subItem.href}
                        onClick={() => router.push(subItem.href)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm ${
                          isSubActive
                            ? 'bg-white/20 text-white shadow-sm backdrop-blur-sm border border-white/30'
                            : 'text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <SubIcon size={18} className={isSubActive ? 'text-white' : 'text-white/60'} />
                        <span>{subItem.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
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
          title={isCollapsed ? 'Đăng xuất' : undefined}
        >
          <LogOut size={20} />
          {!isCollapsed && (
            <span className="text-sm font-medium">Đăng xuất</span>
          )}
        </button>
      </div>
    </div>
  )
}
