import axios from 'axios';

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

// API Service
export async function getInventoryChecks(): Promise<InventoryCheckListDto[]> {
  try {
    const res = await axios.get('/api/inventory-checks', { withCredentials: true });
    return res.data.data;
  } catch (err: any) {
    if (err.response && err.response.status === 401) {
      // Có thể xử lý chuyển hướng hoặc thông báo lỗi ở đây nếu cần
      throw new Error('Unauthorized: Vui lòng đăng nhập để xem lịch sử kiểm kê kho.');
    }
    throw err;
  }
}

export async function getInventoryCheckById(id: string): Promise<InventoryCheckDto> {
  const res = await axios.get(`/api/inventory-checks/${id}`);
  return res.data.data;
}

export async function createInventoryCheck(payload: CreateInventoryCheckDto): Promise<InventoryCheckDto> {
  const res = await axios.post('/api/inventory-checks', payload);
  return res.data.data;
}

export async function submitInventoryCheck(id: string, payload: SubmitInventoryCheckDto): Promise<InventoryCheckDto> {
  const res = await axios.put(`/api/inventory-checks/${id}/submit`, payload);
  return res.data.data;
}

export async function reconcileInventoryCheck(id: string): Promise<InventoryCheckItemDto[]> {
  const res = await axios.post(`/api/inventory-checks/${id}/reconcile`);
  return res.data.data;
}

export async function approveInventoryCheck(id: string, payload: ApproveInventoryCheckDto): Promise<InventoryCheckDto> {
  const res = await axios.put(`/api/inventory-checks/${id}/approve`, payload);
  return res.data.data;
}

export async function adjustInventoryCheck(id: string, payload: AdjustInventoryDto): Promise<InventoryCheckDto> {
  const res = await axios.put(`/api/inventory-checks/${id}/adjust`, payload);
  return res.data.data;
}
