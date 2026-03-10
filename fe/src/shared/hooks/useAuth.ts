import { useAuthStore } from '@/store/auth.store'

/**
 * Custom hook to access authentication state and actions
 * Wraps Zustand auth store for cleaner component usage
 */
export function useAuth() {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isLoading = useAuthStore((state) => state.isLoading)
  const hydrated = useAuthStore((state) => state.hydrated)
  const login = useAuthStore((state) => state.login)
  const logout = useAuthStore((state) => state.logout)
  const hasPermission = useAuthStore((state) => state.hasPermission)
  const hasRole = useAuthStore((state) => state.hasRole)

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    hydrated,
    login,
    logout,
    hasPermission,
    hasRole,
  }
}
