import { useAuthStore } from '@/store/auth.store'

type LocationType = 'STORE' | 'WAREHOUSE'

export interface CreateDamageReportPayload {
  locationType: LocationType
  locationId: string
  productId: string
  damageType: string
  reportedDate: string
  quality: number
  description: string
  photos?: File[]
}

interface DamageReportApiEnvelope<T> {
  success: boolean
  message?: string
  data: T
}

const DAMAGE_REPORT_CACHE_KEY = 'damage-report-cache-v1'

function readDamageReportCache(): DamageReportFromAPI[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(DAMAGE_REPORT_CACHE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeDamageReportCache(rows: DamageReportFromAPI[]) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(DAMAGE_REPORT_CACHE_KEY, JSON.stringify(rows))
  } catch {
    // Ignore storage write errors (private mode/full storage)
  }
}

function mergeUniqueById(rows: DamageReportFromAPI[]): DamageReportFromAPI[] {
  const map = new Map<string, DamageReportFromAPI>()
  rows.forEach((row) => {
    const current = map.get(row.id)
    if (!current) {
      map.set(row.id, row)
      return
    }

    const merged: DamageReportFromAPI = {
      ...current,
      ...row,
    }

    const nextHasPhotos = Array.isArray(row.photos) && row.photos.length > 0
    const currentHasPhotos = Array.isArray(current.photos) && current.photos.length > 0
    if (!nextHasPhotos && currentHasPhotos) {
      merged.photos = current.photos
    }

    map.set(row.id, merged)
  })
  return Array.from(map.values())
}

export interface DamageReportFromAPI {
  id: string
  reportNumber?: string
  locationType?: LocationType
  locationId?: string
  productId?: string
  damageType?: string
  reportedBy?: string
  reportedByName?: string
  reportedDate?: string
  quality?: number
  description?: string
  photos?: string[]
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | string
  approvedBy?: string | null
  approvedByName?: string | null
  approvedDate?: string | null
  createdAt?: string
}

interface DamageReportFilter {
  locationId?: string
  locationType?: LocationType
}

export class DamageReportAPIService {
  static async getDamageReportById(id: string): Promise<DamageReportFromAPI | null> {
    if (!id) return null

    const headers: HeadersInit = {}
    if (typeof window !== 'undefined') {
      const token = useAuthStore.getState().token
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }
    }

    const response = await fetch(`/api/damage-reports?id=${encodeURIComponent(id)}`, {
      method: 'GET',
      headers,
    })

    const contentType = response.headers.get('content-type') || ''
    const result = contentType.includes('application/json')
      ? await response.json().catch(() => null)
      : await response.text().catch(() => null)

    if (!response.ok) {
      return null
    }

    const detail =
      result && typeof result === 'object' && 'data' in result
        ? ((result as any).data as DamageReportFromAPI)
        : (result as DamageReportFromAPI)

    if (detail) {
      this.saveReportToCache(detail)
    }

    return detail || null
  }

  static async getDamageReports(filter?: DamageReportFilter): Promise<DamageReportFromAPI[]> {
    const headers: HeadersInit = {}
    if (typeof window !== 'undefined') {
      const token = useAuthStore.getState().token
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }
    }

    const response = await fetch('/api/damage-reports', {
      method: 'GET',
      headers,
    })

    const contentType = response.headers.get('content-type') || ''
    const result = contentType.includes('application/json')
      ? await response.json().catch(() => null)
      : await response.text().catch(() => null)

    if (!response.ok) {
      const message =
        (result && typeof result === 'object' && ((result as any).message || (result as any).error)) ||
        `Get damage reports failed with status ${response.status}`
      // Fallback to local cache if backend list endpoint is unavailable.
      if (response.status === 404) {
        const cachedRows = readDamageReportCache()
        return this.filterByLocation(cachedRows, filter)
      }
      throw new Error(String(message))
    }

    let apiRows: DamageReportFromAPI[] = []
    if (Array.isArray(result)) {
      apiRows = result as DamageReportFromAPI[]
    } else if (result && typeof result === 'object' && 'data' in result && Array.isArray((result as any).data)) {
      apiRows = (result as any).data as DamageReportFromAPI[]
    }

    // Keep backend as source of truth: fresh API rows must override local cache.
    const merged = mergeUniqueById([...readDamageReportCache(), ...apiRows])
    writeDamageReportCache(merged)
    return this.filterByLocation(merged, filter)
  }

  private static filterByLocation(rows: DamageReportFromAPI[], filter?: DamageReportFilter): DamageReportFromAPI[] {
    if (!filter?.locationId && !filter?.locationType) return rows

    const normalizedLocationId = filter.locationId?.toLowerCase().trim()
    return rows.filter((row) => {
      const matchesLocationType = filter.locationType
        ? row.locationType?.toUpperCase() === filter.locationType.toUpperCase()
        : true

      const matchesLocationId = normalizedLocationId
        ? row.locationId?.toLowerCase().trim() === normalizedLocationId
        : true

      return matchesLocationType && matchesLocationId
    })
  }

  static saveReportToCache(report: DamageReportFromAPI) {
    const merged = mergeUniqueById([report, ...readDamageReportCache()])
    writeDamageReportCache(merged)
  }

  static clearCache() {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.removeItem(DAMAGE_REPORT_CACHE_KEY)
    } catch {
      // Ignore
    }
  }

  static async createDamageReport(payload: CreateDamageReportPayload): Promise<DamageReportFromAPI> {
    const formData = new FormData()
    formData.append('LocationType', payload.locationType)
    formData.append('LocationId', payload.locationId)
    formData.append('ProductId', payload.productId)
    formData.append('DamageType', payload.damageType)
    formData.append('ReportedDate', payload.reportedDate)
    formData.append('Quality', String(payload.quality))
    formData.append('Description', payload.description)

    if (Array.isArray(payload.photos)) {
      payload.photos.forEach((photo) => {
        formData.append('Photos', photo)
      })
    }

    const headers: HeadersInit = {}
    if (typeof window !== 'undefined') {
      const token = useAuthStore.getState().token
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }
    }

    const response = await fetch('/api/damage-reports', {
      method: 'POST',
      headers,
      body: formData,
    })

    const contentType = response.headers.get('content-type') || ''
    const result = contentType.includes('application/json')
      ? await response.json().catch(() => null)
      : await response.text().catch(() => null)

    if (!response.ok) {
      const message =
        (result && typeof result === 'object' && ((result as any).message || (result as any).error)) ||
        `Create damage report failed with status ${response.status}`
      throw new Error(String(message))
    }

    if (result && typeof result === 'object' && 'data' in result) {
      const row = (result as DamageReportApiEnvelope<DamageReportFromAPI>).data
      this.saveReportToCache(row)
      return row
    }

    const row = result as DamageReportFromAPI
    this.saveReportToCache(row)
    return row
  }

  static async approveDamageReport(id: string): Promise<DamageReportFromAPI | null> {
    if (!id) {
      throw new Error('Damage report id is required')
    }

    const headers: HeadersInit = {}
    if (typeof window !== 'undefined') {
      const token = useAuthStore.getState().token
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }
    }

    const response = await fetch(`/api/damage-reports/${encodeURIComponent(id)}/approve`, {
      method: 'PUT',
      headers,
    })

    const contentType = response.headers.get('content-type') || ''
    const result = contentType.includes('application/json')
      ? await response.json().catch(() => null)
      : await response.text().catch(() => null)

    if (!response.ok) {
      const message =
        (result && typeof result === 'object' && ((result as any).message || (result as any).error || (result as any).detail)) ||
        `Approve damage report failed with status ${response.status}`
      throw new Error(String(message))
    }

    const approvedReport =
      result && typeof result === 'object' && 'data' in result
        ? ((result as any).data as DamageReportFromAPI)
        : (result as DamageReportFromAPI)

    if (approvedReport?.id) {
      this.saveReportToCache(approvedReport)
    }

    return approvedReport || null
  }
}
