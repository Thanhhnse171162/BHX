'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'

export default function Home() {
  const router = useRouter()
  const { user, isAuthenticated, hydrated } = useAuthStore()

  useEffect(() => {
    if (!hydrated) return
    if (!isAuthenticated || !user) return
    
    const portalMap: Partial<Record<typeof user.role, string>> = {
      ADMIN: '/admin/dashboard',
      STORE_MANAGER: '/store-manager',
      WAREHOUSE_MANAGER: '/warehouse-manager',
      WAREHOUSE_ADMIN: '/warehouse',
      WAREHOUSE_STAFF: '/warehouse-store',
      STAFF: '/cashier',
    }
    const portal = portalMap[user.role]
    if (portal) router.replace(portal)
  }, [hydrated, isAuthenticated, user, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to BHX</h1>
        <p className="text-lg text-gray-600">Redirecting...</p>
      </div>
    </div>
  )
}
