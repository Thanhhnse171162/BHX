const SERVICE_URLS = {
  REPORTING: process.env.NEXT_PUBLIC_REPORTING_URL || 'http://13.229.29.52:3011',
}

export const reportingEndpoints = {
  reports: {
    sales: '/reports/sales',
    inventory: '/reports/inventory',
    orders: '/reports/orders',
    revenue: '/reports/revenue',
    staffPerformance: '/reports/staff-performance',
  },
}

export const REPORTING_SERVICE_URL = SERVICE_URLS.REPORTING
