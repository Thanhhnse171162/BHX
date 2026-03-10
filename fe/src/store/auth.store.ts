import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, AuthState, Permission, UserRole } from '@/shared/types'

interface AuthStore extends AuthState {
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setIsLoading: (isLoading: boolean) => void
  login: (user: User, token: string) => void
  logout: () => void
  resetAuth: () => void
  hasPermission: (permission: Permission) => boolean
  hasRole: (role: UserRole) => boolean
  hydrated: boolean
  setHydrated: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      hydrated: false,

      setHydrated: () => {
        set({ hydrated: true })
      },

      setUser: (user) => {
        set({
          user,
          isAuthenticated: !!user,
        })
      },

      setToken: (token) => {
        set({ token })
      },

      setIsLoading: (isLoading) => {
        set({ isLoading })
      },

      login: (user, token) => {
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        })
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })
      },

      resetAuth: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        })
      },

      hasPermission: (permission: Permission) => {
        const { user } = get()
        return user?.permissions.includes(permission) ?? false
      },

      hasRole: (role: UserRole) => {
        const { user } = get()
        return user?.role === role
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Failed to rehydrate auth storage:', error)
        }
        // Normalize/migrate legacy user shape so workplace-based pages work reliably
        const u: any = state?.user
        if (u) {
          const normalizedWorkplaceType =
            u.workplaceType ??
            u.workplace_type ??
            u.workplace?.type ??
            (u.warehouseId ? 'WAREHOUSE' : u.storeId ? 'STORE' : null)

          const normalizedWorkplaceId =
            u.workplaceId ??
            u.workplace_id ??
            u.workplace?.id ??
            u.warehouseId ??
            u.storeId ??
            null

          if (u.workplaceType !== normalizedWorkplaceType || u.workplaceId !== normalizedWorkplaceId) {
            state?.setUser({
              ...u,
              workplaceType: normalizedWorkplaceType,
              workplaceId: normalizedWorkplaceId,
            })
          }
        }
        state?.setHydrated()
      },
    }
  )
)

export default useAuthStore
