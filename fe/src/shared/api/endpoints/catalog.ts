const SERVICE_URLS = {
  CATALOG: process.env.NEXT_PUBLIC_CATALOG_URL || 'http://13.229.29.52:5001',
}

export const catalogEndpoints = {
  products: {
    list: '/products',
    create: '/products',
    getById: (id: string) => `/products/${id}`,
    update: (id: string) => `/products/${id}`,
    delete: (id: string) => `/products/${id}`,
  },
  categories: {
    list: '/categories',
    create: '/categories',
    getById: (id: string) => `/categories/${id}`,
    update: (id: string) => `/categories/${id}`,
    delete: (id: string) => `/categories/${id}`,
  },
}

export const CATALOG_SERVICE_URL = SERVICE_URLS.CATALOG
