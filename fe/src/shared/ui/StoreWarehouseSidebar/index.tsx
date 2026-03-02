'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  TruckIcon, 
  ArrowRightLeft, 
  List, 
  AlertTriangle, 
  TrendingUp,
  ClipboardCheck,
  AlertOctagon,
  Store
} from 'lucide-react'

interface SidebarItem {
  label: string
  href: string
  icon: React.ReactNode
}

const sidebarItems: SidebarItem[] = [
  {
    label: 'Dashboard',
    href: '/warehouse-store',
    icon: <LayoutDashboard size={20} />
  },
  {
    label: 'Receive Goods',
    href: '/warehouse-store/receive-goods',
    icon: <TruckIcon size={20} />
  },
  {
    label: 'Transfer to Shelf',
    href: '/warehouse-store/transfer-to-shelf',
    icon: <ArrowRightLeft size={20} />
  },
  {
    label: 'Inventory List',
    href: '/warehouse-store/inventory',
    icon: <List size={20} />
  },
  {
    label: 'Low Stock Alerts',
    href: '/warehouse-store/low-stock',
    icon: <AlertTriangle size={20} />
  },
  {
    label: 'Restock Request',
    href: '/warehouse-store/restock-request',
    icon: <TrendingUp size={20} />
  },
  {
    label: 'Inventory Check',
    href: '/warehouse-store/inventory-check',
    icon: <ClipboardCheck size={20} />
  },
  {
    label: 'Damaged / Expired',
    href: '/warehouse-store/damaged-expired',
    icon: <AlertOctagon size={20} />
  }
]

export function StoreWarehouseSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-[#2d6e3e] text-white flex-shrink-0 shadow-xl">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center">
            <Store className="text-[#2d6e3e]" size={24} />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">Store Warehouse</h1>
            <p className="text-xs text-green-200">Kho cửa hàng</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <ul className="space-y-1">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-white/20 text-white font-medium' 
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
        <div className="text-xs text-green-200">
          <p className="font-medium">Store #001</p>
          <p className="text-green-300">Chi nhánh Quận 1</p>
        </div>
      </div>
    </aside>
  )
}
