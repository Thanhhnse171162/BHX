import { UserRole, ROLE_ID_MAP } from '@/shared/types'

/**
 * Convert roleId (số) sang UserRole (string)
 * Database IdentityDB mapping (6 roles):
 * 1 = Admin
 * 2 = Store Manager
 * 3 = Warehouse Manager  ← Warehouse Portal
 * 4 = Store Staff  ← Cashier Portal
 * 5 = Warehouse Staff  ← Warehouse-Store Portal
 * 6 = Customer
 */
export function getRoleFromId(roleId: number): UserRole {
  return ROLE_ID_MAP[roleId] || 'CUSTOMER'
}

/**
 * Kiểm tra email có đuôi @company.com
 */
export function isCompanyEmail(email: string): boolean {
  return email.toLowerCase().endsWith('@company.com')
}

/**
 * Kiểm tra user có phải là Store Staff/Cashier không (role 4)
 */
export function isStaffUser(roleId: number, email: string): boolean {
  return roleId === 4 && isCompanyEmail(email)
}

/**
 * Kiểm tra user có phải là Store Manager không (role 2)
 */
export function isStoreManagerUser(roleId: number, email: string): boolean {
  return roleId === 2 && isCompanyEmail(email)
}

/**
 * Kiểm tra user có phải là Warehouse Manager không (role 3)
 */
export function isWarehouseManagerUser(roleId: number, email: string): boolean {
  return roleId === 3 && isCompanyEmail(email)
}

/**
 * Kiểm tra user có phải là Warehouse Staff không (role 5)
 */
export function isWarehouseStaffUser(roleId: number, email: string): boolean {
  return roleId === 5 && isCompanyEmail(email)
}

/**
 * Xác định role thực tế: nếu email không có đuôi @company.com thì chỉ là CUSTOMER
 */
export function resolveRole(roleId: number, email: string): UserRole {
  if (!isCompanyEmail(email)) {
    return 'CUSTOMER'
  }
  return getRoleFromId(roleId)
}

/**
 * Lấy redirect path dựa trên role
 */
export function getRedirectPath(role: UserRole): string {
  const paths: Record<UserRole, string> = {
    ADMIN: '/admin/dashboard',
    STORE_MANAGER: '/warehouse',    // Manager (role 2) → warehouse portal
    WAREHOUSE_MANAGER: '/warehouse', // legacy
    WAREHOUSE_STAFF: '/warehouse-store',
    STAFF: '/cashier',              // Store Staff (role 3) → cashier portal
    CUSTOMER: '/customer',
  }
  return paths[role] || '/'
}
