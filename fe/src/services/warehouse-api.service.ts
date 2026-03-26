import { localApiClient } from '@/shared/api/http'

export interface WarehouseFromAPI {
  id: string
  name: string
  parentId?: string | null
  parent_id?: string | null
  status?: string | null
}

export class WarehouseAPIService {
  static async getAll(): Promise<WarehouseFromAPI[]> {
    const res = await localApiClient.get('/Warehouse')
    const payload = res.data
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload?.data)) return payload.data
    return []
  }

  static async getById(id: string): Promise<WarehouseFromAPI | null> {
    if (!id) return null
    const res = await localApiClient.get(`/Warehouse/${encodeURIComponent(id)}`)
    const payload = res.data
    if (payload?.data && typeof payload.data === 'object') return payload.data as WarehouseFromAPI
    if (payload && typeof payload === 'object') return payload as WarehouseFromAPI
    return null
  }

  static async getChildren(parentId: string): Promise<WarehouseFromAPI[]> {
    if (!parentId) return []
    const res = await localApiClient.get(`/Warehouse/warehouses/${encodeURIComponent(parentId)}`)
    const payload = res.data
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload?.data)) return payload.data
    return []
  }
}

