import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, AuthState, Permission, UserRole } from '@/shared/types'

// Flag: login() was called before hydration completes → skip stale setUser() in onRehydrateStorage
let _freshLoginBeforeHydration = false

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
        // If hydration hasn't finished yet, record that a fresh login is happening.
        // onRehydrateStorage must NOT overwrite this new user with stale localStorage data.
        if (!get().hydrated) {
          _freshLoginBeforeHydration = true
        }
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        })
      },

      logout: () => {
        // Xóa cả localStorage để tránh stale role sau khi logout
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-storage')
        }
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
      onRehydrateStorage: (fullState) => (persistedState, error) => {
        if (error) {
          console.error('Failed to rehydrate auth storage:', error)
        }
        // NOTE: `persistedState` is the partial persisted state (user, token, isAuthenticated only).
        // `fullState` (outer param) is the full store with all actions — use it to call actions.

        // If login() was called before hydration (e.g. autofill + instant submit),
        // the store already has the fresh user — do NOT overwrite with stale localStorage data.
        if (_freshLoginBeforeHydration) {
          _freshLoginBeforeHydration = false
          fullState?.setHydrated()
          return
        }
        _freshLoginBeforeHydration = false

        // Normalize/migrate legacy user shape so workplace-based pages work reliably
        const u: any = (persistedState as any)?.user
        if (u && fullState) {
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
            fullState.setUser({
              ...u,
              workplaceType: normalizedWorkplaceType,
              workplaceId: normalizedWorkplaceId,
            })
          }
        }
        // fullState has the actual store actions — state?.setHydrated() on persistedState was a no-op
        fullState?.setHydrated()
      },
    }
  )
)

export default useAuthStore
