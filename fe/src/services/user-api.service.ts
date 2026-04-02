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
    try {
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
      // Get token from auth store (may be empty on first load)
      let token = ''
      let authState = null
      
      if (typeof window !== 'undefined') {
        try {
          authState = useAuthStore.getState()
          token = authState?.token || ''
          console.log(`🔐 Auth state:`, {
            hasUser: !!authState?.user,
            hasToken: !!token,
            tokenLength: token?.length || 0,
            tokenPreview: token ? token.substring(0, 25) + '...' : 'none',
            isAuthenticated: authState?.isAuthenticated,
            hydrated: authState?.hydrated,
          })
        } catch (e) {
          console.warn('⚠️ Failed to get auth store:', e)
        }
      } else {
        console.warn('⚠️ Not in browser environment (SSR)')
      }

      // Try multiple IAM endpoints
      const iamBaseUrl = process.env.NEXT_PUBLIC_IAM_URL || 'http://13.229.29.52:5000'
      const endpoints = [
        `${iamBaseUrl}/api/users`,
        `${iamBaseUrl}/api/users/list`,
      ]

      for (const endpoint of endpoints) {
        try {
          console.log(`📍 Trying IAM endpoint: ${endpoint}`)
          
          // Build headers with auth if available
          const headers: HeadersInit = {
            'Content-Type': 'application/json',
          }
          
          if (token) {
            headers.Authorization = `Bearer ${token}`
            console.log(`   ✓ Sending Bearer token`)
          } else {
            console.warn(`   ⚠️ No token available, request may fail`)
          }
          
          const res = await fetch(endpoint, {
            method: 'GET',
            headers,
            credentials: 'include', // Send cookies if any
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
            
            console.log(`✅ IAM endpoint ${endpoint} returned ${users.length} users`)
            return users
          } else if (res.status === 401) {
            const statusText = await res.text().catch(() => '')
            console.warn(`⚠️ 401 Unauthorized from ${endpoint}`)
            console.warn(`   Token provided: ${token ? 'yes' : 'no'}`)
            if (statusText) console.warn(`   Error: ${statusText.substring(0, 100)}`)
            // Don't continue on 401 - token is missing/invalid
          } else {
            const statusText = await res.text().catch(() => '')
            console.log(`⚠️ IAM endpoint ${endpoint} returned status ${res.status}`)
            if (statusText) console.log(`   Error: ${statusText.substring(0, 100)}`)
          }
        } catch (error) {
          console.log(`⚠️ Failed to fetch from ${endpoint}:`, error)
          continue
        }
      }

      console.log('❌ All IAM endpoints failed')
      return []
    } catch (error) {
      console.error('❌ getIamUsersList error:', error)
      return []
    }
  }
}
