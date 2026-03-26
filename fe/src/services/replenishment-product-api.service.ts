import { localApiClient } from '@/shared/api/http'

export interface CatalogProductFromAPI {
  id: string
  sku: string
  name: string
  unit?: string | null
  supplierId?: string | null
  categoryName?: string | null
  imageUrl?: string | null
}

/**
 * Product APIs used specifically for replenishment flow.
 * Must follow backend endpoints listed in the prompt.
 */
export class ReplenishmentProductAPIService {
  static async getAllProducts(): Promise<CatalogProductFromAPI[]> {
    const res = await localApiClient.get('/Product/Get-All-Products')
    const payload = res.data
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload?.data)) return payload.data
    return []
  }

  /**
   * Response schema is NOT confirmed by prompt.
   * This returns a normalized map so UI doesn't break when backend changes shape.
   */
  static async detailsBatch(productIds: string[]): Promise<Record<string, Partial<CatalogProductFromAPI>>> {
    const ids = Array.from(new Set(productIds.map((x) => String(x || '').trim()).filter(Boolean)))
    if (ids.length === 0) return {}

    const res = await localApiClient.post('/Product/details-batch', { productIds: ids })
    const payload = res.data

    const list: any[] =
      Array.isArray(payload) ? payload
      : Array.isArray(payload?.data) ? payload.data
      : Array.isArray(payload?.items) ? payload.items
      : []

    const map: Record<string, Partial<CatalogProductFromAPI>> = {}

    for (const raw of list) {
      if (!raw || typeof raw !== 'object') continue
      const productId = String(raw.productId ?? raw.id ?? raw.ProductId ?? raw.Id ?? '').trim()
      if (!productId) continue

      map[productId] = {
        id: productId,
        sku: String(raw.sku ?? raw.Sku ?? raw.SKU ?? '').trim(),
        name: String(raw.name ?? raw.productName ?? raw.product_name ?? raw.Name ?? '').trim(),
        unit: String(raw.unit ?? raw.Unit ?? '').trim() || undefined,
        supplierId: String(raw.supplierId ?? raw.SupplierId ?? '').trim() || undefined,
        categoryName: String(raw.categoryName ?? raw.CategoryName ?? '').trim() || undefined,
        imageUrl: String(raw.imageUrl ?? raw.ImageUrl ?? '').trim() || undefined,
      }
    }

    return map
  }

  static async getProductById(id: string): Promise<CatalogProductFromAPI | null> {
    if (!id) return null
    const res = await localApiClient.get('/Product/Get-Product-by-ID', { params: { id } })
    const payload = res.data
    const obj = payload?.data && typeof payload.data === 'object' ? payload.data : payload
    if (!obj || typeof obj !== 'object') return null
    return obj as CatalogProductFromAPI
  }
}

