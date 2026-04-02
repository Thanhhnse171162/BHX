'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Warehouse,
  PlusSquare,
  BarChart3,
  Archive,
  Boxes,
  ClipboardCheck
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
    label: 'Xuất hàng',
    href: '/warehouse-store/receive-goods',
    
    icon: <Archive size={20} />
  },
  {
    label: 'Kiểm tra kho',
    href: '/warehouse-store/inventory-check',
    icon: <ClipboardCheck size={20} />
  },
  {
    label: 'Nhập hàng',
    href: '/warehouse-store/dispatch-goods',
    icon: <PlusSquare size={20} />
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
            <p className="mt-1 text-[12px] font-semibold uppercase tracking-wide text-slate-500">Nhân viên kho</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5">
        <ul className="space-y-1.5">
          {sidebarItems.map((item) => {
            let isActive = false;
            if (item.href === '/warehouse-store') {
              isActive = pathname === '/warehouse-store';
            } else {
              isActive = pathname === item.href;
            }
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
    </aside>
  )
}
