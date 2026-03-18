'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Warehouse,
  PlusSquare,
  ArrowLeftRight,
  BarChart3,
  Archive,
  Boxes
} from 'lucide-react'

interface SidebarItem {
  label: string
  href: string
  icon: React.ReactNode
}

const sidebarItems: SidebarItem[] = [
  {
    label: 'Tổng quan',
      href: '/warehouse-store',
    icon: <LayoutDashboard size={20} />
  },
  {
    label: 'Kho hàng',
      href: '/warehouse-store/inventory',
    icon: <Warehouse size={20} />
  },
  {
    label: 'Nhập hàng',
      href: '/warehouse-store/receive-goods',
    icon: <PlusSquare size={20} />
  },
  {
    label: 'Xuất hàng',
      href: '/warehouse-store/dispatch-goods',
    icon: <Archive size={20} />
  },
  {
    label: 'Báo cáo',
      href: '/warehouse-store/reports',
    icon: <BarChart3 size={20} />
  }
]

export function StoreWarehouseSidebar() {
  const pathname = usePathname()

  return (
    <aside className="relative flex h-screen w-[250px] flex-shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="px-5 pt-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
            <Boxes size={18} />
          </div>
          <div>
            <h1 className="text-[24px] leading-none font-extrabold text-slate-800">Hệ thống</h1>
            <p className="mt-1 text-[12px] font-semibold uppercase tracking-wide text-slate-500">Quản lý kho hàng</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5">
        <ul className="space-y-1.5">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/warehouse-store' && pathname.startsWith(item.href))
            // Highlight đặc biệt cho Nhập hàng
            const isNhapHang = item.label === 'Nhập hàng'
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 rounded-xl px-3 py-2.5 text-[16px] font-medium transition-all
                    ${isActive 
                      ? isNhapHang 
                        ? 'bg-emerald-100 text-green-700' // Đậm hơn cho Nhập hàng
                        : 'bg-emerald-100 text-emerald-600' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                    }
                  `}
                >
                  <span className={isActive ? (isNhapHang ? 'text-green-700' : 'text-emerald-600') : 'text-slate-500'}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="mx-3 mb-3 rounded-xl bg-slate-100 px-3 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-200 text-emerald-700 text-sm font-bold">
            JD
          </div>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold text-slate-800">John Doe</p>
            <p className="truncate text-[12px] text-slate-500">Nhân viên kho cao cấp</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
