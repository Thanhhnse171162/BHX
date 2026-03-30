const SERVICE_URLS = {
  IAM: process.env.NEXT_PUBLIC_IAM_URL || 'http://13.229.29.52:5000',
}

export const iamEndpoints = {
  auth: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    register: '/api/auth/register',
    refreshToken: '/api/auth/refresh',
    forgotPassword: '/api/auth/forgot-password',
    resetPassword: '/api/auth/reset-password',
    me: '/api/auth/me',
  },
  users: {
    list: '/api/users',
    create: '/api/users',
    getById: (id: string) => `/api/users/${id}`,
    update: (id: string) => `/api/users/${id}`,
    delete: (id: string) => `/api/users/${id}`,
    permissions: (id: string) => `/api/users/${id}/permissions`,
  },
  roles: {
    list: '/api/roles',
    create: '/api/roles',
    getById: (id: string) => `/api/roles/${id}`,
    update: (id: string) => `/api/roles/${id}`,
    delete: (id: string) => `/api/roles/${id}`,
  },
}

export const IAM_SERVICE_URL = SERVICE_URLS.IAM
