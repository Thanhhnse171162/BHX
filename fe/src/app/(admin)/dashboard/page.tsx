'use client'

import { PageHeader } from '@/shared/ui/PageHeader'
import { useAuthStore } from '@/store/auth.store'
import { ROLE_ID_MAP } from '@/shared/types'
import {
  DashboardKpis,
  RecentActivityPanel,
  SystemAlertsPanel,
  QuickActions,
  ModuleShortcuts,
} from '@/features/reporting/components/admin/DashboardComponents'

export default function AdminDashboard() {
  const user = useAuthStore((state) => state.user)
  // roleId 5 = WAREHOUSE_STAFF
  const showReport = user?.role !== ROLE_ID_MAP[5]
  return (
    <div className="px-6 py-8 min-h-full">
      {/* Professional Page Header */}
      <div className="mb-8">
        <PageHeader
          title="Bảng điều hành quản trị"
          subtitle="Quản trị hệ thống chuỗi bán lẻ"
          actions={
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-medium shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              Hôm nay
            </span>
          }
        />
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* KPI cards with enhanced styling */}
        {showReport && (
          <div className="transform transition-all duration-300 hover:scale-[1.01]">
            <DashboardKpis />
          </div>
        )}

        {/* Two-column panels with card styling */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <RecentActivityPanel />
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <SystemAlertsPanel />
            </div>
          </div>
        </div>

        {/* Quick actions with hover effects */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
          <QuickActions />
        </div>

        {/* Module shortcuts with professional styling */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
          <ModuleShortcuts />
        </div>
      </div>
    </div>
  )
}
