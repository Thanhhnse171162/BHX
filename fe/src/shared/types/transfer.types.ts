export interface TransferItem {
  id: string
  productId: string
  batchId?: string | null
  requestedQuantity: number
  shippedQuantity?: number | null
  receivedQuantity?: number | null
  damagedQuantity: number
  notes?: string | null
}

export interface Transfer {
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
  items: TransferItem[]
}