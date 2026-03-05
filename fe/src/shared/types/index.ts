export type UserRole = 'CUSTOMER' | 'STAFF' | 'STORE_MANAGER' | 'WAREHOUSE_MANAGER' | 'WAREHOUSE_STAFF' | 'ADMIN'

// Role ID mapping theo database IdentityDB (5 roles)
export const ROLE_ID_MAP: Record<number, UserRole> = {
  1: 'ADMIN',            // Admin - System Administrator - Full Access
  2: 'STORE_MANAGER',   // Manager - Store Manager - Manage store operations
  3: 'STAFF',           // Store Staff - Process sales transactions (CASHIER PORTAL)
  4: 'WAREHOUSE_STAFF', // Warehouse Staff - Manage inventory
  5: 'CUSTOMER',        // Customer - Online shopping
}

export type Permission =
  | 'IAM_READ'
  | 'IAM_WRITE'
  | 'PRODUCT_READ'
  | 'PRODUCT_WRITE'
  | 'INVENTORY_READ'
  | 'INVENTORY_WRITE'
  | 'ORDER_ONLINE_READ'
  | 'ORDER_ONLINE_WRITE'
  | 'ORDER_POS_READ'
  | 'ORDER_POS_WRITE'
  | 'SHIFT_READ'
  | 'SHIFT_WRITE'
  | 'DELIVERY_READ'
  | 'DELIVERY_WRITE'
  | 'PROMO_READ'
  | 'PROMO_WRITE'
  | 'LOYALTY_READ'
  | 'LOYALTY_WRITE'
  | 'REPORT_READ'
  | 'CUSTOMER_READ'
  | 'CUSTOMER_WRITE'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  roleId?: number
  permissions: Permission[]
  storeId?: string
  warehouseId?: string
  createdAt: string
  updatedAt: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
  timestamp: string
}

export interface ApiError {
  status: number
  message: string
  code: string
  details?: Record<string, unknown>
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  quantity: number
  categoryId: string
  imageUrl?: string
  sku: string
  status: 'active' | 'inactive' | 'discontinued'
  createdAt: string
  updatedAt: string
}

export interface Order {
  id: string
  orderNumber: string
  customerId: string
  items: OrderItem[]
  totalAmount: number
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  orderType: 'online' | 'pos'
  storeId?: string
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  productId: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface InventoryRecord {
  id: string
  productId: string
  quantity: number
  warehouseId?: string
  storeId?: string
  lastAdjustment?: string
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  description?: string
  parentId?: string
  imageUrl?: string
  createdAt: string
  updatedAt: string
}

export interface Promotion {
  id: string
  name: string
  description?: string
  type: 'percentage' | 'fixed' | 'buy_one_get_one'
  value: number
  code?: string
  startDate: string
  endDate: string
  applicableProducts?: string[]
  maxUses?: number
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export interface Customer {
  id: string
  email: string
  phone?: string
  firstName: string
  lastName: string
  loyaltyPoints: number
  createdAt: string
  updatedAt: string
}

export interface Shift {
  id: string
  staffId: string
  storeId: string
  startTime: string
  endTime: string
  date: string
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled'
  createdAt: string
  updatedAt: string
}
