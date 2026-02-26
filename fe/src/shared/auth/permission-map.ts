import { Permission, UserRole } from '@/shared/types'

export const rolePermissions: Record<UserRole, Permission[]> = {
  ADMIN: [
    'IAM_READ',
    'IAM_WRITE',
    'PRODUCT_READ',
    'PRODUCT_WRITE',
    'INVENTORY_READ',
    'INVENTORY_WRITE',
    'ORDER_ONLINE_READ',
    'ORDER_ONLINE_WRITE',
    'ORDER_POS_READ',
    'ORDER_POS_WRITE',
    'SHIFT_READ',
    'SHIFT_WRITE',
    'DELIVERY_READ',
    'DELIVERY_WRITE',
    'PROMO_READ',
    'PROMO_WRITE',
    'LOYALTY_READ',
    'LOYALTY_WRITE',
    'REPORT_READ',
    'CUSTOMER_READ',
    'CUSTOMER_WRITE',
  ],

  STORE_MANAGER: [
    'ORDER_ONLINE_READ',
    'ORDER_ONLINE_WRITE',
    'ORDER_POS_READ',
    'ORDER_POS_WRITE',
    'SHIFT_READ',
    'SHIFT_WRITE',
    'INVENTORY_READ',
    'REPORT_READ',
    'CUSTOMER_READ',
  ],

  WAREHOUSE_MANAGER: [
    'INVENTORY_READ',
    'INVENTORY_WRITE',
    'ORDER_ONLINE_READ',
    'REPORT_READ',
  ],

  WAREHOUSE_STAFF: [
    'INVENTORY_READ',
    'INVENTORY_WRITE',
    'SHIFT_READ',
  ],

  STAFF: [
    'ORDER_POS_READ',
    'ORDER_POS_WRITE',
    'SHIFT_READ',
    'INVENTORY_READ',
  ],

  CUSTOMER: [],
}

export const modulePermissions: Record<string, Permission[]> = {
  iam: ['IAM_READ', 'IAM_WRITE'],
  products: ['PRODUCT_READ', 'PRODUCT_WRITE'],
  inventory: ['INVENTORY_READ', 'INVENTORY_WRITE'],
  orderOnline: ['ORDER_ONLINE_READ', 'ORDER_ONLINE_WRITE'],
  orderPos: ['ORDER_POS_READ', 'ORDER_POS_WRITE'],
  shifts: ['SHIFT_READ', 'SHIFT_WRITE'],
  delivery: ['DELIVERY_READ', 'DELIVERY_WRITE'],
  promotions: ['PROMO_READ', 'PROMO_WRITE'],
  loyalty: ['LOYALTY_READ', 'LOYALTY_WRITE'],
  reports: ['REPORT_READ'],
  customers: ['CUSTOMER_READ', 'CUSTOMER_WRITE'],
}

export function canAccessModule(userPermissions: Permission[], module: string): boolean {
  const requiredPermissions = modulePermissions[module]
  if (!requiredPermissions || requiredPermissions.length === 0) return true

  return requiredPermissions.some((perm) => userPermissions.includes(perm))
}

export function canWrite(userPermissions: Permission[], module: string): boolean {
  const requiredPermissions = modulePermissions[module]
  if (!requiredPermissions || requiredPermissions.length === 0) return false

  const writePerm = requiredPermissions.find((perm) => perm.endsWith('_WRITE'))
  return writePerm ? userPermissions.includes(writePerm) : false
}

export function canRead(userPermissions: Permission[], module: string): boolean {
  const requiredPermissions = modulePermissions[module]
  if (!requiredPermissions || requiredPermissions.length === 0) return false

  const readPerm = requiredPermissions.find((perm) => perm.endsWith('_READ'))
  return readPerm ? userPermissions.includes(readPerm) : false
}
