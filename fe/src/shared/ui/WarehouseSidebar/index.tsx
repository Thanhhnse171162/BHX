'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Package, 
  List, 
  AlertTriangle, 
  ClipboardCheck,
  ArrowDownUp,
  XCircle
} from 'lucide-react'

interface SidebarItem {
  label: string
  href: string
  icon: React.ReactNode
}

const sidebarItems: SidebarItem[] = [
  {
    label: 'Dashboard',
    href: '/warehouse',
    icon: <LayoutDashboard size={20} />
  },
  {
    label: 'Stock In / Stock Out',
    href: '/warehouse/stock-movement',
    icon: <ArrowDownUp size={20} />
  },
  {
    label: 'Inventory List',
    href: '/warehouse/inventory',
    icon: <List size={20} />
  },
  {
    label: 'Low Stock Alerts',
    href: '/warehouse/low-stock',
    icon: <AlertTriangle size={20} />
  },
  {
    label: 'Out of Stock',
    href: '/warehouse/out-of-stock',
    icon: <XCircle size={20} />
  },
  {
    label: 'Inventory Checks',
    href: '/warehouse/checks',
    icon: <ClipboardCheck size={20} />
  }
]

export function WarehouseSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-[#2d6e3e] text-white flex-shrink-0 shadow-xl">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center">
            <Package className="text-[#2d6e3e]" size={24} />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">Warehouse System</h1>
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
    </aside>
  )
}
