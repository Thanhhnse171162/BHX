import { localApiClient, iamClient } from '@/shared/api/http'
import { iamEndpoints } from '@/shared/api/endpoints'

interface LoginRequest {
  email: string
  password: string
}

interface LoginResponse {
  success: boolean
  message?: string
  data?: {
    accessToken: string
    refreshToken?: string
    email: string
    fullName: string
    name?: string
    roleId: number
    userId?: string
    id?: string
    isEmailVerified?: boolean
    emailVerified?: boolean
    createdAt?: string
    updatedAt?: string
  }
  // Fallback properties if data is at root level
  accessToken?: string
  token?: string
  email?: string
  fullName?: string
  name?: string
  roleId?: number
  userId?: string
  id?: string
  isEmailVerified?: boolean
  emailVerified?: boolean
  createdAt?: string
  updatedAt?: string
}

interface RegisterRequest {
  FullName?: string
  Name?: string
  Email: string
  Phone: string // Backend require Phone
  Password: string
  ConfirmPassword?: string
  // Lowercase cho FE
  fullName?: string
  name?: string
  email?: string
  phone?: string
  password?: string
  confirmPassword?: string
}

interface RegisterResponse {
  success: boolean
  message: string
  user: {
    id: string
    email: string
    fullName: string
    phone?: string
  }
}

interface ApiErrorResponse {
  error?: string
  message?: string
  success: boolean
}

/**
 * Auth Service - Gọi backend IAM microservice
 * Backend đang chạy trên http://localhost:5000
 */
export const authService = {
  /**
   * Login - Đăng nhập qua local API route (kết nối trực tiếp database)
   */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await localApiClient.post<LoginResponse>('/auth/login', data)
      return response.data
    } catch (error: any) {
      const apiError = error.response?.data as ApiErrorResponse
      throw new Error(apiError?.error || apiError?.message || 'Đăng nhập thất bại')
    }
  },

  /**
   * Register - Đăng ký tài khoản qua local API route
   */
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    try {
      // Use camelCase for local API route
      const payload = {
        fullName: data.fullName || data.FullName,
        email: data.email || data.Email,
        phone: data.phone || data.Phone,
        password: data.password || data.Password,
        confirmPassword: data.confirmPassword || data.ConfirmPassword,
      }
      
      console.log('🔵 Register Request:', {
        url: '/auth/register',
        payload
      })
      
      const response = await localApiClient.post<RegisterResponse>('/auth/register', payload)
      
      console.log('✅ Register Response:', response.data)
      return response.data
    } catch (error: any) {
      console.error('❌ Register Error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      })
      
      const apiError = error.response?.data as ApiErrorResponse
      throw new Error(apiError?.error || apiError?.message || 'Đăng ký thất bại')
    }
  },

  /**
   * Logout - Đăng xuất
   */
  logout: async (): Promise<void> => {
    try {
      await iamClient.post(iamEndpoints.auth.logout)
    } catch (error: any) {
      console.error('Logout error:', error)
      // Silent fail - vẫn clear local state
    }
  },

  /**
   * Get current user info
   */
  me: async () => {
    try {
      const response = await iamClient.get(iamEndpoints.auth.me)
      return response.data
    } catch (error: any) {
      const apiError = error.response?.data as ApiErrorResponse
      throw new Error(apiError?.error || apiError?.message || 'Không thể lấy thông tin user')
    }
  },

  /**
   * Refresh token
   */
  refreshToken: async (refreshToken: string) => {
    try {
      const response = await iamClient.post(iamEndpoints.auth.refreshToken, { refreshToken })
      return response.data
    } catch (error: any) {
      const apiError = error.response?.data as ApiErrorResponse
      throw new Error(apiError?.error || apiError?.message || 'Refresh token thất bại')
    }
  },

  /**
   * Forgot password - Gửi OTP về email
   */
  forgotPassword: async (email: string) => {
    try {
      const response = await localApiClient.post('/auth/forgot-password', { email })
      return response.data
    } catch (error: any) {
      const apiError = error.response?.data as ApiErrorResponse
      throw new Error(apiError?.error || apiError?.message || 'Không thể gửi OTP. Vui lòng thử lại.')
    }
  },

  /**
   * Reset password với OTP
   */
  resetPassword: async (email: string, otp: string, newPassword: string) => {
    try {
      const response = await localApiClient.post('/auth/reset-password', { 
        email,
        otp,
        newPassword 
      })
      return response.data
    } catch (error: any) {
      const apiError = error.response?.data as ApiErrorResponse
      throw new Error(apiError?.error || apiError?.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.')
    }
  },

  /**
   * Verify email với OTP
   */
  verifyEmail: async (email: string, otp: string) => {
    try {
      const response = await localApiClient.post('/auth/verify-email', { 
        email,
        otp
      })
      return response.data
    } catch (error: any) {
      const apiError = error.response?.data as ApiErrorResponse
      throw new Error(apiError?.error || apiError?.message || 'Xác thực email thất bại.')
    }
  },

  /**
   * Resend email OTP
   */
  resendEmailOtp: async (email: string) => {
    try {
      const response = await localApiClient.post('/auth/resend-email-otp', { email })
      return response.data
    } catch (error: any) {
      const apiError = error.response?.data as ApiErrorResponse
      throw new Error(apiError?.error || apiError?.message || 'Không thể gửi lại OTP.')
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: { name: string; email: string; phone: string }) => {
    try {
      const response = await localApiClient.put('/auth/update-profile', data)
      return response.data
    } catch (error: any) {
      const apiError = error.response?.data as ApiErrorResponse
      throw new Error(apiError?.error || apiError?.message || 'Không thể cập nhật thông tin. Vui lòng thử lại.')
    }
  },
}

export default authService
