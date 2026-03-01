import { create } from 'zustand'
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

export const useAuthStore = create<AuthStore>()((set, get) => ({
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
}))

export default useAuthStore
