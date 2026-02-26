import { UserRole, ROLE_ID_MAP } from '@/shared/types'

/**
 * Convert roleId (số) sang UserRole (string)
 * Database mapping:
 * 1 = Admin
 * 2 = WareHouse Manager
 * 3 = Store Manager
 * 4 = Warehouse Staff
 * 5 = Store Staff (STAFF PORTAL)
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
 * Kiểm tra user có phải là staff không
 */
export function isStaffUser(roleId: number, email: string): boolean {
  return roleId === 5 && isCompanyEmail(email)
}

/**
 * Kiểm tra user có phải là warehouse staff không
 */
export function isWarehouseStaffUser(roleId: number, email: string): boolean {
  return roleId === 4 && isCompanyEmail(email)
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
    STORE_MANAGER: '/ops',
    WAREHOUSE_MANAGER: '/ops',
    WAREHOUSE_STAFF: '/warehouse',
    STAFF: '/staff',
    CUSTOMER: '/customer',
  }
  return paths[role] || '/'
}
