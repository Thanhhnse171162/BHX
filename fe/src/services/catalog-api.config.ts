import axios, { AxiosInstance } from 'axios'
import { useAuthStore } from '@/store/auth.store'

/**
 * Catalog Service Client
 * Kết nối trực tiếp đến Product Service (Port 5001)
 */
const CATALOG_SERVICE_URL = process.env.NEXT_PUBLIC_CATALOG_URL || 'http://localhost:5001'

export const catalogClient: AxiosInstance = axios.create({
  baseURL: CATALOG_SERVICE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor để attach token
catalogClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = useAuthStore.getState().token
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor để handle errors
catalogClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Catalog API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
    })
    return Promise.reject(error)
  }
)
