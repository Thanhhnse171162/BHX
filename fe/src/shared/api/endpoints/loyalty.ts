const SERVICE_URLS = {
  LOYALTY: process.env.NEXT_PUBLIC_LOYALTY_URL || 'http://13.229.29.52:3007',
}

export const loyaltyEndpoints = {
  loyalty: {
    customer: (customerId: string) => `/loyalty/customer/${customerId}`,
    addPoints: '/loyalty/points/add',
    redeemPoints: '/loyalty/points/redeem',
  },
}

export const LOYALTY_SERVICE_URL = SERVICE_URLS.LOYALTY
