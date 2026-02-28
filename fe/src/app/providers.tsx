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

  // Hydrate auth state from localStorage on mount
  const setHydrated = useAuthStore((state) => state.setHydrated)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
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
