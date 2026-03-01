'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth.store'

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  )

  // Clear any old auth data from localStorage/sessionStorage on mount
  // (since we now use in-memory storage only)
  const setHydrated = useAuthStore((state) => state.setHydrated)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Clean up old auth data from previous implementation
    if (typeof window !== 'undefined') {
      const keysToRemove = [
        'auth-storage',
        'auth_token',
        'refresh_token',
        'access_token',
        'user',
        'token',
      ]
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
        sessionStorage.removeItem(key)
      })
    }
    
    setHydrated()
    setMounted(true)
  }, [setHydrated])

  return (
    <QueryClientProvider client={queryClient}>
      {mounted ? children : (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2d6e3e]"></div>
        </div>
      )}
    </QueryClientProvider>
  )
}
