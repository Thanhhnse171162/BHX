'use client'

import { useAuth } from '@/shared/hooks/useAuth'
import { WarehouseSidebar } from '@/shared/ui/WarehouseSidebar'
import { WarehouseHeader } from '@/shared/ui/WarehouseHeader'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function WarehouseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isAuthenticated, isLoading, hydrated, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Đợi auth store hydrate xong trước khi kiểm tra
    if (!hydrated) {
      return
    }

    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login')
        return
      }
      
      // Nếu là WAREHOUSE_MANAGER (role_id = 3, deprecated) thì logout và redirect về login
      if (user && (user.role === 'WAREHOUSE_MANAGER' || user.roleId === 3)) {
        logout()
        router.push('/login')
        return
      }
      
      // Kiểm tra role_id phải là 7 (Warehouse Admin) hoặc role là WAREHOUSE_ADMIN
      const isWarehouseAdmin = user?.roleId === 7 || user?.role === 'WAREHOUSE_ADMIN'
      if (user && !isWarehouseAdmin) {
        router.push('/')
        return
      }
    }
  }, [isAuthenticated, isLoading, user, router, hydrated, logout])

  if (isLoading || !hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2d6e3e]"></div>
      </div>
    )
  }

  const isWarehouseAdmin = user?.roleId === 7 || user?.role === 'WAREHOUSE_ADMIN'
  if (!isAuthenticated || !user || !isWarehouseAdmin) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <WarehouseSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <WarehouseHeader />

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
