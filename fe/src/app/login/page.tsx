'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Checkbox } from '@/shared/ui/Checkbox'
import { useAuth } from '@/shared/hooks/useAuth'
import { rolePermissions } from '@/shared/auth/permission-map'
import { authService } from '@/services/auth.service'
import { getRoleFromId, getRedirectPath, isStaffUser, isWarehouseStaffUser, isWarehouseManagerUser, isStoreManagerUser, resolveRole } from '@/shared/utils/role'
import type { User, UserRole } from '@/shared/types'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()

  const [emailOrPhone, setEmailOrPhone] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasError, setHasError] = useState(false)

  // Prefetch routes để giảm độ trễ khi chuyển trang
  useEffect(() => {
    router.prefetch('/admin/dashboard')
    router.prefetch('/cashier')
    router.prefetch('/ops')
    router.prefetch('/customer')
    router.prefetch('/staff')
    router.prefetch('/warehouse')
    router.prefetch('/warehouse-store')
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    console.log('Login form submitted')
    
    // Reset error state
    setError('')
    setHasError(false)

    // Validation
    if (!emailOrPhone || !password) {
      console.log('Validation failed: empty fields')
      setError('Vui lòng nhập đầy đủ thông tin')
      setHasError(true)
      return
    }

    setLoading(true)
    console.log('Calling auth service...')

    try {
      // Gọi backend IAM microservice thông qua authService
      const data = await authService.login({
        email: emailOrPhone.trim(),
        password: password,
      })

      console.log('Login successful:', data)

      // Backend trả về: { success, message, data: { accessToken, email, fullName, roleId } }
      const responseData = data.data || data
      const token = responseData.accessToken || data.accessToken || data.token

      if (!token) {
        throw new Error('Không nhận được token từ server')
      }

      const roleId = responseData.roleId || 4
      const userEmail = responseData.email || emailOrPhone.trim()
      const userRole = resolveRole(roleId, userEmail)

      // Tạo user object và login song song
      const user: User = {
        id: responseData.userId || responseData.id || userEmail,
        name: responseData.fullName || responseData.name || 'User',
        email: userEmail,
        role: userRole,
        roleId: roleId,
        permissions: rolePermissions[userRole as keyof typeof rolePermissions] ?? rolePermissions.CUSTOMER,
        createdAt: responseData.createdAt || new Date().toISOString(),
        updatedAt: responseData.updatedAt || new Date().toISOString(),
      }

      // Update auth state
      login(user, token)

      // Kiểm tra nếu là Store Staff (role 3) với email @company.com thì redirect đến /cashier
      if (isStaffUser(roleId, userEmail)) {
        router.replace('/cashier')
      }
      // Kiểm tra nếu là Store Manager (role 2) với email @company.com thì redirect đến /ops
      else if (isStoreManagerUser(roleId, userEmail)) {
        router.replace('/ops')
      }
      // Kiểm tra nếu là WAREHOUSE_STAFF (role 4) với email @company.com thì redirect đến /warehouse-store
      else if (isWarehouseStaffUser(roleId, userEmail)) {
        router.replace('/warehouse-store')
      } else {
        // Sử dụng helper function để redirect
        const redirectPath = getRedirectPath(userRole)
        router.replace(redirectPath)
      }
    } catch (err: any) {
      console.error('Login error:', err)
      const errorMessage = err.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.'
      console.log('Setting error message:', errorMessage)
      setError(errorMessage)
      setHasError(true)
    } finally {
      setLoading(false)
      console.log('Login process finished')
    }
  }

  const goBackToHomepage = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Brand Section */}
      <div 
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{
          backgroundImage: 'url(/backgrpng.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Overlay để làm tối background image một chút */}
        <div className="absolute inset-0" />
        
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 opacity-10">
          {/* Grid Pattern */}
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }} />
        </div>
        
        {/* Organic Shapes for Depth */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-32 w-80 h-80 bg-[#7cc85e]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-yellow-400/10 rounded-full blur-3xl" />
        
        {/* Subtle Wave Pattern */}
        <div className="absolute bottom-0 left-0 right-0 h-32 opacity-5">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path d="M0 48L60 56C120 64 240 80 360 80C480 80 600 64 720 58.7C840 53 960 59 1080 64C1200 69 1320 75 1380 77.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V48Z" fill="white"/>
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center px-12 py-16 text-white w-full h-full">
          <div className="space-y-12 max-w-2xl mx-auto text-center">
            {/* Logo */}
            <div className="inline-flex items-center gap-3 text-white text-lg font-bold tracking-wide">
              <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-lg">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
          </svg>
              </div>
              <span className="text-shadow">BÁCH HÓA XANH</span>
            </div>

            {/* Main Content */}
            <div className="space-y-5">
              <h1 className="text-6xl font-extrabold leading-[1.1] tracking-tight drop-shadow-lg">
          Chào mừng<br />
          <span className="text-yellow-300/90">quay lại</span>
              </h1>
              
              <p className="text-xl text-white/90 leading-relaxed font-light">
          Mua sắm thực phẩm tươi mỗi ngày
              </p>
            </div>

            {/* Feature Icons */}
            <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
              <div className="flex flex-col items-center text-center space-y-3 group">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-xl flex items-center justify-center transform group-hover:scale-110 transition-all duration-300 group-hover:shadow-2xl">
            <svg className="w-8 h-8 text-[#5a9e3e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-white/95 leading-tight">Thực phẩm<br />tươi sống</p>
              </div>
              
              <div className="flex flex-col items-center text-center space-y-3 group">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-xl flex items-center justify-center transform group-hover:scale-110 transition-all duration-300 group-hover:shadow-2xl">
            <svg className="w-8 h-8 text-[#5a9e3e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-white/95 leading-tight">Giao hàng<br />2 giờ</p>
              </div>
              
              <div className="flex flex-col items-center text-center space-y-3 group">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-xl flex items-center justify-center transform group-hover:scale-110 transition-all duration-300 group-hover:shadow-2xl">
            <svg className="w-8 h-8 text-[#5a9e3e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-white/95 leading-tight">Giá cả<br />hợp lý</p>
              </div>
            </div>
          </div>
        </div>
            </div>


      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50 lg:px-12">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <button
            onClick={goBackToHomepage}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
            aria-label="Quay lại trang chủ"
          >
            <svg 
              className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-sm font-medium">Quay lại trang chủ</span>
          </button>

          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
        <div className="inline-flex items-center gap-2 text-[#7cc85e] text-lg font-bold mb-2">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
              </svg>
              BÁCH HÓA XANH
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-10">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Đăng nhập khách hàng
              </h2>
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <svg className="w-4 h-4 text-[#0F8A5F]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Giao hàng nhanh trong 2 giờ
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form 
              onSubmit={handleSubmit} 
              className="space-y-5" 
              autoComplete="off" 
              noValidate
              onReset={(e) => e.preventDefault()}
            >
              {/* Hidden inputs to trick browser */}
              <input type="text" name="fakeusername" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
              <input type="password" name="fakepassword" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
              
              <Input
                label="Số điện thoại hoặc Email"
                type="text"
                name="username-field"
                placeholder="0901234567 hoặc email@example.com"
                value={emailOrPhone}
                onChange={(e) => {
                  setEmailOrPhone(e.target.value)
                  if (hasError) {
                    setError('')
                    setHasError(false)
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    e.stopPropagation()
                    if (!loading && emailOrPhone && password) {
                      handleSubmit(e as any)
                    }
                  }
                }}
                required
                autoComplete="off"
                data-lpignore="true"
                data-form-type="other"
                className={`${hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-[#0F8A5F] focus:ring-[#0F8A5F]'}`}
              />

              <Input
                label="Mật khẩu"
                type="password"
                name="password-field"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (hasError) {
                    setError('')
                    setHasError(false)
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    e.stopPropagation()
                    if (!loading && emailOrPhone && password) {
                      handleSubmit(e as any)
                    }
                  }
                }}
                required
                autoComplete="off"
                data-lpignore="true"
                data-form-type="other"
                className={`${hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-[#0F8A5F] focus:ring-[#0F8A5F]'}`}
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <label htmlFor="rememberMe" className="text-sm text-gray-700 cursor-pointer">
                    Ghi nhớ đăng nhập
                  </label>
                </div>
                
                <Link
                  href="/forgot-password"
                  className="text-sm text-[#0F8A5F] hover:text-[#0B6B4B] font-medium transition-colors"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-[#0F8A5F] hover:bg-[#0B6B4B] text-white disabled:opacity-50 disabled:cursor-not-allowed" 
                size="lg"
                disabled={loading || !emailOrPhone || !password}
                onClick={(e) => {
                  if (loading) {
                    e.preventDefault()
                    e.stopPropagation()
                  }
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Đang đăng nhập...
                  </span>
                ) : (
                  'Đăng nhập'
                )}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Chưa có tài khoản?{' '}
                <Link 
                  href="/register" 
                  className="text-[#0F8A5F] hover:text-[#0B6B4B] font-semibold transition-colors"
                >
                  Đăng ký ngay
                </Link>
              </p>
            </div>
          </div>

          {/* Terms */}
          <div className="mt-6 text-center text-xs text-gray-500">
            <p>Bằng việc đăng nhập, bạn đồng ý với</p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <a href="#" className="text-[#0F8A5F] hover:underline">
                Điều khoản sử dụng
              </a>
              <span>và</span>
              <a href="#" className="text-[#0F8A5F] hover:underline">
                Chính sách bảo mật
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
