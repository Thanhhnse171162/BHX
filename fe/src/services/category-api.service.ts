import axios, { AxiosInstance } from 'axios'

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

// Types cho Category từ backend
export interface CategoryFromAPI {
  id: string
  name: string
  description: string | null
  parentId: string | null
  parentName: string | null
  level: number
  displayOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateCategoryDTO {
  name: string
  description?: string
  parentId?: string
  displayOrder?: number
  isActive?: boolean
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
      return response.data
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
  static async createCategory(data: CreateCategoryDTO): Promise<CategoryFromAPI> {
    try {
      const response = await localApiClient.post<CategoryFromAPI>(this.baseURL, data)
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
      return response.data
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
