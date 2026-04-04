import axios, { AxiosInstance } from 'axios'
import { useAuthStore } from '@/store/auth.store'

const AUTH_WAIT_INTERVAL_MS = 100
const AUTH_WAIT_MAX_ATTEMPTS = 30

async function waitForAuthHydration(): Promise<string> {
  if (typeof window === 'undefined') {
    return ''
  }

  let attempts = 0
  while (!useAuthStore.getState().hydrated && attempts < AUTH_WAIT_MAX_ATTEMPTS) {
    await new Promise((resolve) => setTimeout(resolve, AUTH_WAIT_INTERVAL_MS))
    attempts++
  }

  return useAuthStore.getState().token || ''
}

// Call Next.js API route (local DB-backed users)
const localApiClient: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

localApiClient.interceptors.request.use(async (config) => {
  const token = await waitForAuthHydration()

  if (token) {
    config.headers = config.headers || {}
    if (!config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }

  return config
})

export interface UserInfoFromAPI {
  id: string
  full_name?: string
  fullName?: string
  name?: string
  email?: string
  status?: string
  role?: {
    id?: number
    name?: string
    description?: string
  } | null
  workplace?: {
    type?: string
    id?: string | number | null
    name?: string | null
    code?: string | null
    address?: string | null
  } | null
  workplaceType?: string | null
  workplaceId?: string | number | null
  workplace_type?: string | null
  workplace_id?: string | number | null
}

export class UserAPIService {
  static async getAll(): Promise<UserInfoFromAPI[]> {
    try {
      const token = await waitForAuthHydration()

      if (!token) {
        console.warn('⚠️ No auth token available after hydration; skipping user fetch')
        return []
      }

      const res = await localApiClient.get('/users')
      const payload = res.data
      
      let users: UserInfoFromAPI[] = []
      if (Array.isArray(payload)) {
        users = payload
      } else if (payload?.data && Array.isArray(payload.data)) {
        users = payload.data
      }
      
      if (users.length > 0) {
        return users
      }

      return users
    } catch (error) {
      console.warn('UserAPIService.getAll failed:', error)
      return []
    }
  }

  static async getById(id: string): Promise<UserInfoFromAPI | null> {
    if (!id) return null

    const token = await waitForAuthHydration()
    if (!token) {
      console.warn(`⚠️ No auth token available after hydration; skipping user fetch for ${id}`)
      return null
    }
    
    // Try local API route first
    try {
      const res = await localApiClient.get(`/users/${id}`)
      const payload = res.data
      if (payload?.data) return payload.data as UserInfoFromAPI
      if (payload?.id) return payload as UserInfoFromAPI
      // If we got here and payload exists, it's valid
      if (payload && Object.keys(payload).length > 0) return payload as UserInfoFromAPI
    } catch (error) {
      console.warn(`UserAPIService.getById failed for ${id}:`, error)
      return null
    }

    return null
  }

  static async getIamDetailsById(id: string): Promise<UserInfoFromAPI | null> {
    if (!id) return null

    const headers: HeadersInit = {}
    if (typeof window !== 'undefined') {
      const token = useAuthStore.getState().token
      if (token) headers.Authorization = `Bearer ${token}`
    }

    const res = await fetch(`/api/users/${encodeURIComponent(id)}`, {
      method: 'GET',
      headers,
    })

    if (!res.ok) return null

    const payload = await res.json().catch(() => null)
    if (payload?.data) return payload.data as UserInfoFromAPI
    return (payload as UserInfoFromAPI) || null
  }

  static async getIamUsersList(): Promise<UserInfoFromAPI[]> {
    try {
      const token = await waitForAuthHydration()

      if (!token) {
        console.warn('⚠️ No auth token available after hydration; skipping IAM users list fetch')
        return []
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }

      const tryFetch = async (url: string) => {
        const res = await fetch(url, {
          method: 'GET',
          headers,
          credentials: 'include',
        })

        if (!res.ok) {
          return null
        }

        const payload = await res.json().catch(() => null)
        if (Array.isArray(payload)) return payload as UserInfoFromAPI[]
        if (payload?.data && Array.isArray(payload.data)) return payload.data as UserInfoFromAPI[]
        return []
      }

      const usersFromUsers = await tryFetch('/api/users')
      if (usersFromUsers) return usersFromUsers

      const usersFromList = await tryFetch('/api/users/list')
      if (usersFromList) return usersFromList

      return []
    } catch (error) {
      console.warn('getIamUsersList failed:', error)
      return []
    }
  }
}
