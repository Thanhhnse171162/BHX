'use client'

import { useState } from 'react'
import { useAuth } from '@/shared/hooks/useAuth'
import { useAuthStore } from '@/store/auth.store'
import { authService } from '@/services/auth.service'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Avatar } from '@/shared/ui/Avatar'
import { User, Mail, Phone, Building, IdCard, Save, X, Lock, Eye, EyeOff } from 'lucide-react'

export default function WarehouseProfilePage() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    employeeId: 'BK02',
    department: 'Warehouse',
  })

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSaveProfile = async () => {
    const newErrors: Record<string, string> = {}
    
    if (!profileForm.name.trim()) {
      newErrors.name = 'Vui lòng nhập họ tên'
    }
    if (!profileForm.email.trim()) {
      newErrors.email = 'Vui lòng nhập email'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email)) {
      newErrors.email = 'Email không hợp lệ'
    }
    if (profileForm.phone && !/^[0-9]{10}$/.test(profileForm.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Số điện thoại không hợp lệ (10 chữ số)'
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
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
        
        setIsEditing(false)
        alert(response.message || 'Cập nhật thông tin thành công!')
      } catch (error: any) {
        alert(error.message || 'Có lỗi xảy ra. Vui lòng thử lại!')
      } finally {
        setIsSaving(false)
      }
    }
  }

  const handleChangePassword = () => {
    const newErrors: Record<string, string> = {}
    
    if (!passwordForm.currentPassword) {
      newErrors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại'
    }
    if (!passwordForm.newPassword) {
      newErrors.newPassword = 'Vui lòng nhập mật khẩu mới'
    } else if (passwordForm.newPassword.length < 6) {
      newErrors.newPassword = 'Mật khẩu phải có ít nhất 6 ký tự'
    }
    if (!passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới'
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp'
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      // TODO: Change password via API
      console.log('Changing password')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setShowPasswordSection(false)
      alert('Đổi mật khẩu thành công!')
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Thông tin cá nhân</h1>
        <p className="text-gray-600 mt-1">Quản lý thông tin tài khoản của bạn</p>
      </div>

      {/* Profile Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        {/* Avatar Section */}
        <div className="flex items-start gap-6 pb-6 border-b border-gray-200">
          <Avatar name={profileForm.name} size="lg" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{profileForm.name}</h3>
            <p className="text-sm text-gray-600">{profileForm.email}</p>
            <p className="text-sm text-gray-500 mt-1">
              {profileForm.department} | ID: {profileForm.employeeId}
            </p>
          </div>
          {!isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              size="sm"
            >
              <User className="w-4 h-4 mr-2" />
              Chỉnh sửa
            </Button>
          )}
        </div>

        {/* Profile Form */}
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Họ và tên
              </label>
              <Input
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                disabled={!isEditing}
                error={errors.name}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </label>
              <Input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                disabled={!isEditing}
                error={errors.email}
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Số điện thoại
              </label>
              <Input
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                disabled={!isEditing}
                error={errors.phone}
              />
            </div>

            {/* Employee ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <IdCard className="w-4 h-4 inline mr-2" />
                Mã nhân viên
              </label>
              <Input
                value={profileForm.employeeId} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
              <Button
                onClick={() => {
                  setIsEditing(false)
                  setProfileForm({
                    name: user?.name || '',
                    email: user?.email || '',
                    phone: user?.phone || '',
                    employeeId: 'BK02',
                    department: 'Warehouse',
                  })
                  setErrors({})
                }}
                variant="outline"
                disabled={isSaving}

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-3 pt-4">
              <Button onClick={handleSaveProfile}>
                <Save className="w-4 h-4 mr-2" />
                Lưu thay đổi
              </Button>
              <Button
                onClick={() => {
                  setIsEditing(false)
                  setProfileForm({
                    name: user?.name || 'Đỗ Văn Kho',
                    email: user?.email || 'dovankho@company.com',
                    phone: '0901234567',
                    employeeId: 'BK02',
                    department: 'Warehouse',
                  })
                  setErrors({})
                }}
                variant="outline"
              >
                <X className="w-4 h-4 mr-2" />
                Hủy
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Password Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Bảo mật</h3>
            <p className="text-sm text-gray-600 mt-1">Quản lý mật khẩu tài khoản</p>
          </div>
          {!showPasswordSection && (
            <Button
              onClick={() => setShowPasswordSection(true)}
              variant="outline"
              size="sm"
            >
              <Lock className="w-4 h-4 mr-2" />
              Đổi mật khẩu
            </Button>
          )}
        </div>

        {showPasswordSection && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu hiện tại
              </label>
              <div className="relative">
                <Input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  error={errors.currentPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu mới
              </label>
              <div className="relative">
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  error={errors.newPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Xác nhận mật khẩu mới
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  error={errors.confirmPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button onClick={handleChangePassword}>
                <Save className="w-4 h-4 mr-2" />
                Đổi mật khẩu
              </Button>
              <Button
                onClick={() => {
                  setShowPasswordSection(false)
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
                  setErrors({})
                }}
                variant="outline"
              >
                <X className="w-4 h-4 mr-2" />
                Hủy
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
