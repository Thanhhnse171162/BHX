import { localApiClient } from '@/shared/api/http'

export interface CreateTransferItemDTO {
  productId: string
  batchId?: string | null
  requestedQuantity: number
  receivedQuantity: number
  notes?: string
}

export interface CreateTransferDTO {
  fromLocationType: string
  fromLocationId: string
  toLocationType: string
  toLocationId: string
  expectedDelivery?: string | null
  shippedBy?: string
  restockRequestId?: string | null
  notes?: string
  items: CreateTransferItemDTO[]
}

export interface TransferItemFromAPI {
  id: string
  productId: string
  batchId?: string | null
  requestedQuantity: number
  shippedQuantity?: number | null
  receivedQuantity?: number | null
  damagedQuantity: number
  notes?: string | null
}

export interface TransferFromAPI {
  id: string
  transferNumber: string
  fromLocationType: string
  fromLocationId: string
  toLocationType: string
  toLocationId: string
  transferDate: string
  expectedDelivery?: string | null
  actualDelivery?: string | null
  status: string
  shippedBy?: string | null
  receivedBy?: string | null
  restockRequestId?: string | null
  notes?: string | null
  items: TransferItemFromAPI[]
}

export interface ReceiveTransferItemDTO {
  transferItemId: string
  shippedQuantity: number
  damagedQuantity: number
  notes?: string
}

export interface ReceiveTransferDTO {
  items: ReceiveTransferItemDTO[]
  notes?: string
}

export interface UpdateTransferStatusDTO {
  status: string
  notes?: string
}

export class TransferAPIService {
  private static readonly transferBase = '/transfer/transfer'
  private static readonly transferListEndpoint = '/transfer/transfers'
  private static readonly outboundEndpoint = '/transfer/transferV2'

  static async create(dto: CreateTransferDTO): Promise<TransferFromAPI> {
    const response = await localApiClient.post(this.transferBase, dto)
    const payload = response.data
    return payload?.data ?? payload
  }

  static async getTransfers(): Promise<TransferFromAPI[]> {
    const response = await localApiClient.get(this.transferListEndpoint)
    return response.data?.data ?? response.data ?? []
  }

  static async completeTransferV2(transferId: string): Promise<boolean> {
    const response = await localApiClient.patch(`/transfer/transferV2/${transferId}`)
    const payload = response.data
    return Boolean(payload?.data ?? payload)
  }

  static async getById(id: string): Promise<TransferFromAPI> {
    const response = await localApiClient.get(`${this.transferBase}/${encodeURIComponent(id)}`)
    const payload = response.data
    return payload?.data ?? payload
  }

  static async updateTransferStatus(id: string, dto: UpdateTransferStatusDTO | string) {
    const body: UpdateTransferStatusDTO =
      typeof dto === 'string' ? { status: dto } : dto

    const response = await localApiClient.put(
      `${this.transferBase}/${encodeURIComponent(id)}/status`,
      body,
    )
    return response.data?.data ?? response.data
  }

  static async receiveTransfer(id: string, dto: ReceiveTransferDTO) {
    const response = await localApiClient.put(
      `${this.transferBase}/${encodeURIComponent(id)}/receive`,
      dto,
    )
    return response.data?.data ?? response.data
  }

  static async createOutboundStockMovement(id: string) {
    const response = await localApiClient.patch(
      `${this.outboundEndpoint}/${encodeURIComponent(id)}`,
    )
    return response.data?.data ?? response.data
  }

  static async deleteTransfer(id: string) {
    const response = await localApiClient.delete(
      `${this.transferBase}/${encodeURIComponent(id)}`,
    )
    return response.data?.data ?? response.data
  }

  static async updateTransfer(id: string, patch: Partial<TransferFromAPI> & Record<string, unknown>) {
    const response = await localApiClient.patch(
      `${this.transferBase}/${encodeURIComponent(id)}`,
      patch,
    )
    const payload = response.data
    return payload?.data ?? payload
  }

  // Giữ lại để không làm vỡ code cũ ở nơi khác.
  // Với nghiệp vụ kho nhận xác nhận hàng, ưu tiên dùng receiveTransfer().
  static async markManagerCompleted(id: string) {
    return this.updateTransferStatus(id, { status: 'COMPLETED' })
  }
}