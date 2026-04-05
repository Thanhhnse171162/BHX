import { localApiClient } from '@/shared/api/http'
import { useAuthStore } from '@/store/auth.store'

export interface ProductBatchFromAPI {
  id: string
  productId: string
  warehouseId: string
  batchNumber: string
  unit?: string | null
  Unit?: string | null
  quantity: number
  manufacturingDate: string
  expiryDate: string
  supplier: string
  receivedAt: string
  status: string
}

export interface ProductBatchDetailFromAPI extends ProductBatchFromAPI {
  transactionHistory?: Array<{
    id?: string
    action?: string
    quantity?: number
    note?: string
    createdAt?: string
  }>
}

export interface AllocateBatchDTO {
  sourceBatchId: string
  allocatedQuantity: number
  targetWarehouseId: string
  notes: string
}

export interface ReceiveFromSupplierDTO {
  supplierId: string
  batchId: string
  quantity: number
}

export interface ExpiredOutboundDTO {
  batchId: string
  quantity: number
}

export interface AdjustBatchQuantityDTO {
  batchId: string
  actualQuantity: number
  locationType: string
  locationId: string
  reason?: string
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

  static async getById(batchId: string): Promise<ProductBatchDetailFromAPI | null> {
    try {
      const response = await localApiClient.get(`/product-batch/batch/${batchId}`)
      const payload = response.data
      if (payload?.data && typeof payload.data === 'object') return payload.data
      if (payload && typeof payload === 'object') return payload
      return null
    } catch (error) {
      console.error('Error fetching batch detail:', error)
      return null
    }
  }

  static async allocateBatch(body: AllocateBatchDTO): Promise<boolean> {
    try {
      const response = await localApiClient.post('/product-batch/batch/allocate', body)
      return response.status >= 200 && response.status < 300
    } catch (error) {
      console.error('Error allocating batch:', error)
      return false
    }
  }

  static async receiveFromSupplier(body: ReceiveFromSupplierDTO): Promise<boolean> {
    try {
      const response = await localApiClient.post('/product-batch/receive-from-supplier', body)
      return response.status >= 200 && response.status < 300
    } catch (error) {
      console.error('Error receiving from supplier:', error)
      return false
    }
  }

  static async createOutboundForExpiredBatches(body: ExpiredOutboundDTO): Promise<boolean> {
    try {
      const response = await localApiClient.post('/product-batch/expired-batches/create-outbound', body)
      return response.status >= 200 && response.status < 300
    } catch (error) {
      console.error('Error creating outbound for expired batch:', error)
      return false
    }
  }

  static async adjustBatchQuantity(body: AdjustBatchQuantityDTO): Promise<boolean> {
    try {
      // ProductBatch API is on port 5003, not the default API_BASE_URL port
      const baseURL = typeof window !== 'undefined' ? 'http://13.229.29.52:5003' : process.env.NEXT_PUBLIC_INVENTORY_URL || 'http://13.229.29.52:5003'
      const token = typeof window !== 'undefined' ? (useAuthStore.getState?.().token || '') : ''
      
      const response = await fetch(`${baseURL}/api/ProductBatch/batch/adjust-quantity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          batchId: body.batchId,
          actualQuantity: body.actualQuantity,
          locationType: body.locationType,
          locationId: body.locationId,
          reason: body.reason,
        }),
      })
      return response.status >= 200 && response.status < 300
    } catch (error) {
      console.error('Error adjusting batch quantity:', error)
      return false
    }
  }
}
