import axios, { AxiosInstance } from 'axios'
import { useAuthStore } from '@/store/auth.store'

/**
 * Local API Client cho Inventory
 */
const localApiClient: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor để gắn token
localApiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Types cho Inventory từ backend (theo Swagger response)
// Backend trả về cả thông tin product đã join sẵn
export interface InventoryItem {
  id: string
  productId: string
  locationType: 'WAREHOUSE' | 'STORE'
  locationId: string
  Unit?: string
  quantity: number
  reservedQuantity: number
  availableQuantity: number
  minStockLevel: number
  maxStockLevel: number
  isLowStock: boolean
  lastStockCheck: string | null
  updatedAt: string
  // Product details (if backend includes them)
  product?: {
    id: string
    sku: string
    barcode?: string
    name: string
    description?: string
    categoryId: string
    categoryName: string
    brand?: string
    price: number
    unit: string
    Unit?: string
    originalPrice?: number
    costPrice?: number
    isActive: boolean
  }
  // Flattened product fields (alternative structure)
  sku?: string
  barcode?: string
  productName?: string
  name?: string
  categoryName?: string
  brand?: string
  price?: number
  unit?: string
  costPrice?: number
  originalPrice?: number
}

export interface InventoryApiResponse {
  success?: boolean
  message?: string
  data: InventoryItem[]
}

/**
 * Service gọi API Inventory
 */
export class InventoryAPIService {
  private static baseURL = '/inventory'

  /**
   * Lấy tất cả inventory items
   */
  static async getAllInventory(): Promise<InventoryItem[]> {
    try {
      const response = await localApiClient.get<InventoryApiResponse>(this.baseURL)
      return response.data.data
    } catch (error) {
      console.error('Error fetching inventory:', error)
      throw error
    }
  }

  /**
   * Lấy inventory theo product ID
   * Frontend: GET /api/inventory/product/{productId} (Next route, chữ thường — khớp app/api/inventory/product/[productId])
   * Proxy backend: GET /api/Inventory/product/{productId}
   */
  static async getInventoryByProduct(productId: string): Promise<InventoryItem[]> {
    try {
      const response = await localApiClient.get<InventoryApiResponse>(
        `${this.baseURL}/product/${encodeURIComponent(productId)}`
      )
      const payload = response.data
      return Array.isArray(payload?.data) ? payload.data : []
    } catch (error) {
      console.error(`Error fetching inventory for product ${productId}:`, error)
      throw error
    }
  }

  /**
   * Lấy inventory theo location type và ID
   */
  static async getInventoryByLocation(
    locationType: 'WAREHOUSE' | 'STORE',
    locationId: string
  ): Promise<InventoryItem[]> {
    try {
      // Gọi tới route proxy mới: /api/inventory/location/[locationType]/[locationId]
      const response = await localApiClient.get<InventoryApiResponse>(
        `${this.baseURL}/location/${locationType}/${locationId}`
      )
      return response.data.data
    } catch (error) {
      console.error(`Error fetching inventory for ${locationType} ${locationId}:`, error)
      throw error
    }
  }

  /**
   * Lấy inventory theo warehouse ID
   */
  static async getInventoryByWarehouse(warehouseId: string): Promise<InventoryItem[]> {
    return this.getInventoryByLocation('WAREHOUSE', warehouseId)
  }

  /**
   * Lấy inventory theo store ID
   */
  static async getInventoryByStore(storeId: string): Promise<InventoryItem[]> {
    return this.getInventoryByLocation('STORE', storeId)
  }

  /**
   * Cập nhật inventory item
   */
  static async updateInventory(id: string, data: Partial<InventoryItem>): Promise<InventoryItem> {
    try {
      const response = await localApiClient.put<{ data: InventoryItem }>(
        `${this.baseURL}/${id}`,
        data
      )
      return response.data.data
    } catch (error) {
      console.error('Error updating inventory:', error)
      throw error
    }
  }

  /**
   * Tạo inventory item mới
   */
  static async createInventory(data: Omit<InventoryItem, 'id' | 'updatedAt'>): Promise<InventoryItem> {
    try {
      const response = await localApiClient.post<{ data: InventoryItem }>(
        this.baseURL,
        data
      )
      return response.data.data
    } catch (error) {
      console.error('Error creating inventory:', error)
      throw error
    }
  }

  /**
   * Xóa inventory item
   */
  static async deleteInventory(id: string): Promise<void> {
    try {
      await localApiClient.delete(`${this.baseURL}/${id}`)
    } catch (error) {
      console.error('Error deleting inventory:', error)
      throw error
    }
  }

  /**
   * Check hoặc tạo inventory item
   * Frontend: POST /api/inventory/check-or-create (Next.js proxy route)
   * Backend: POST /api/Inventory/check-or-create
   */
  static async checkOrCreateInventory(data: {
    productId: string
    locationType: 'WAREHOUSE' | 'STORE'
    locationId: string
    quantity: number
    minStockLevel: number
    maxStockLevel: number
  }): Promise<InventoryItem> {
    try {
      const response = await localApiClient.post<{ data: InventoryItem }>(
        `${this.baseURL}/check-or-create`,
        data
      )
      return response.data.data
    } catch (error) {
      console.error('Error checking or creating inventory:', error)
      throw error
    }
  }

  /**
   * Cập nhật minimum stock level
   * Endpoint: PUT /api/Inventory/{inventoryId}/min-stock-level
   */
  static async updateMinStockLevel(inventoryId: string, minStockLevel: number): Promise<InventoryItem> {
    try {
      const response = await localApiClient.put<{ data: InventoryItem }>(
        `/inventory/${inventoryId}/min-stock-level`,
        { minStockLevel }
      )
      return response.data.data
    } catch (error) {
      console.error('Error updating min stock level:', error)
      throw error
    }
  }
}
