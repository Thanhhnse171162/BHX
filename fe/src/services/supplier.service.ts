import { useAuthStore } from '@/store/auth.store'
import type {
  CreateSupplierPayload,
  SupplierListItem,
  UpdateSupplierPayload,
} from '@/types/supplier.types'

function getApiBaseUrl(): string {
  // Always call same-origin Next.js API proxy to avoid browser mixed-content/CORS issues.
  return '/api/suppliers'
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
    const res = await fetch(`${getApiBaseUrl()}`, {
      method: 'GET',
      headers: buildHeaders(),
    })
    const data = await parseResponse<SupplierApiRaw[]>(res)
    if (!Array.isArray(data)) return []
    return data.map(normalizeSupplier)
  },

  async getSupplierById(id: string): Promise<SupplierListItem> {
    const res = await fetch(`${getApiBaseUrl()}/${id}`, {
      method: 'GET',
      headers: buildHeaders(),
    })
    const data = await parseResponse<SupplierApiRaw>(res)
    return normalizeSupplier(data)
  },

  async createSupplier(payload: CreateSupplierPayload): Promise<SupplierListItem> {
    const res = await fetch(`${getApiBaseUrl()}`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    })
    const data = await parseResponse<SupplierApiRaw>(res)
    return normalizeSupplier(data)
  },

  async updateSupplier(id: string, payload: UpdateSupplierPayload): Promise<SupplierListItem> {
    const res = await fetch(`${getApiBaseUrl()}/${id}`, {
      method: 'PATCH',
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    })
    const data = await parseResponse<SupplierApiRaw>(res)
    return normalizeSupplier(data)
  },

  async deleteSupplier(id: string): Promise<void> {
    const res = await fetch(`${getApiBaseUrl()}/${id}`, {
      method: 'DELETE',
      headers: buildHeaders(),
    })
    await parseResponse<unknown>(res)
  },
}