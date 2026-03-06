'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Tabs, Tab } from '@/shared/ui/Tabs'
import { Avatar } from '@/shared/ui/Avatar'
import { PasswordInput } from '@/shared/ui/PasswordInput'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { ToastContainer, ToastItem } from '@/shared/ui/Toast'
import { useAuth } from '@/shared/hooks/useAuth'
import { useAuthStore } from '@/store/auth.store'
import { authService } from '@/services/auth.service'
import { User, Shield, Activity, Save, X, Edit2, Mail, CheckCircle2, AlertCircle } from 'lucide-react'

type TabKey = 'profile' | 'security' | 'activity'

export default function CustomerProfilePage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<TabKey>('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
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

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({})
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Loading states
  const [isSaving, setIsSaving] = useState(false)

  // Countdown for resend OTP
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  // Sync email verification status with user object
  useEffect(() => {
    setIsEmailVerified(user?.emailVerified || false)
  }, [user?.emailVerified])

  // Mock activity data
  const activities = [
    { id: 1, action: 'Đăng nhập', time: '5/2/2026, 10:30 AM', device: 'Chrome - Windows', location: 'TP.HCM' },
    { id: 2, action: 'Cập nhật thông tin', time: '1/2/2026, 3:15 PM', device: 'Chrome - Windows', location: 'TP.HCM' },
    { id: 3, action: 'Đổi mật khẩu', time: '28/1/2026, 9:20 AM', device: 'Safari - iPhone', location: 'TP.HCM' },
  ]

  const tabs: Tab[] = [
    { key: 'profile', label: 'Thông tin cá nhân', icon: <User className="w-5 h-5" /> },
    { key: 'security', label: 'Bảo mật', icon: <Shield className="w-5 h-5" /> },
    { key: 'activity', label: 'Hoạt động', icon: <Activity className="w-5 h-5" />, badge: activities.length },
  ]

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

  const validatePassword = () => {
    const errors: Record<string, string> = {}
    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại'
    }
    if (!passwordForm.newPassword) {
      errors.newPassword = 'Vui lòng nhập mật khẩu mới'
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword = 'Mật khẩu phải có ít nhất 8 ký tự'
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp'
    }
    setPasswordErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSaveProfile = async () => {
    if (!validateProfile()) return

    setIsSaving(true)
    try {
      // TODO: Call API to update profile
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      addToast('Cập nhật thông tin thành công!', 'success')
      setIsEditing(false)
    } catch (error) {
      addToast('Có lỗi xảy ra. Vui lòng thử lại!', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!validatePassword()) return

    setShowConfirmDialog(false)
    setIsSaving(true)
    
    try {
      // TODO: Call API to change password
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      addToast('Đổi mật khẩu thành công!', 'success')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setIsChangingPassword(false)
    } catch (error) {
      addToast('Có lỗi xảy ra. Vui lòng thử lại!', 'error')
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
          subtitle="Quản lý thông tin cá nhân và bảo mật"
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
            {!isEditing && activeTab === 'profile' && (
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

        {/* Tabs */}
        <Tabs tabs={tabs} activeTab={activeTab} onChange={(key) => setActiveTab(key as TabKey)} />

        {/* Tab Content */}
        <div className="mt-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
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
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Bảo mật tài khoản</h3>
              
              {!isChangingPassword ? (
                <div>
                  <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg mb-6">
                    <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900">Mật khẩu hiện tại</p>
                      <p className="text-sm text-blue-700 mt-1">••••••••</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsChangingPassword(true)}
                    >
                      Đổi mật khẩu
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Xác thực 2 lớp</p>
                        <p className="text-sm text-gray-500 mt-1">Tăng cường bảo mật cho tài khoản</p>
                      </div>
                      <Button variant="outline" size="sm">Bật</Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <PasswordInput
                    label="Mật khẩu hiện tại"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    error={passwordErrors.currentPassword}
                    placeholder="Nhập mật khẩu hiện tại"
                  />

                  <PasswordInput
                    label="Mật khẩu mới"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    error={passwordErrors.newPassword}
                    placeholder="Nhập mật khẩu mới"
                    showStrength={true}
                  />

                  <PasswordInput
                    label="Xác nhận mật khẩu mới"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    error={passwordErrors.confirmPassword}
                    placeholder="Nhập lại mật khẩu mới"
                  />

                  <div className="flex items-center gap-3 pt-4">
                    <Button
                      onClick={() => setShowConfirmDialog(true)}
                      disabled={isSaving}
                    >
                      {isSaving ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsChangingPassword(false)
                        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
                        setPasswordErrors({})
                      }}
                      disabled={isSaving}
                    >
                      Hủy
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Lịch sử hoạt động</h3>
              
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Activity className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{activity.action}</p>
                      <p className="text-sm text-gray-500 mt-1">{activity.time}</p>
                      <p className="text-sm text-gray-500">{activity.device} • {activity.location}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Xác nhận đổi mật khẩu"
        message="Bạn có chắc chắn muốn đổi mật khẩu? Bạn sẽ cần đăng nhập lại sau khi đổi mật khẩu."
        confirmText="Đồng ý"
        cancelText="Hủy"
        type="warning"
        onConfirm={handleChangePassword}
        onCancel={() => setShowConfirmDialog(false)}
        loading={isSaving}
      />

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}


