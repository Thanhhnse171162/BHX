import axios, { AxiosInstance } from 'axios'
import { useAuthStore } from '@/store/auth.store'

/**
 * Local API Client - Gọi qua Next.js API routes (proxy)
 * Tránh CORS bằng cách gọi /api/* thay vì trực tiếp backend
 */
const localApiClient: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// Request interceptor to attach token
localApiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Types for Dashboard Response
export interface TopProduct {
  productId: string
  productName: string
  quantitySold: number
  revenue: number
}

export interface RevenueTrend {
  time: string
  revenue: number
}

export interface InventorySummary {
  totalProducts: number
  totalStock: number
  lowStock: number
  outOfStock: number
}

export interface Revenue {
  totalRevenue: number
  totalOrders: number
  totalProductsSold: number
  topProducts: TopProduct[]
}

export interface ManagerDashboardResponse {
  period: string
  fromDate: string
  toDate: string
  revenue: Revenue
  revenueTrend: RevenueTrend[]
  topProducts: TopProduct[]
  inventorySummary: InventorySummary
}

/**
 * Reports API Service - Kết nối với backend qua Next.js proxy
 * Endpoint: /api/reports -> forward đến http://13.229.29.52:5006/api/reports
 */
export class ReportsAPIService {
  private static baseURL = '/reports'

  /**
   * Lấy dashboard data cho Manager/Store Manager
   */
  static async getManagerDashboard(): Promise<ManagerDashboardResponse> {
    try {
      const response = await localApiClient.get<ManagerDashboardResponse>(
        `${this.baseURL}/manager/dashboard`
      )
      return response.data
    } catch (error) {
      console.error('Error fetching manager dashboard:', error)
      throw error
    }
  }

  /**
   * Lấy dashboard data cho Admin
   */
  static async getAdminDashboard(): Promise<ManagerDashboardResponse> {
    try {
      const response = await localApiClient.get<ManagerDashboardResponse>(
        `${this.baseURL}/admin/revenue`
      )
      return response.data
    } catch (error) {
      console.error('Error fetching admin dashboard:', error)
      throw error
    }
  }

  /**
   * Lấy revenue trend data
   */
  static async getRevenueTrend(): Promise<RevenueTrend[]> {
    try {
      const response = await localApiClient.get<{ data: RevenueTrend[] }>(
        `${this.baseURL}/revenue-trend`
      )
      return response.data.data || response.data
    } catch (error) {
      console.error('Error fetching revenue trend:', error)
      throw error
    }
  }

  /**
   * Lấy top products
   */
  static async getTopProducts(): Promise<TopProduct[]> {
    try {
      const response = await localApiClient.get<{ data: TopProduct[] }>(
        `${this.baseURL}/top-products`
      )
      return response.data.data || response.data
    } catch (error) {
      console.error('Error fetching top products:', error)
      throw error
    }
  }

  /**
   * Lấy inventory summary
   */
  static async getInventorySummary(): Promise<InventorySummary> {
    try {
      const response = await localApiClient.get<InventorySummary>(
        `${this.baseURL}/inventory-summary`
      )
      return response.data
    } catch (error) {
      console.error('Error fetching inventory summary:', error)
      throw error
    }
  }
}
