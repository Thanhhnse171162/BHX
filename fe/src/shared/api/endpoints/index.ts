// Re-export all endpoints from individual modules
export * from './iam'
export * from './orders'
export * from './inventory'
export * from './catalog'
export * from './promotion'
export * from './loyalty'
export * from './delivery'
export * from './shift'
export * from './customer'
export * from './reporting'

// For backward compatibility, re-export as single endpoints object
import { iamEndpoints } from './iam'
import { ordersEndpoints } from './orders'
import { inventoryEndpoints } from './inventory'
import { catalogEndpoints } from './catalog'
import { promotionEndpoints } from './promotion'
import { loyaltyEndpoints } from './loyalty'
import { deliveryEndpoints } from './delivery'
import { shiftEndpoints } from './shift'
import { customerEndpoints } from './customer'
import { reportingEndpoints } from './reporting'

export const endpoints = {
  ...iamEndpoints,
  ...ordersEndpoints,
  ...inventoryEndpoints,
  ...catalogEndpoints,
  ...promotionEndpoints,
  ...loyaltyEndpoints,
  ...deliveryEndpoints,
  ...shiftEndpoints,
  ...customerEndpoints,
  ...reportingEndpoints,
}

// Export SERVICE_URLS object for backward compatibility
export const SERVICE_URLS = {
  IAM: process.env.NEXT_PUBLIC_IAM_URL || 'http://13.229.29.52:5000',
  ORDER: process.env.NEXT_PUBLIC_ORDER_URL || 'http://13.229.29.52:3003',
  INVENTORY: process.env.NEXT_PUBLIC_INVENTORY_URL || 'http://13.229.29.52:5003',
  CATALOG: process.env.NEXT_PUBLIC_CATALOG_URL || 'http://13.229.29.52:5001',
  PROMOTION: process.env.NEXT_PUBLIC_PROMOTION_URL || 'http://13.229.29.52:3006',
  LOYALTY: process.env.NEXT_PUBLIC_LOYALTY_URL || 'http://13.229.29.52:3007',
  DELIVERY: process.env.NEXT_PUBLIC_DELIVERY_URL || 'http://13.229.29.52:3008',
  SHIFT: process.env.NEXT_PUBLIC_SHIFT_URL || 'http://13.229.29.52:3009',
  CUSTOMER: process.env.NEXT_PUBLIC_CUSTOMER_URL || 'http://13.229.29.52:3010',
  REPORTING: process.env.NEXT_PUBLIC_REPORTING_URL || 'http://13.229.29.52:3011',
}

export default SERVICE_URLS
