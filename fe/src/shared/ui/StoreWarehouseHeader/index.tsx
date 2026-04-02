'use client'

import { useAuth } from '@/shared/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

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
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100"
          >
            <LogOut size={14} />
            Đăng xuất
          </button>
        </div>
      </div>
    </header>
  )
}
