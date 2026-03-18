'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { getStaffNavigation } from '@/shared/config/nav'
import Link from 'next/link'
import Image from 'next/image'
import { Home, Calendar, CheckSquare, Clock, BarChart3, Bell, ChevronLeft, ChevronRight, LogOut } from 'lucide-react'

interface StaffLayoutProps {
  children: React.ReactNode
}

export default function StaffLayout({ children }: StaffLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, logout, hydrated } = useAuthStore()
  const navItems = getStaffNavigation()
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  // Mock badge counts - replace with actual data
  const taskCount = 5
  const announcementCount = 3

  useEffect(() => {
    // Đợi auth store hydrate xong trước khi kiểm tra
    if (!hydrated) {
      return
    }

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
        else if (user.role === 'STORE_MANAGER') router.push('/store-manager')
        else if (user.role === 'WAREHOUSE_MANAGER' || user.roleId === 3) router.push('/warehouse-manager')
        else if (user.role === 'WAREHOUSE_ADMIN' || user.roleId === 7) router.push('/warehouse')
        else if (user.roleId === 5) router.push('/warehouse-store')
      else router.push('/ops')
      return
    }
  }, [isAuthenticated, user, router, hydrated])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  if (!hydrated || !isAuthenticated || !user || user.role !== 'STAFF') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Staff Navigation Sidebar */}
      <aside className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Image
                src="/logocty.png"
                alt="Bách Hóa Xanh Logo"
                width={44}
                height={44}
                className="rounded-lg"
              />
              {!isCollapsed && (
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Store Operations</h1>
                  <p className="text-xs text-gray-500">BHX Store #0123 – District 7</p>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
            )}
          </div>
          {isCollapsed && (
            <button
              onClick={() => setIsCollapsed(false)}
              className="w-full p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Expand sidebar"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 mx-auto" />
            </button>
          )}
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const showBadge = !isCollapsed && (
              (item.label === 'Tasks' && taskCount > 0) ||
              (item.label === 'Announcements' && announcementCount > 0)
            )
            const badgeCount = item.label === 'Tasks' ? taskCount : announcementCount
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-6 py-3.5 transition-all group ${
                  isActive
                    ? 'bg-blue-50 border-r-4 border-blue-600 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={isCollapsed ? item.label : ''}
              >
                <div className={`transition-transform group-hover:scale-110 ${
                  isActive ? 'scale-110' : ''
                }`}>
                  {getIcon(item.icon || '')}
                </div>
                {!isCollapsed && (
                  <>
                    <span className="flex-1 font-medium">{item.label}</span>
                    {showBadge && (
                      <span className="min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-semibold rounded-full flex items-center justify-center">
                        {badgeCount}
                      </span>
                    )}
                  </>
                )}
                {isCollapsed && (taskCount > 0 || announcementCount > 0) && (
                  (item.label === 'Tasks' || item.label === 'Announcements') && (
                    <span className="absolute right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                  )
                )}
              </Link>
            )
          })}
        </nav>

        {/* User Info Footer */}
        <div className="border-t border-gray-200 p-4">
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-11 w-11 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-md">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500">Store Staff</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-gray-600 mx-auto" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className={`min-h-screen transition-all duration-300 ${
        isCollapsed ? 'ml-20' : 'ml-72'
      }`}>
        {children}
      </main>
    </div>
  )
}

function getIcon(iconName: string) {
  const iconProps = { className: "w-5 h-5" }
  
  switch (iconName) {
    case 'Home':
      return <Home {...iconProps} />
    case 'Calendar':
      return <Calendar {...iconProps} />
    case 'CheckSquare':
      return <CheckSquare {...iconProps} />
    case 'Clock':
      return <Clock {...iconProps} />
    case 'BarChart3':
      return <BarChart3 {...iconProps} />
    case 'Bell':
      return <Bell {...iconProps} />
    default:
      return <Home {...iconProps} />
  }
}
