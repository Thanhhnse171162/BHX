import axios, { AxiosInstance } from 'axios'
import { iamClient } from '@/shared/api/http'

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
}

export class UserAPIService {
  static async getById(id: string): Promise<UserInfoFromAPI | null> {
    if (!id) return null
    const res = await localApiClient.get(`/users/${id}`)
    const payload = res.data
    if (payload?.data) return payload.data as UserInfoFromAPI
    return payload as UserInfoFromAPI
  }

  static async getIamDetailsById(id: string): Promise<UserInfoFromAPI | null> {
    if (!id) return null
    const res = await iamClient.get(`/api/users/details/${id}`)
    const payload = res.data
    if (payload?.data) return payload.data as UserInfoFromAPI
    return payload as UserInfoFromAPI
  }
}

