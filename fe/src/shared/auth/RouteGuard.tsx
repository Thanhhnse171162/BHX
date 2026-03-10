'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { UserRole } from '@/shared/types'

interface RouteGuardProps {
  children: ReactNode
  allowedRoles: UserRole[]
  fallback?: ReactNode
}

export function RouteGuard({ children, allowedRoles, fallback }: RouteGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, hydrated } = useAuthStore()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Đợi zustand persist hydrate xong trước khi kiểm tra
    if (!hydrated) {
      setIsChecking(true)
      return
    }

    if (!isAuthenticated || !user) {
      router.replace('/login')
      return
    }

    if (!allowedRoles.includes(user.role)) {
      // Nếu role không đúng, tự động chuyển sang portal phù hợp, không hiển thị màn hình cảnh báo
      const isInternalUser = ['STAFF', 'STORE_MANAGER', 'WAREHOUSE_MANAGER', 'ADMIN'].includes(user.role)
      const isCustomerUser = user.role === 'CUSTOMER'
      const isOnCustomerPortal = pathname?.startsWith('/customer')
      const isOnOpsPortal = pathname?.startsWith('/ops')
      const isOnAdminPortal = pathname?.startsWith('/admin')

      let suggestedPortal = '/login'

      if (isCustomerUser && (isOnOpsPortal || isOnAdminPortal)) {
        suggestedPortal = '/customer'
      } else if (isInternalUser && isOnCustomerPortal) {
        suggestedPortal = user.role === 'ADMIN' ? '/admin' : '/ops'
      }

      router.replace(suggestedPortal)
      return
    }

    setIsChecking(false)
  }, [isAuthenticated, user, allowedRoles, router, pathname, hydrated])

  if (isChecking || !hydrated) {
    return fallback || <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!isAuthenticated || !user) {
    return fallback || null
  }

  return <>{children}</>
}

export default RouteGuard
