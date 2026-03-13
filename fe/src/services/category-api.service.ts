import axios, { AxiosInstance } from 'axios'
import { useAuthStore } from '@/store/auth.store'

/**
 * Local API Client - Gọi qua Next.js API routes (proxy)
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

// Types cho Category từ backend.
// BE hiện tại có thể trả camelCase (createdAt) hoặc snake_case (created_at),
// và một số endpoint có thể không trả id.
export interface CategoryFromAPI {
  id?: string
  Id?: string
  categoryId?: string
  CategoryId?: string
  categoryID?: string
  CategoryID?: string
  category_id?: string
  Category_Id?: string
  _id?: string
  name: string
  status: string  // ACTIVE hoặc INACTIVE
  is_deleted?: number  // 0 hoặc 1
  created_at?: string
  updated_at?: string | null
  createdAt?: string
  updatedAt?: string | null
}

export interface CreateCategoryDTO {
  name: string
  status?: string  // 'ACTIVE' hoặc 'INACTIVE'
  isDeleted?: boolean
}

export interface CreateCategoryResponse {
  success?: boolean
  message?: string
  data?: CategoryFromAPI
}

/**
 * Category API Service
 */
export class CategoryAPIService {
  private static baseURL = '/categories'

  /**
   * Lấy tất cả categories
   */
  static async getAllCategories(): Promise<CategoryFromAPI[]> {
    try {
      const response = await localApiClient.get<CategoryFromAPI[]>(this.baseURL)
      const payload = response.data as unknown
      if (Array.isArray(payload)) {
        return payload as CategoryFromAPI[]
      }
      if (payload && typeof payload === 'object' && 'data' in (payload as any)) {
        const nested = (payload as any).data
        return Array.isArray(nested) ? (nested as CategoryFromAPI[]) : []
      }
      return []
    } catch (error) {
      console.error('Error fetching categories:', error)
      throw error
    }
  }

  /**
   * Lấy category theo ID
   */
  static async getCategoryById(id: string): Promise<CategoryFromAPI> {
    try {
      const response = await localApiClient.get<CategoryFromAPI>(`${this.baseURL}/${id}`)
      return response.data
    } catch (error) {
      console.error(`Error fetching category ${id}:`, error)
      throw error
    }
  }

  /**
   * Tạo category mới
   */
  static async createCategory(data: CreateCategoryDTO): Promise<CreateCategoryResponse | CategoryFromAPI> {
    try {
      const response = await localApiClient.post<CreateCategoryResponse | CategoryFromAPI>(this.baseURL, data)
      return response.data
    } catch (error) {
      console.error('Error creating category:', error)
      throw error
    }
  }

  /**
   * Cập nhật category
   */
  static async updateCategory(id: string, data: Partial<CreateCategoryDTO>): Promise<CategoryFromAPI> {
    try {
      const response = await localApiClient.put<CategoryFromAPI>(`${this.baseURL}/${id}`, data)
      const payload = response.data as unknown
      if (payload && typeof payload === 'object' && 'data' in (payload as any)) {
        return (payload as any).data as CategoryFromAPI
      }
      return payload as CategoryFromAPI
    } catch (error) {
      console.error(`Error updating category ${id}:`, error)
      throw error
    }
  }

  /**
   * Xóa category
   */
  static async deleteCategory(id: string): Promise<void> {
    try {
      await localApiClient.delete(`${this.baseURL}/${id}`)
    } catch (error) {
      console.error(`Error deleting category ${id}:`, error)
      throw error
    }
  }
}
