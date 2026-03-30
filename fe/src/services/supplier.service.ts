import { useAuthStore } from '@/store/auth.store'
import type {
  CreateSupplierPayload,
  SupplierListItem,
  UpdateSupplierPayload,
} from '@/types/supplier.types'

const DEFAULT_CATALOG_BASE_URL = 'http://13.229.29.52:5001'

function normalizeBaseUrl(value?: string): string {
  return String(value || '').trim().replace(/\/+$/, '')
}

function getApiBaseUrl(): string {
  // Supplier API currently belongs to Catalog service.
  // Prefer catalog URL, fallback to gateway URL when needed.
  const catalogUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_CATALOG_URL)
  const apiGatewayUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL)
  const baseUrl = catalogUrl || apiGatewayUrl || DEFAULT_CATALOG_BASE_URL

  if (!catalogUrl && !apiGatewayUrl && process.env.NODE_ENV !== 'development') {
    console.warn(
      '[supplier.service] NEXT_PUBLIC_CATALOG_URL and NEXT_PUBLIC_API_BASE_URL are missing. Falling back to default Catalog URL.'
    )
  }

  return baseUrl
}

interface SupplierApiRaw {
  id?: string
  name?: string
  phone?: string
  email?: string
  contactPerson?: string
  status?: string
  isDeleted?: boolean
  createdAt?: string
  updatedAt?: string | null
}

function buildHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (typeof window !== 'undefined') {
    const token = useAuthStore.getState().token
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  return headers
}

async function parseResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const payload = isJson ? await res.json().catch(() => null) : await res.text().catch(() => '')

  if (!res.ok) {
    const message =
      (payload &&
      typeof payload === 'object' &&
      'message' in payload &&
      typeof payload.message === 'string'
        ? payload.message
        : null) ||
      (typeof payload === 'string' && payload.trim() ? payload : null) ||
      `Request failed with status ${res.status}`
    throw new Error(message)
  }

  return payload as T
}

function normalizeSupplier(raw: SupplierApiRaw): SupplierListItem {
  return {
    id: raw.id ?? '',
    name: raw.name ?? '',
    phone: raw.phone ?? '',
    email: raw.email ?? '',
    contactPerson: raw.contactPerson ?? '',
    status: raw.status ?? 'INACTIVE',
    isDeleted: Boolean(raw.isDeleted),
    createdAt: raw.createdAt ?? '',
    updatedAt: raw.updatedAt ?? null,
  }
}

export const supplierService = {
  async getSuppliers(): Promise<SupplierListItem[]> {
    const res = await fetch(`${getApiBaseUrl()}/api/Supplier/suppliers`, {
      method: 'GET',
      headers: buildHeaders(),
    })
    const data = await parseResponse<SupplierApiRaw[]>(res)
    if (!Array.isArray(data)) return []
    return data.map(normalizeSupplier)
  },

  async getSupplierById(id: string): Promise<SupplierListItem> {
    const res = await fetch(`${getApiBaseUrl()}/api/Supplier/suppliers/${id}`, {
      method: 'GET',
      headers: buildHeaders(),
    })
    const data = await parseResponse<SupplierApiRaw>(res)
    return normalizeSupplier(data)
  },

  async createSupplier(payload: CreateSupplierPayload): Promise<SupplierListItem> {
    const res = await fetch(`${getApiBaseUrl()}/api/Supplier/suppliers/add`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    })
    const data = await parseResponse<SupplierApiRaw>(res)
    return normalizeSupplier(data)
  },

  async updateSupplier(id: string, payload: UpdateSupplierPayload): Promise<SupplierListItem> {
    const res = await fetch(`${getApiBaseUrl()}/api/Supplier/suppliers/${id}`, {
      method: 'PATCH',
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    })
    const data = await parseResponse<SupplierApiRaw>(res)
    return normalizeSupplier(data)
  },

  async deleteSupplier(id: string): Promise<void> {
    const res = await fetch(`${getApiBaseUrl()}/api/Supplier/suppliers/${id}`, {
      method: 'DELETE',
      headers: buildHeaders(),
    })
    await parseResponse<unknown>(res)
  },
}