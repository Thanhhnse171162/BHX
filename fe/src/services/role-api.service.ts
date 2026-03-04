import axios, { AxiosInstance } from 'axios'
import { useAuthStore } from '@/store/auth.store'

/**
 * Local API Client - Gọi qua Next.js API routes (proxy)
 * Tránh CORS bằng cách gọi /api/roles thay vì trực tiếp backend
 */
const localApiClient: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to attach token
localApiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Types cho Role từ backend - Khớp với database schema
export interface RoleFromAPI {
  id: number
  name: string
  description: string
  is_system: boolean
  created_at: string  // Database column name
}

export interface CreateRoleDTO {
  name: string
  description: string
  is_system?: boolean
}

export interface UpdateRoleDTO {
  name?: string
  description?: string
}

/**
 * Role API Service - Kết nối với backend qua Next.js proxy
 */
export class RoleAPIService {
  
  private static baseURL = '/roles'

  /**
   * GET /api/roles - Lấy tất cả roles
   */
  static async getAllRoles(): Promise<RoleFromAPI[]> {
    try {
      const response = await localApiClient.get<RoleFromAPI[]>(this.baseURL)
      return response.data
    } catch (error: any) {
      console.error('Get all roles error:', error.response?.data || error.message)
      throw error
    }
  }

  /**
   * GET /api/roles/:id - Lấy role theo ID
   */
  static async getRoleById(id: string): Promise<RoleFromAPI> {
    try {
      const response = await localApiClient.get<RoleFromAPI>(`${this.baseURL}/${id}`)
      return response.data
    } catch (error: any) {
      console.error('Get role by id error:', error.response?.data || error.message)
      throw error
    }
  }

  /**
   * POST /api/roles - Tạo role mới
   */
  static async createRole(data: CreateRoleDTO): Promise<RoleFromAPI> {
    try {
      const response = await localApiClient.post<RoleFromAPI>(this.baseURL, data)
      return response.data
    } catch (error: any) {
      console.error('Create role error:', error.response?.data || error.message)
      throw error
    }
  }

  /**
   * PUT /api/roles/:id - Cập nhật role
   */
  static async updateRole(id: string, data: UpdateRoleDTO): Promise<RoleFromAPI> {
    try {
      const response = await localApiClient.put<RoleFromAPI>(`${this.baseURL}/${id}`, data)
      return response.data
    } catch (error: any) {
      console.error('Update role error:', error.response?.data || error.message)
      throw error
    }
  }

  /**
   * DELETE /api/roles/:id - Xóa role
   */
  static async deleteRole(id: string): Promise<void> {
    try {
      await localApiClient.delete(`${this.baseURL}/${id}`)
    } catch (error: any) {
      console.error('Delete role error:', error.response?.data || error.message)
      throw error
    }
  }
}
