const SERVICE_URLS = {
  INVENTORY: process.env.NEXT_PUBLIC_INVENTORY_URL || 'http://13.229.29.52:5003',
}

export const inventoryEndpoints = {
  inventory: {
    list: '/inventory',
    getByProduct: (productId: string) => `/inventory/product/${productId}`,
    adjust: '/inventory/adjust',
    getByWarehouse: (warehouseId: string) => `/inventory/warehouse/${warehouseId}`,
    getByStore: (storeId: string) => `/inventory/store/${storeId}`,
  },
}

export const INVENTORY_SERVICE_URL = SERVICE_URLS.INVENTORY
