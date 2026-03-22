import { localApiClient } from '@/shared/api/http'

export interface InventoryWarehouseFromAPI {
  id: string
  name: string
  location?: string
  capacity?: number
  status?: string
}

export class WarehouseLookupAPIService {
  static async getById(id: string): Promise<InventoryWarehouseFromAPI | null> {
    if (!id) return null
    try {
      const res = await localApiClient.get(`/inventory-warehouse/${id}`)
      const payload = res.data
      if (payload?.data) return payload.data as InventoryWarehouseFromAPI
      return payload as InventoryWarehouseFromAPI
    } catch (error) {
      console.error(`Error fetching warehouse ${id}:`, error)
      return null
    }
  }
}
