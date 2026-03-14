'use client'

import { useAuth } from '@/shared/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Bell, LogOut, Search, Settings } from 'lucide-react'

export function StoreWarehouseHeader() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <header className="border-b border-slate-200 bg-white px-6 py-3">
      <div className="flex items-center gap-4">
        <div className="relative max-w-[440px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm đơn hàng, SKU, hoặc nhân viên..."
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="ml-auto flex items-center gap-3">
          <button className="relative p-2 text-slate-500 transition-colors hover:text-slate-700" aria-label="Thông báo">
            <Bell size={18} />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
          </button>
          <button className="p-2 text-slate-500 transition-colors hover:text-slate-700" aria-label="Cài đặt">
            <Settings size={18} />
          </button>
          <div className="h-8 w-px bg-slate-200" />
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100"
          >
            <LogOut size={14} />
            Đăng xuất
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-700 text-xs font-bold text-white">
            {(user?.name?.[0] || 'U').toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  )
}
