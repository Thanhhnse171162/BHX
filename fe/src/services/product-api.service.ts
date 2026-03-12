import axios, { AxiosInstance } from 'axios'
import { useAuthStore } from '@/store/auth.store'

/**
 * Local API Client - Gọi qua Next.js API routes (proxy)
 * Tránh CORS bằng cách gọi /api/* thay vì trực tiếp backend
 */
const localApiClient: AxiosInstance = axios.create({
  baseURL: '/api', // Gọi Next.js API routes
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

// Types cho Product từ backend
export interface ProductFromAPI {
  id: string
  sku: string
  barcode?: string
  name: string
  description: string | null
  categoryId: string
  categoryName: string
  brandId: string | null
  brand: string | null
  price: number
  unit: string
  originalPrice: number
  weight: number
  volume: number | null
  isFeatured: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// DTO khớp với backend API - Theo Swagger
export interface CreateProductDTO {
  // Required fields
  sku: string
  name: string
  categoryId: string
  price: number
  unit: string  // Required trong backend
  
  // Optional fields
  barcode?: string
  description?: string
  brand?: string
  origin?: string
  originalPrice?: number
  costPrice?: number
  weight?: number
  volume?: number
  quantityPerUnit?: number
  minOrderQuantity?: number
  maxOrderQuantity?: number
  expirationDate?: string
  shelfLifeDays?: number
  storageInstructions?: string
  isPerishable?: boolean
  isAvailable?: boolean
  isFeatured?: boolean
  isNew?: boolean
  isOnSale?: boolean
  slug?: string
  metaTitle?: string
  metaDescription?: string
  maxKeywords?: string
  maxImage?: string  // Base64 string hoặc URL
  additionalImages?: string[]  // Array of image URLs/Base64
}

export interface UpdateProductDTO extends Partial<CreateProductDTO> {
  id: string
}

/**
 * Product API Service - Kết nối với backend qua Next.js proxy
 * Endpoint: /api/products -> forward đến http://localhost:5001/api/Product
 */
export class ProductAPIService {
  // Gọi qua Next.js API route để tránh CORS
  private static baseURL = '/products'

  /**
   * Lấy tất cả products
   */
  static async getAllProducts(): Promise<ProductFromAPI[]> {
    try {
      const response = await localApiClient.get<ProductFromAPI[]>(this.baseURL)
      return response.data
    } catch (error) {
      console.error('Error fetching products:', error)
      throw error
    }
  }

  /**
   * Lấy product theo ID
   */
  static async getProductById(id: string): Promise<ProductFromAPI> {
    try {
      const response = await localApiClient.get<ProductFromAPI>(`${this.baseURL}/${id}`)
      return response.data
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error)
      throw error
    }
  }

  /**
   * Tạo product mới
   */
  static async createProduct(data: CreateProductDTO): Promise<ProductFromAPI> {
    try {
      const response = await localApiClient.post<ProductFromAPI>(this.baseURL, data)
      return response.data
    } catch (error) {
      console.error('Error creating product:', error)
      throw error
    }
  }

  /**
   * Cập nhật product
   */
  static async updateProduct(id: string, data: Partial<CreateProductDTO>): Promise<ProductFromAPI> {
    try {
      const response = await localApiClient.put<ProductFromAPI>(`${this.baseURL}/${id}`, data)
      return response.data
    } catch (error) {
      console.error(`Error updating product ${id}:`, error)
      throw error
    }
  }

  /**
   * Xóa product
   */
  static async deleteProduct(id: string): Promise<void> {
    try {
      await localApiClient.delete(`${this.baseURL}/${id}`)
    } catch (error) {
      console.error(`Error deleting product ${id}:`, error)
      throw error
    }
  }
}
