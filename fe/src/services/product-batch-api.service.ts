import axios, { AxiosInstance } from 'axios'
import { useAuthStore } from '@/store/auth.store'

const localApiClient: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

localApiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = useAuthStore.getState().token
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export interface ProductBatchFromAPI {
  id: string
  productId: string
  warehouseId: string
  batchNumber: string
  quantity: number
  manufacturingDate: string
  expiryDate: string
  supplier: string
  receivedAt: string
  status: string
}

export class ProductBatchAPIService {
  static async getByWarehouse(warehouseId: string): Promise<ProductBatchFromAPI[]> {
    try {
      const response = await localApiClient.get(`/product-batch/warehouse/${warehouseId}`)
      const payload = response.data
      if (Array.isArray(payload)) return payload
      if (Array.isArray(payload?.data)) return payload.data
      return []
    } catch (error) {
      console.error('Error fetching batches:', error)
      return []
    }
  }
}
