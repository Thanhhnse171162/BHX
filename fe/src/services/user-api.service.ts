import axios, { AxiosInstance } from 'axios'
import { useAuthStore } from '@/store/auth.store'

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
    const res = await localApiClient.get('/users')
    const payload = res.data
    if (Array.isArray(payload)) return payload
    if (payload?.data && Array.isArray(payload.data)) return payload.data
    return []
  }

  static async getById(id: string): Promise<UserInfoFromAPI | null> {
    if (!id) return null
    
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

    const res = await fetch(`/iam/api/users/details/${encodeURIComponent(id)}`, {
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
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      if (typeof window !== 'undefined') {
        const token = useAuthStore.getState().token
        if (token) headers.Authorization = `Bearer ${token}`
      }

      // Call backend directly with full URL
      const iamBaseUrl = process.env.NEXT_PUBLIC_IAM_URL || 'http://localhost:5000'
      const url = `${iamBaseUrl}/api/users/list`

      const res = await fetch(url, {
        method: 'GET',
        headers,
      })

      const payload = await res.json().catch(() => null)
      if (!res.ok) {
        // Silently return empty array on error
        return []
      }

      if (Array.isArray(payload)) return payload as UserInfoFromAPI[]
      if (payload?.data && Array.isArray(payload.data)) return payload.data as UserInfoFromAPI[]
      return []
    } catch {
      // Silently return empty array on any error
      return []
    }
  }
}

