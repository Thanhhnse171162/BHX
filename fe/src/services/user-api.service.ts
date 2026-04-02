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

      console.log('📍 UserAPIService.getAll() - Trying local /api/users')
      const res = await localApiClient.get('/users')
      const payload = res.data
      
      let users: UserInfoFromAPI[] = []
      if (Array.isArray(payload)) {
        users = payload
      } else if (payload?.data && Array.isArray(payload.data)) {
        users = payload.data
      }
      
      if (users.length > 0) {
        console.log(`✅ Local /api/users returned ${users.length} users`)
        return users
      }
    } catch (error) {
      console.warn('❌ Local /api/users failed, trying IAM directly:', error)
    }

    // Fallback: Call IAM directly from frontend (has auth token)
    try {
      console.log('📍 Falling back to IAM service (direct)')
      return await this.getIamUsersList()
    } catch (iamError) {
      console.error('❌ IAM users also failed:', iamError)
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
      console.warn(`Local user endpoint failed for ${id}, trying IAM:`, error)
    }

    // Fall back to IAM endpoint
    try {
      return await this.getIamDetailsById(id)
    } catch (error) {
      console.error(`Error fetching user ${id} from IAM:`, error)
      return null
    }
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

      console.log('📍 Trying IAM proxy endpoint: /api/users/list')
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }

      const res = await fetch('/api/users/list', {
        method: 'GET',
        headers,
        credentials: 'include',
      })

      console.log(`   Response status: ${res.status}`)

      if (res.ok) {
        const payload = await res.json().catch(() => null)
        let users: UserInfoFromAPI[] = []

        if (Array.isArray(payload)) {
          users = payload
        } else if (payload?.data && Array.isArray(payload.data)) {
          users = payload.data
        }

        console.log(`✅ IAM proxy endpoint returned ${users.length} users`)
        return users
      }

      const statusText = await res.text().catch(() => '')
      console.warn(`⚠️ IAM proxy endpoint returned status ${res.status}`)
      if (statusText) console.warn(`   Error: ${statusText.substring(0, 100)}`)

      return []
    } catch (error) {
      console.error('❌ getIamUsersList error:', error)
      return []
    }
  }
}
