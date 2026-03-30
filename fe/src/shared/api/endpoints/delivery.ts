const SERVICE_URLS = {
  DELIVERY: process.env.NEXT_PUBLIC_DELIVERY_URL || 'http://13.229.29.52:3008',
}

export const deliveryEndpoints = {
  delivery: {
    list: '/delivery',
    create: '/delivery',
    getById: (id: string) => `/delivery/${id}`,
    update: (id: string) => `/delivery/${id}`,
    track: (id: string) => `/delivery/${id}/track`,
  },
}

export const DELIVERY_SERVICE_URL = SERVICE_URLS.DELIVERY
