'use client'

import { useAuth } from '@/shared/hooks/useAuth'
import { StoreWarehouseSidebar } from '@/shared/ui/StoreWarehouseSidebar'
import { StoreWarehouseHeader } from '@/shared/ui/StoreWarehouseHeader'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function StoreWarehouseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login')
        return
      }
      
      // Kiểm tra role_id phải là 4 (Warehouse Staff) và email có @company.com
      if (user && (user.roleId !== 4 || !user.email?.endsWith('@company.com'))) {
        router.push('/')
        return
      }
    }
  }, [isAuthenticated, isLoading, user, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2d6e3e]"></div>
      </div>
    )
  }

  if (!isAuthenticated || !user || user.roleId !== 4 || !user.email?.endsWith('@company.com')) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <StoreWarehouseSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <StoreWarehouseHeader />

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
