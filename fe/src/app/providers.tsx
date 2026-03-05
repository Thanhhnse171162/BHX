'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/auth.store'

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes - giảm refetch không cần thiết
            gcTime: 10 * 60 * 1000,   // 10 minutes cache
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  )

  const setHydrated = useAuthStore((state) => state.setHydrated)
  const cleanedUp = useRef(false)

  useEffect(() => {
    // Chỉ chạy cleanup 1 lần duy nhất (tránh chạy mỗi lần mount)
    if (!cleanedUp.current && typeof window !== 'undefined') {
      if (!sessionStorage.getItem('__cleaned')) {
        const keysToRemove = ['auth-storage', 'auth_token', 'refresh_token', 'access_token', 'user', 'token']
        keysToRemove.forEach(key => {
          localStorage.removeItem(key)
          sessionStorage.removeItem(key)
        })
        sessionStorage.setItem('__cleaned', '1')
      }
      cleanedUp.current = true
    }
    setHydrated()
  }, [setHydrated])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
