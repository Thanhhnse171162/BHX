import axios, { AxiosInstance } from 'axios'
import { useAuthStore } from '@/store/auth.store'

const localApiClient: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

localApiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// DTOs
export interface InventoryCheckListDto {
  id: string;
  checkNumber: string;
  locationType: string;
  locationId: string;
  checkType: string;
  checkDate: string;
  checkedBy: string;
  status: string;
  totalDiscrepancies: number;
  createdAt: string;
}

export interface InventoryCheckItemDto {
  id: string;
  productId: string;
  unit?: string;
  Unit?: string;
  systemQuantity: number;
  actualQuantity: number;
  difference: number;
  note?: string;
}

export interface InventoryCheckDto {
  id: string;
  checkNumber: string;
  locationType: string;
  locationId: string;
  checkType: string;
  checkDate: string;
  checkedBy: string;
  status: string;
  totalDiscrepancies: number;
  notes?: string;
  createdAt: string;
  items: InventoryCheckItemDto[];
}

export interface CreateInventoryCheckDto {
  locationType: string;
  locationId: string;
  checkType: string;
  notes?: string;
}

export interface InventoryCheckItemSubmitDto {
  productId: string;
  unit?: string;
  actualQuantity: number;
  note?: string;
}

export interface SubmitInventoryCheckDto {
  items: InventoryCheckItemSubmitDto[];
}

export interface ApproveInventoryCheckDto {
  notes?: string;
}

export interface AdjustInventoryDto {
  reason?: string;
}

interface InventoryCheckApiResponse<T> {
  success?: boolean
  message?: string
  data: T
}

// API Service
export async function getInventoryChecks(): Promise<InventoryCheckListDto[]> {
  try {
    const res = await localApiClient.get<InventoryCheckApiResponse<InventoryCheckListDto[]>>('/inventory-checks')
    return Array.isArray(res.data?.data) ? res.data.data : []
  } catch (err: any) {
    if (err.response && err.response.status === 401) {
      // Có thể xử lý chuyển hướng hoặc thông báo lỗi ở đây nếu cần
      throw new Error('Unauthorized: Vui lòng đăng nhập để xem lịch sử kiểm kê kho.')
    }
    throw err
  }
}

export async function getInventoryCheckById(id: string): Promise<InventoryCheckDto> {
  const res = await localApiClient.get<InventoryCheckApiResponse<InventoryCheckDto>>(`/inventory-checks/${id}`)
  return res.data.data
}

export async function createInventoryCheck(payload: CreateInventoryCheckDto): Promise<InventoryCheckDto> {
  try {
    // Backend expects PascalCase field names based on damage-report patterns
    const requestPayload = {
      LocationType: payload.locationType,
      LocationId: payload.locationId,
      CheckType: payload.checkType,
      Notes: payload.notes || '',
    }

    console.log('Creating inventory check with payload:', JSON.stringify(requestPayload, null, 2))

    const res = await localApiClient.post<InventoryCheckApiResponse<InventoryCheckDto>>('/inventory-checks', requestPayload)
    console.log('Inventory check created:', res.data.data)
    return res.data.data
  } catch (err: any) {
    console.error('createInventoryCheck error:', {
      status: err.response?.status,
      data: err.response?.data,
      message: err.message,
    })
    throw err
  }
}

export async function submitInventoryCheck(id: string, payload: SubmitInventoryCheckDto): Promise<InventoryCheckDto> {
  const res = await localApiClient.put<InventoryCheckApiResponse<InventoryCheckDto>>(`/inventory-checks/${id}/submit`, payload)
  return res.data.data
}

export async function reconcileInventoryCheck(id: string): Promise<InventoryCheckItemDto[]> {
  const res = await localApiClient.post<InventoryCheckApiResponse<InventoryCheckItemDto[]>>(`/inventory-checks/${id}/reconcile`)
  return Array.isArray(res.data?.data) ? res.data.data : []
}

export async function approveInventoryCheck(id: string, payload: ApproveInventoryCheckDto): Promise<InventoryCheckDto> {
  const res = await localApiClient.put<InventoryCheckApiResponse<InventoryCheckDto>>(`/inventory-checks/${id}/approve`, payload)
  return res.data.data
}

export async function adjustInventoryCheck(id: string, payload: AdjustInventoryDto): Promise<InventoryCheckDto> {
  const res = await localApiClient.put<InventoryCheckApiResponse<InventoryCheckDto>>(`/inventory-checks/${id}/adjust`, payload)
  return res.data.data
}
