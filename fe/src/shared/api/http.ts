import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to attach token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(process.env.NEXT_PUBLIC_TOKEN_KEY || 'auth_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors and token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Handle 401 Unauthorized - KHÔNG redirect nếu đang ở trang login/register
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname
        
        // Chỉ redirect nếu KHÔNG ở trang login/register/forgot-password/reset-password
        if (!currentPath.includes('/login') && 
            !currentPath.includes('/register') && 
            !currentPath.includes('/forgot-password') &&
            !currentPath.includes('/reset-password')) {
          // Clear auth state and redirect to login
          localStorage.removeItem(process.env.NEXT_PUBLIC_TOKEN_KEY || 'auth_token')
          localStorage.removeItem(process.env.NEXT_PUBLIC_REFRESH_TOKEN_KEY || 'refresh_token')
          window.location.href = '/login'
        }
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname
        if (!currentPath.includes('/403')) {
          window.location.href = '/403'
        }
      }
    }

    return Promise.reject(error)
  }
)

export default axiosInstance

// ========================================
// IAM Service Client
// ========================================
// Gọi qua Next.js proxy (/iam/*) để tránh CORS
// next.config.js sẽ rewrite /iam/* -> http://localhost:5000/*
export const iamClient: AxiosInstance = axios.create({
  baseURL: '/iam',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor cho IAM client
iamClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(process.env.NEXT_PUBLIC_TOKEN_KEY || 'auth_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response interceptor cho IAM client
iamClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Handle 401 Unauthorized - KHÔNG redirect nếu đang ở trang login/register
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname
        
        // Chỉ redirect nếu KHÔNG ở trang login/register/forgot-password/reset-password
        if (!currentPath.includes('/login') && 
            !currentPath.includes('/register') && 
            !currentPath.includes('/forgot-password') &&
            !currentPath.includes('/reset-password')) {
          // Clear auth state and redirect to login
          localStorage.removeItem(process.env.NEXT_PUBLIC_TOKEN_KEY || 'auth_token')
          localStorage.removeItem(process.env.NEXT_PUBLIC_REFRESH_TOKEN_KEY || 'refresh_token')
          window.location.href = '/login'
        }
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname
        if (!currentPath.includes('/403')) {
          window.location.href = '/403'
        }
      }
    }

    return Promise.reject(error)
  }
)

// ========================================
// Local API Client (Next.js API Routes)
// ========================================
export const localApiClient: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor cho local API client
localApiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(process.env.NEXT_PUBLIC_TOKEN_KEY || 'auth_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response interceptor cho local API client
localApiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    return Promise.reject(error)
  }
)

