'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Avatar } from '@/shared/ui/Avatar'
import { ToastContainer, ToastItem } from '@/shared/ui/Toast'
import { useAuth } from '@/shared/hooks/useAuth'
import { useAuthStore } from '@/store/auth.store'
import { authService } from '@/services/auth.service'
import { Save, X, Edit2, Mail, CheckCircle2, AlertCircle } from 'lucide-react'

export default function CustomerProfilePage() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  })
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({})

  // Email verification state
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false)
  const [verifyOtp, setVerifyOtp] = useState('')
  const [verifyOtpError, setVerifyOtpError] = useState('')
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [isResendingOtp, setIsResendingOtp] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [isEmailVerified, setIsEmailVerified] = useState(user?.emailVerified || false)

  // Loading states
  const [isSaving, setIsSaving] = useState(false)

  // Countdown for resend OTP
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [resendCooldown])

  // Sync email verification status with user object
  useEffect(() => {
    setIsEmailVerified(user?.emailVerified || false)
  }, [user?.emailVerified])

  const addToast = (message: string, type: ToastItem['type'] = 'info') => {
    const id = Date.now().toString()
    setToasts((prev) => [...prev, { id, message, type, onClose: () => removeToast(id) }])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const handleAvatarChange = (file: File) => {
    // TODO: Upload avatar to server
    console.log('Uploading avatar:', file)
    addToast('Đang upload ảnh đại diện...', 'info')
    
    // Simulate upload
    setTimeout(() => {
      addToast('Cập nhật ảnh đại diện thành công!', 'success')
    }, 1500)
  }

  
  const handleVerifyEmail = async () => {
    if (!verifyOtp || verifyOtp.length !== 6) {
      setVerifyOtpError('Vui lòng nhập mã OTP 6 số')
      return
    }

    setIsVerifyingOtp(true)
    setVerifyOtpError('')

    try {
      const response = await authService.verifyEmail(user?.email || '', verifyOtp)
      addToast(response.message || 'Xác thực email thành công!', 'success')
      setIsEmailVerified(true)
      setIsVerifyingEmail(false)
      setVerifyOtp('')
      
      // Update user object in auth store with emailVerified = true
      if (user) {
        useAuthStore.getState().setUser({
          ...user,
          emailVerified: true
        })
      }
    } catch (error: any) {
      setVerifyOtpError(error.message || 'Xác thực thất bại. Vui lòng thử lại.')
      addToast(error.message || 'Xác thực thất bại', 'error')
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return

    setIsResendingOtp(true)
    setVerifyOtpError('')

    try {
      const response = await authService.resendEmailOtp(user?.email || '')
      addToast(response.message || 'Mã OTP mới đã được gửi đến email của bạn', 'success')
      setResendCooldown(60) // 60 seconds cooldown
    } catch (error: any) {
      addToast(error.message || 'Không thể gửi lại OTP', 'error')
    } finally {
      setIsResendingOtp(false)
    }
  }

  const validateProfile = () => {
    const errors: Record<string, string> = {}
    if (!profileForm.name.trim()) {
      errors.name = 'Vui lòng nhập họ tên'
    }
    if (!profileForm.email.trim()) {
      errors.email = 'Vui lòng nhập email'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email)) {
      errors.email = 'Email không hợp lệ'
    }
    if (profileForm.phone && !/^[0-9]{10}$/.test(profileForm.phone.replace(/\s/g, ''))) {
      errors.phone = 'Số điện thoại không hợp lệ'
    }
    setProfileErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSaveProfile = async () => {
    if (!validateProfile()) return

    setIsSaving(true)
    try {
      const response = await authService.updateProfile({
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone,
      })
      
      // Update user in auth store
      if (user) {
        useAuthStore.getState().setUser({
          ...user,
          name: profileForm.name,
          email: profileForm.email,
          phone: profileForm.phone,
        })
      }
      
      addToast(response.message || 'Cập nhật thông tin thành công!', 'success')
      setIsEditing(false)
    } catch (error: any) {
      addToast(error.message || 'Có lỗi xảy ra. Vui lòng thử lại!', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setProfileForm({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    })
    setProfileErrors({})
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <PageHeader
          title="Tài khoản của tôi"
          subtitle="Quản lý thông tin cá nhân"
          breadcrumbs={[
            { label: 'Trang chủ', href: '/customer' },
            { label: 'Tài khoản', href: '/customer/profile' },
          ]}
        />

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Avatar
              src={user?.avatar}
              name={user?.name}
              size="xl"
              editable={true}
              onImageChange={handleAvatarChange}
            />
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold text-gray-900">{user?.name || 'Khách hàng'}</h2>
              <p className="text-gray-600 mt-1">{user?.email || 'No email'}</p>
              <p className="text-sm text-gray-500 mt-2">
                Tham gia từ {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
              </p>
            </div>
            {!isEditing && (
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Chỉnh sửa
              </Button>
            )}
          </div>
        </div>

        {/* Profile Content */}
        <div className="mt-6">
          {
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Thông tin cá nhân</h3>
              
              <div className="space-y-6">
                <Input
                  label="Họ và tên"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  error={profileErrors.name}
                  disabled={!isEditing}
                  placeholder="Nhập họ và tên"
                />

                <Input
                  label="Email"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  error={profileErrors.email}
                  disabled={!isEditing}
                  placeholder="Nhập email"
                />

                {/* Email Verification Section */}
                <div className="pt-2">
                  {isEmailVerified ? (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-sm font-medium text-green-700">Email đã được xác thực</span>
                    </div>
                  ) : (
                    <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                      <div className="flex items-start gap-3 mb-3">
                        <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-orange-900">Email chưa được xác thực</p>
                          <p className="text-xs text-orange-700 mt-1">
                            Vui lòng xác thực email để tăng cường bảo mật tài khoản
                          </p>
                        </div>
                      </div>

                      {!isVerifyingEmail ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsVerifyingEmail(true)}
                          className="w-full gap-2"
                        >
                          <Mail className="w-4 h-4" />
                          Xác thực Email
                        </Button>
                      ) : (
                        <div className="space-y-3 mt-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Mã OTP
                            </label>
                            <Input
                              value={verifyOtp}
                              onChange={(e) => {
                                setVerifyOtp(e.target.value)
                                setVerifyOtpError('')
                              }}
                              error={verifyOtpError}
                              placeholder="Nhập mã OTP 6 số"
                              maxLength={6}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Mã OTP đã được gửi đến email của bạn
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={handleVerifyEmail}
                              disabled={isVerifyingOtp || !verifyOtp || verifyOtp.length !== 6}
                              className="flex-1"
                            >
                              {isVerifyingOtp ? 'Đang xác thực...' : 'Xác thực'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setIsVerifyingEmail(false)
                                setVerifyOtp('')
                                setVerifyOtpError('')
                              }}
                              disabled={isVerifyingOtp}
                              className="flex-1"
                            >
                              Hủy
                            </Button>
                          </div>

                          <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={resendCooldown > 0 || isResendingOtp}
                            className="text-xs text-emerald-600 hover:text-emerald-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                          >
                            {isResendingOtp ? 'Đang gửi...' : resendCooldown > 0 ? `Gửi lại OTP (${resendCooldown}s)` : 'Gửi lại mã OTP'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Input
                  label="Số điện thoại"
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  error={profileErrors.phone}
                  disabled={!isEditing}
                  placeholder="Nhập số điện thoại"
                />

                {isEditing && (
                  <div className="flex items-center gap-3 pt-4">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="gap-2"
                    >
                      <X className="w-4 h-4" />
                      Hủy
                    </Button>
                  </div>
                )}
              </div>
            </div>
          }
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}


