'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { UserRole } from '@/shared/types'

interface RouteGuardProps {
  children: ReactNode
  allowedRoles: UserRole[]
  fallback?: ReactNode
}

export function RouteGuard({ children, allowedRoles, fallback }: RouteGuardProps) {
  const router = useRouter()
  const { user, isAuthenticated, hydrated, logout } = useAuthStore()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (!hydrated) return // Wait for Zustand persistence to rehydrate
    if (!isAuthenticated || !user) {
      router.replace('/login')
      return
    }

    // Nếu là WAREHOUSE_MANAGER (role_id = 3, deprecated) thì logout và redirect về login
    if (user.role === 'WAREHOUSE_MANAGER' || user.roleId === 3) {
      logout()
      router.replace('/login')
      return
    }

    if (!allowedRoles.includes(user.role)) {
      // Redirect to the correct portal for this role
      const rolePortalMap: Partial<Record<typeof user.role, string>> = {
        ADMIN: '/admin/dashboard',
        STORE_MANAGER: '/store-manager',
        WAREHOUSE_ADMIN: '/warehouse',
        WAREHOUSE_STAFF: '/warehouse-store',
        STAFF: '/cashier',
        CUSTOMER: '/customer',
      }
      const suggestedPortal = rolePortalMap[user.role] ?? '/login'
      router.replace(suggestedPortal)
      return
    }

    setIsChecking(false)
  }, [isAuthenticated, user, allowedRoles, router, hydrated, logout])

  if (isChecking || !hydrated) {
    return fallback || <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!isAuthenticated || !user) {
    return fallback || null
  }

  return <>{children}</>
}

export default RouteGuard
