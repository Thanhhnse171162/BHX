'use client'

import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { getAdminNavigation } from '@/shared/config/nav'
import { RouteGuard } from '@/shared/auth/RouteGuard'
import { LogoutButton } from '@/shared/ui/LogoutButton'
import { AdminSidebar } from '@/shared/ui/Sidebar/AdminSidebar'

function AdminShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  const { sidebarOpen, toggleSidebar } = useUIStore()

  const navGroups = getAdminNavigation()

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Redesigned Sidebar */}
      <AdminSidebar 
        navigation={navGroups} 
        isCollapsed={!sidebarOpen}
        onToggleCollapse={toggleSidebar}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Professional Top Bar */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
              <span className="px-3 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full">
                LIVE
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* User Info */}
              <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-full flex items-center justify-center font-semibold shadow-md">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-slate-900">{user?.name}</div>
                  <div className="text-xs text-slate-500">{user?.role}</div>
                </div>
              </div>

              {/* Professional Logout Button */}
              <LogoutButton variant="default" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 to-gray-100">{children}</div>
      </main>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRoles={['ADMIN']}>
      <AdminShell>{children}</AdminShell>
    </RouteGuard>
  )
}
