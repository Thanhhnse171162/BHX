'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { getStaffNavigation } from '@/shared/config/nav'
import Link from 'next/link'

interface StaffLayoutProps {
  children: React.ReactNode
}

export default function StaffLayout({ children }: StaffLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, logout } = useAuthStore()
  const navItems = getStaffNavigation()

  useEffect(() => {
    // Check authentication and role
    if (!isAuthenticated || !user) {
      router.push('/login')
      return
    }

    // Check if user is staff (roleId = 5 hoặc role = 'STAFF')
    const isStaff = user.role === 'STAFF' || user.roleId === 5
    const hasCompanyEmail = user.email.toLowerCase().endsWith('@company.com')

    if (!isStaff || !hasCompanyEmail) {
      // Redirect to appropriate page based on role
      if (user.role === 'ADMIN') router.push('/admin/dashboard')
      else if (user.role === 'CUSTOMER') router.push('/customer')
      else router.push('/ops')
      return
    }
  }, [isAuthenticated, user, router])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  if (!isAuthenticated || !user || user.role !== 'STAFF') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Staff Navigation Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-emerald-600 text-white flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold">Staff Portal</h1>
          <p className="text-emerald-100 text-sm mt-1">Bách Hóa Xanh</p>
        </div>
        
        <nav className="flex-1 mt-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                pathname === item.href
                  ? 'bg-emerald-500 border-l-4 border-white'
                  : 'hover:bg-emerald-500'
              }`}
            >
              <span className="text-xl">{getIcon(item.icon || '')}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* User Info */}
        <div className="border-t border-emerald-500 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{user.name}</p>
              <p className="text-xs text-emerald-200">Staff</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2 px-4 bg-emerald-700 hover:bg-emerald-800 rounded-lg text-sm font-medium transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 min-h-screen">
        {children}
      </main>
    </div>
  )
}

function getIcon(iconName: string): string {
  const icons: Record<string, string> = {
    Home: '🏠',
    Calendar: '📅',
    CheckSquare: '✅',
    Clock: '🕒',
    BarChart3: '📊',
    Bell: '🔔',
  }
  return icons[iconName] || '📌'
}
