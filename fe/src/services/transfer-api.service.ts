import { localApiClient } from '@/shared/api/http'

export interface CreateTransferItemDTO {
  productId: string
  batchId: string
  requestedQuantity: number
  receivedQuantity: number
  notes?: string
}

export interface CreateTransferDTO {
  fromLocationType: string
  fromLocationId: string
  toLocationType: string
  toLocationId: string
  expectedDelivery: string
  shippedBy?: string
  restockRequestId: string
  notes?: string
  items: CreateTransferItemDTO[]
}

export interface TransferItemFromAPI {
  id: string
  productId: string
  batchId: string
  requestedQuantity: number
  shippedQuantity: number
  receivedQuantity: number
  damagedQuantity: number
  notes: string | null
}

export interface TransferFromAPI {
  id: string
  transferNumber: string
  fromLocationType: string
  fromLocationId: string
  toLocationType: string
  toLocationId: string
  transferDate: string
  expectedDelivery: string
  actualDelivery: string | null
  status: string
  shippedBy: string
  receivedBy: string | null
  restockRequestId: string
  notes: string | null
  items: TransferItemFromAPI[]
}

export class TransferAPIService {
  private static readonly base = '/transfer/transfer'

  static async create(dto: CreateTransferDTO): Promise<TransferFromAPI> {
    const response = await localApiClient.post(this.base, dto)
    const payload = response.data
    return payload?.data ?? payload
  }
}
