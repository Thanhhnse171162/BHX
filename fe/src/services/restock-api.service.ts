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

// ─── Types (match BE response) ───────────────────────────────────────────────

export interface RestockRequestItem {
  id: string
  productId: string
  productName: string
  unit: string
  requestedQuantity: number
  currentQuantity: number
  approvedQuantity: number | null
  reason: string
}

export interface RestockRequestFromAPI {
  id: string
  requestNumber: string
  fromWarehouseId: string
  fromLocationType: 'WAREHOUSE' | 'STORE' | string
  toWarehouseId: string
  toLocationType: 'WAREHOUSE' | 'STORE' | string
  requestedBy: string
  requestedDate: string
  priority: 'NORMAL' | 'HIGH' | 'URGENT' | string
  status: 'PENDING' | 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED' | string
  approvedBy: string | null
  approvedDate: string | null
  transferId: string | null
  notes: string | null
  items: RestockRequestItem[]
}

export interface CreateRestockRequestDTO {
  fromWarehouseId: string
  fromLocationType: string
  toWarehouseId: string
  toLocationType: string
  priority: string
  notes?: string
  items: {
    productId: string
    requestedQuantity: number
    currentQuantity?: number
    reason?: string
  }[]
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class RestockAPIService {
  private static base = '/restock-requests'

  static async getAll(): Promise<RestockRequestFromAPI[]> {
    const response = await localApiClient.get(this.base)
    const payload = response.data
    if (Array.isArray(payload)) return payload
    if (payload?.data && Array.isArray(payload.data)) return payload.data
    return []
  }

  static async getByWarehouse(warehouseId: string): Promise<RestockRequestFromAPI[]> {
    if (!warehouseId) return []
    const response = await localApiClient.get(`${this.base}/by-warehouse/${warehouseId}`)
    const payload = response.data
    if (Array.isArray(payload)) return payload
    if (payload?.data && Array.isArray(payload.data)) return payload.data
    return []
  }

  static async getByParentWarehouse(parentWarehouseId: string): Promise<RestockRequestFromAPI[]> {
    if (!parentWarehouseId) return []
    const response = await localApiClient.get(`${this.base}/by-parent-warehouse/${parentWarehouseId}`)
    const payload = response.data
    if (Array.isArray(payload)) return payload
    if (payload?.data && Array.isArray(payload.data)) return payload.data
    return []
  }

  static async create(dto: CreateRestockRequestDTO): Promise<RestockRequestFromAPI> {
    const response = await localApiClient.post(this.base, dto)
    const payload = response.data
    return payload?.data ?? payload
  }

  static async updateStatus(
    id: string,
    status: 'APPROVED' | 'REJECTED',
    reason?: string
  ): Promise<RestockRequestFromAPI> {
    if (status === 'APPROVED') {
      const response = await localApiClient.put(`${this.base}/${id}/approve`)
      const payload = response.data
      return payload?.data ?? payload
    } else {
      const response = await localApiClient.put(`${this.base}/${id}/reject`, { reason })
      const payload = response.data
      return payload?.data ?? payload
    }
  }
}
