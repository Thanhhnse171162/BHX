import { localApiClient } from '@/shared/api/http'

export interface StockMovementFromAPI {
  id: string
  movementNumber: string
  movementType: string
  locationId: string
  locationType: string
  movementDate: string
  restockRequestId: string | null
  supplierName: string | null
  transferId: string | null
  receivedBy: string | null
  status: string
  notes: string | null
  createdAt: string
  totalItems: number
  items: unknown[]
}

export class StockMovementAPIService {
  static async getByLocation(locationId: string): Promise<StockMovementFromAPI[]> {
    if (!locationId) return []
    const response = await localApiClient.get(`/stock-movements/by-location/${locationId}`)
    const payload = response.data
    return payload?.data ?? payload ?? []
  }
}

