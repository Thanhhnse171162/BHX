const SERVICE_URLS = {
  ORDER: process.env.NEXT_PUBLIC_ORDER_URL || 'http://13.229.29.52:3003',
}

export const ordersEndpoints = {
  orders: {
    list: '/orders',
    create: '/orders',
    getById: (id: string) => `/orders/${id}`,
    update: (id: string) => `/orders/${id}`,
    cancel: (id: string) => `/orders/${id}/cancel`,
  },
  onlineOrders: {
    list: '/orders/online',
    create: '/orders/online',
  },
  posOrders: {
    list: '/orders/pos',
    create: '/orders/pos',
  },
}

export const ORDER_SERVICE_URL = SERVICE_URLS.ORDER
