const SERVICE_URLS = {
  PROMOTION: process.env.NEXT_PUBLIC_PROMOTION_URL || 'http://13.229.29.52:3006',
}

export const promotionEndpoints = {
  promotions: {
    list: '/promotions',
    create: '/promotions',
    getById: (id: string) => `/promotions/${id}`,
    update: (id: string) => `/promotions/${id}`,
    delete: (id: string) => `/promotions/${id}`,
    validate: '/promotions/validate',
  },
}

export const PROMOTION_SERVICE_URL = SERVICE_URLS.PROMOTION
