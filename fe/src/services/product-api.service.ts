import axios, { AxiosInstance } from 'axios'
import { useAuthStore } from '@/store/auth.store'

/**
 * Local API Client - Gọi qua Next.js API routes (proxy)
 * Tránh CORS bằng cách gọi /api/* thay vì trực tiếp backend
 */
const localApiClient: AxiosInstance = axios.create({
  baseURL: '/api', // Gọi Next.js API routes
  timeout: 30000,
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
  origin?: string
  price: number
  unit: string
  originalPrice: number
  costPrice?: number
  weight: number
  volume: number | null
  slug?: string
  metaTitle?: string
  metaDescription?: string
  metaKeywords?: string
  isFeatured: boolean
  isActive: boolean
  isAvailable: boolean
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
  isActive?: boolean  // Also support isActive (from response mapping)
  isFeatured?: boolean
  isNew?: boolean
  isOnSale?: boolean
  slug?: string
  metaTitle?: string
  metaDescription?: string
  metaKeywords?: string
  // Backward-compatible aliases for legacy typo fields
  maxKeywords?: string
  mainImage?: File | Blob | string
  // Backward-compatible alias for legacy typo fields
  maxImage?: File | Blob | string
  additionalImages?: Array<File | Blob | string>
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
   * Alias for getProductById
   */
  static async getById(id: string): Promise<ProductFromAPI | null> {
    if (!id) return null
    try {
      return await this.getProductById(id)
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error)
      return null
    }
  }

  /**
   * Tạo product mới
   */
  static async createProduct(data: CreateProductDTO): Promise<ProductFromAPI> {
    try {
      const formData = new FormData()

      const appendIfDefined = (key: string, value: unknown) => {
        if (value === undefined || value === null || value === '') return
        formData.append(key, String(value))
      }

      appendIfDefined('Sku', data.sku)
      appendIfDefined('Name', data.name)
      appendIfDefined('CategoryId', data.categoryId)
      appendIfDefined('Price', data.price)
      appendIfDefined('Unit', data.unit)
      appendIfDefined('Barcode', data.barcode)
      appendIfDefined('Description', data.description)
      appendIfDefined('Brand', data.brand)
      appendIfDefined('Origin', data.origin)
      appendIfDefined('OriginalPrice', data.originalPrice)
      appendIfDefined('CostPrice', data.costPrice)
      appendIfDefined('Weight', data.weight)
      appendIfDefined('Volume', data.volume)
      appendIfDefined('QuantityPerUnit', data.quantityPerUnit)
      appendIfDefined('MinOrderQuantity', data.minOrderQuantity)
      appendIfDefined('MaxOrderQuantity', data.maxOrderQuantity)
      appendIfDefined('ExpirationDate', data.expirationDate)
      appendIfDefined('ShelfLifeDays', data.shelfLifeDays)
      appendIfDefined('StorageInstructions', data.storageInstructions)
      appendIfDefined('IsPerishable', data.isPerishable)
      appendIfDefined('IsAvailable', data.isAvailable)
      appendIfDefined('IsFeatured', data.isFeatured)
      appendIfDefined('IsNew', data.isNew)
      appendIfDefined('IsOnSale', data.isOnSale)
      appendIfDefined('Slug', data.slug)
      appendIfDefined('MetaTitle', data.metaTitle)
      appendIfDefined('MetaDescription', data.metaDescription)
      appendIfDefined('MetaKeywords', data.metaKeywords ?? data.maxKeywords)

      const mainImage = data.mainImage ?? data.maxImage
      if (mainImage !== undefined && mainImage !== null && mainImage !== '') {
        if (mainImage instanceof File) {
          formData.append('MainImage', mainImage)
        } else if (mainImage instanceof Blob) {
          formData.append('MainImage', mainImage, 'main-image')
        } else {
          appendIfDefined('MainImage', mainImage)
        }
      }

      if (Array.isArray(data.additionalImages)) {
        data.additionalImages.forEach((image) => {
          if (image instanceof File) {
            formData.append('AdditionalImages', image)
          } else if (image instanceof Blob) {
            formData.append('AdditionalImages', image, 'additional-image')
          } else if (image) {
            formData.append('AdditionalImages', image)
          }
        })
      }

      const headers: HeadersInit = {}
      if (typeof window !== 'undefined') {
        const token = useAuthStore.getState().token
        if (token) {
          headers.Authorization = `Bearer ${token}`
        }
      }

      const response = await fetch(`/api${this.baseURL}`, {
        method: 'POST',
        headers,
        body: formData,
      })

      const responseContentType = response.headers.get('content-type') || ''
      const result = responseContentType.includes('application/json')
        ? await response.json().catch(() => null)
        : await response.text().catch(() => null)

      if (!response.ok) {
        const errorMessage =
          (result && typeof result === 'object' && ('error' in result || 'message' in result)
            ? ((result as any).error || (result as any).message)
            : null) || `Create product failed with status ${response.status}`
        throw new Error(errorMessage)
      }

      if (result && typeof result === 'object' && 'data' in result) {
        return (result as any).data as ProductFromAPI
      }

      return result as ProductFromAPI
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
      const formData = new FormData()

      const appendIfDefined = (key: string, value: unknown) => {
        if (value === undefined || value === null || value === '') return
        formData.append(key, String(value))
      }

      appendIfDefined('Sku', data.sku)
      appendIfDefined('Name', data.name)
      appendIfDefined('CategoryId', data.categoryId)
      appendIfDefined('Price', data.price)
      appendIfDefined('Unit', data.unit)
      appendIfDefined('Barcode', data.barcode)
      appendIfDefined('Description', data.description)
      appendIfDefined('Brand', data.brand)
      appendIfDefined('Origin', data.origin)
      appendIfDefined('OriginalPrice', data.originalPrice)
      appendIfDefined('CostPrice', data.costPrice)
      appendIfDefined('Weight', data.weight)
      appendIfDefined('Volume', data.volume)
      appendIfDefined('QuantityPerUnit', data.quantityPerUnit)
      appendIfDefined('MinOrderQuantity', data.minOrderQuantity)
      appendIfDefined('MaxOrderQuantity', data.maxOrderQuantity)
      appendIfDefined('ExpirationDate', data.expirationDate)
      appendIfDefined('ShelfLifeDays', data.shelfLifeDays)
      appendIfDefined('StorageInstructions', data.storageInstructions)
      appendIfDefined('IsPerishable', data.isPerishable)
      appendIfDefined('IsAvailable', data.isAvailable)
      appendIfDefined('IsFeatured', data.isFeatured)
      appendIfDefined('IsNew', data.isNew)
      appendIfDefined('IsOnSale', data.isOnSale)
      appendIfDefined('Slug', data.slug)
      appendIfDefined('MetaTitle', data.metaTitle)
      appendIfDefined('MetaDescription', data.metaDescription)
      appendIfDefined('MetaKeywords', data.metaKeywords ?? data.maxKeywords)

      const mainImage = data.mainImage ?? data.maxImage
      if (mainImage !== undefined && mainImage !== null && mainImage !== '') {
        if (mainImage instanceof File) {
          formData.append('MainImage', mainImage)
        } else if (mainImage instanceof Blob) {
          formData.append('MainImage', mainImage, 'main-image')
        } else {
          appendIfDefined('MainImage', mainImage)
        }
      }

      if (Array.isArray(data.additionalImages)) {
        data.additionalImages.forEach((image) => {
          if (image instanceof File) {
            formData.append('AdditionalImages', image)
          } else if (image instanceof Blob) {
            formData.append('AdditionalImages', image, 'additional-image')
          } else if (image) {
            formData.append('AdditionalImages', image)
          }
        })
      }

      const headers: HeadersInit = {}
      if (typeof window !== 'undefined') {
        const token = useAuthStore.getState().token
        if (token) {
          headers.Authorization = `Bearer ${token}`
        }
      }

      const response = await fetch(`/api${this.baseURL}/update-product?id=${id}`, {
        method: 'PUT',
        headers,
        body: formData,
      })

      const responseContentType = response.headers.get('content-type') || ''
      const result = responseContentType.includes('application/json')
        ? await response.json().catch(() => null)
        : await response.text().catch(() => null)

      if (!response.ok) {
        const errorMessage =
          (result && typeof result === 'object' && ('error' in result || 'message' in result)
            ? ((result as any).error || (result as any).message)
            : null) || `Update product failed with status ${response.status}`
        throw new Error(errorMessage)
      }

      if (result && typeof result === 'object' && 'data' in result) {
        return (result as any).data as ProductFromAPI
      }

      return result as ProductFromAPI
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
