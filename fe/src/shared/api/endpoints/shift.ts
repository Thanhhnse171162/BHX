const SERVICE_URLS = {
  SHIFT: process.env.NEXT_PUBLIC_SHIFT_URL || 'http://13.229.29.52:3009',
}

export const shiftEndpoints = {
  shifts: {
    list: '/shifts',
    create: '/shifts',
    getById: (id: string) => `/shifts/${id}`,
    update: (id: string) => `/shifts/${id}`,
    cancel: (id: string) => `/shifts/${id}/cancel`,
    clockIn: (id: string) => `/shifts/${id}/clock-in`,
    clockOut: (id: string) => `/shifts/${id}/clock-out`,
  },
}

export const SHIFT_SERVICE_URL = SERVICE_URLS.SHIFT
